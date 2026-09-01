<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Nozzle;
use App\Models\NozzleReading;
use App\Models\Shift;
use App\Models\StockLedger;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class NozzleReadingController extends Controller
{
    public function index(Request $request)
    {
        $query = NozzleReading::with(['nozzle.tank.product', 'shift.user']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->whereHas('nozzle', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            });
        }

        $perPage = $request->per_page ?? 10;
        $readings = $query->latest()->paginate($perPage === 'all' ? 100000 : $perPage)->withQueryString();

        $openShifts = Shift::where('status', 'open')->with('user')->orderBy('id', 'desc')->get();
        $nozzles = Nozzle::with('tank.product')->where('is_active', true)->get();

        return Inertia::render('Admin/NozzleReading/Index', [
            'readings'   => $readings,
            'openShifts' => $openShifts,
            'nozzles'    => $nozzles,
            'filters'    => $request->only(['search', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'shift_id'    => 'required|exists:shifts,id',
            'nozzle_id'   => 'required|exists:nozzles,id',
            'end_meter'   => 'required|numeric|min:0',
            'testing_qty' => 'nullable|numeric|min:0',
        ]);

        $shift = Shift::findOrFail($request->shift_id);

        if ($shift->status !== 'open') {
            return redirect()->back()->withErrors(['error' => 'Security Error: You cannot add meter readings to a closed shift!']);
        }

        try {
            DB::beginTransaction();

            $nozzle       = Nozzle::with('tank.product')->findOrFail($request->nozzle_id);
            $start_meter  = $nozzle->current_meter;
            $end_meter    = $request->end_meter;
            $testing_qty  = $request->testing_qty ?? 0;

            if ($end_meter < $start_meter) {
                return redirect()->back()->withErrors(['end_meter' => 'End meter cannot be less than start meter.']);
            }

            $sold_qty     = $end_meter - $start_meter - $testing_qty;
            $unit_price   = $nozzle->tank->product->selling_price;
            $total_amount = $sold_qty * $unit_price;

            $reading = NozzleReading::create([
                'shift_id'    => $shift->id,
                'nozzle_id'   => $nozzle->id,
                'start_meter' => $start_meter,
                'end_meter'   => $end_meter,
                'testing_qty' => $testing_qty,
                'unit_price'  => $unit_price,
            ]);

            $nozzle->update(['current_meter' => $end_meter]);

            $nozzle->tank->decrement('current_stock', $sold_qty);

            if (\Schema::hasColumn('products', 'current_stock')) {
                $nozzle->tank->product->decrement('current_stock', $sold_qty);
            }

            $shift->increment('total_sales', $total_amount);

            StockLedger::create([
                'product_id' => $nozzle->tank->product_id,
                'tank_id'    => $nozzle->tank_id,
                'type'       => 'out',
                'quantity'   => $sold_qty,
                'source'     => 'sales',
                'date'       => now(),
            ]);

            Transaction::create([
                'voucher_no'     => 'VCH-' . strtoupper(uniqid()),
                'date'           => now()->toDateString(),
                'type'           => 'deposit',
                'account_id'     => null,
                'party_id'       => null,
                'user_id'        => auth()->id(),
                'amount'         => $total_amount,
                'payment_method' => 'cash',
                'note'           => "Nozzle Sale [Reading ID: {$reading->id}]: {$nozzle->name} ({$sold_qty} Ltr @ ৳{$unit_price})",
            ]);

            DB::commit();
            return redirect()->back();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Nozzle Reading Error: " . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Something went wrong: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $reading = NozzleReading::with(['nozzle.tank.product', 'shift'])->findOrFail($id);

            $sold_qty     = $reading->sold_qty ?? ($reading->end_meter - $reading->start_meter - $reading->testing_qty);
            $unit_price   = $reading->unit_price ?? $reading->nozzle->tank->product->selling_price;
            $total_amount = $reading->total_amount ?? ($sold_qty * $unit_price);

            $latestReading = NozzleReading::where('nozzle_id', $reading->nozzle_id)->latest('id')->first();
            if ($latestReading && $latestReading->id === $reading->id) {
                $reading->nozzle->update(['current_meter' => $reading->start_meter]);
            }

            $reading->nozzle->tank->increment('current_stock', $sold_qty);

            if (\Schema::hasColumn('products', 'current_stock')) {
                $reading->nozzle->tank->product->increment('current_stock', $sold_qty);
            }

            if ($reading->shift) {
                $reading->shift->decrement('total_sales', $total_amount);
            }

            StockLedger::create([
                'product_id' => $reading->nozzle->tank->product_id,
                'tank_id'    => $reading->nozzle->tank_id,
                'type'       => 'in',
                'quantity'   => $sold_qty,
                'source'     => 'reading_deleted',
                'date'       => now(),
            ]);

            
            Transaction::where('note', 'like', "%[Reading ID: {$reading->id}]%")->delete();

            $reading->delete();

            DB::commit();
            return redirect()->back();

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Nozzle Reading Delete Error: " . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Could not delete reading: ' . $e->getMessage()]);
        }
    }
}
