<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use App\Models\Party;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::with('user');

        // Search logic
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%');
            })->orWhere('id', 'like', '%' . $search . '%');
        }

        $perPage = $request->per_page ?? 10;
        $shifts = $query->latest()->paginate($perPage === 'all' ? 100000 : $perPage)->withQueryString();

        // Fetch staff from parties table
        $users = Party::where('type', 'staff')->get(['id', 'name', 'phone']);

        return Inertia::render('Admin/Shift/Index', [
            'shifts'  => $shifts,
            'users'   => $users,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id'    => 'required|exists:parties,id',
            'start_time' => 'required|date',
        ]);

        Shift::create([
            'user_id'          => $validated['user_id'],
            'start_time'       => Carbon::parse($validated['start_time']),
            'status'           => 'open',
            'total_sales'      => 0,
            'total_collection' => 0,
        ]);

        return redirect()->back()->with('success', 'Shift started successfully.');
    }

    public function show($id)
    {
        $shift = Shift::with(['user', 'nozzleReadings.nozzle.tank.product', 'invoices.customer'])
            ->findOrFail($id);

        return Inertia::render('Admin/Shift/Show', [
            'shift' => $shift,
        ]);
    }

    public function update(Request $request, Shift $shift)
    {
        $validated = $request->validate([
            'user_id'    => 'required|exists:parties,id', // parties টেবিল থেকে ভ্যালিডেশন
            'start_time' => 'required|date',
        ]);

        $shift->update([
            'user_id'    => $validated['user_id'],
            'start_time' => Carbon::parse($validated['start_time']),
        ]);

        return redirect()->back()->with('success', 'Shift updated successfully.');
    }

    // Custom method to close a shift safely
    public function closeShift(Request $request, Shift $shift)
    {
        $invoiceSales = $shift->invoices()->sum('grand_total');
        $invoicePaid  = $shift->invoices()->sum('paid_amount');

        $nozzleSales = method_exists($shift, 'nozzleReadings') ? $shift->nozzleReadings()->sum('total_amount') : 0;

        $finalSales = max($shift->total_sales, $invoiceSales, $nozzleSales);
        $finalCollection = max($shift->total_collection, $invoicePaid);

        $shift->update([
            'end_time'         => now(),
            'status'           => 'closed',
            'total_sales'      => $finalSales,
            'total_collection' => $finalCollection,
        ]);

        return redirect()->back()->with('success', 'Shift closed successfully.');
    }

    public function destroy(Shift $shift)
    {
        $shift->delete();
        return redirect()->back()->with('success', 'Shift deleted successfully.');
    }
}
