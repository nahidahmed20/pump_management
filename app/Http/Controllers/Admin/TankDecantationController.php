<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TankDecantation;
use App\Models\Tank;
use App\Models\Product;
use App\Models\Party;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TankDecantationController extends Controller
{
    public function index(Request $request)
    {
        $query = TankDecantation::with(['tank:id,name', 'product:id,name', 'supplier:id,name']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('challan_no', 'like', "%{$search}%")
                  ->orWhere('tank_lorry_no', 'like', "%{$search}%")
                  ->orWhere('driver_name', 'like', "%{$search}%")
                  ->orWhere('unloaded_by', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tank_id')) {
            $query->where('tank_id', $request->tank_id);
        }

        if ($request->filled('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        // Summary statistics for filter period
        $stats = [
            'total_discharges'      => (clone $query)->count(),
            'total_invoice_litres'  => (clone $query)->sum('invoice_qty'),
            'total_received_litres' => (clone $query)->sum('received_qty'),
            'total_variance'        => (clone $query)->sum('variance_qty'),
            'total_shortage'        => (clone $query)->where('variance_qty', '<', 0)->sum('variance_qty'),
            'total_gain'            => (clone $query)->where('variance_qty', '>', 0)->sum('variance_qty'),
        ];

        $perPage = $request->input('per_page', 15);
        $decantations = $query->latest('date')->latest('id')->paginate($perPage === 'all' ? 10000 : (int)$perPage)->withQueryString();

        $tanks = Tank::select('id', 'name', 'product_id', 'current_stock')
            ->with('product:id,name')
            ->get();

        $products = Product::where('is_active', true)
            ->select('id', 'name')
            ->get();

        $suppliers = Party::where('type', 'supplier')
            ->select('id', 'name', 'phone')
            ->get();

        return Inertia::render('Admin/TankDecantation/Index', [
            'decantations' => $decantations,
            'stats'        => $stats,
            'tanks'        => $tanks,
            'products'     => $products,
            'suppliers'    => $suppliers,
            'filters'      => $request->only(['search', 'tank_id', 'product_id', 'date', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'                => 'required|date',
            'challan_no'          => 'nullable|string|max:100',
            'supplier_id'         => 'nullable|exists:parties,id',
            'tank_id'             => 'required|exists:tanks,id',
            'product_id'          => 'required|exists:products,id',
            'tank_lorry_no'       => 'nullable|string|max:100',
            'driver_name'         => 'nullable|string|max:100',
            'driver_phone'        => 'nullable|string|max:25',
            'invoice_qty'         => 'required|numeric|min:0',
            'dip_before_mm'       => 'nullable|numeric|min:0',
            'stock_before_litres' => 'nullable|numeric|min:0',
            'dip_after_mm'        => 'nullable|numeric|min:0',
            'stock_after_litres'  => 'nullable|numeric|min:0',
            'received_qty'        => 'required|numeric|min:0',
            'density'             => 'nullable|numeric',
            'temperature'         => 'nullable|numeric',
            'start_time'          => 'nullable',
            'end_time'            => 'nullable',
            'unloaded_by'         => 'nullable|string|max:100',
            'notes'               => 'nullable|string',
            'sync_tank_stock'     => 'nullable|boolean',
        ]);

        $validated['branch_id'] = $request->user()?->active_branch_id ?? 1;

        // Calculate variance (received - invoice)
        $validated['variance_qty'] = (float)$validated['received_qty'] - (float)$validated['invoice_qty'];

        DB::transaction(function () use ($validated, $request) {
            $decantation = TankDecantation::create($validated);

            // If sync_tank_stock checked, update the tank's current stock to after-unloading litres
            if ($request->boolean('sync_tank_stock') && !empty($validated['stock_after_litres'])) {
                Tank::where('id', $validated['tank_id'])->update([
                    'current_stock' => $validated['stock_after_litres']
                ]);
            }
        });

        return redirect()->back()->with('success', 'Tank lorry decantation log recorded successfully.');
    }

    public function update(Request $request, TankDecantation $tankDecantation)
    {
        $validated = $request->validate([
            'date'                => 'required|date',
            'challan_no'          => 'nullable|string|max:100',
            'supplier_id'         => 'nullable|exists:parties,id',
            'tank_id'             => 'required|exists:tanks,id',
            'product_id'          => 'required|exists:products,id',
            'tank_lorry_no'       => 'nullable|string|max:100',
            'driver_name'         => 'nullable|string|max:100',
            'driver_phone'        => 'nullable|string|max:25',
            'invoice_qty'         => 'required|numeric|min:0',
            'dip_before_mm'       => 'nullable|numeric|min:0',
            'stock_before_litres' => 'nullable|numeric|min:0',
            'dip_after_mm'        => 'nullable|numeric|min:0',
            'stock_after_litres'  => 'nullable|numeric|min:0',
            'received_qty'        => 'required|numeric|min:0',
            'density'             => 'nullable|numeric',
            'temperature'         => 'nullable|numeric',
            'start_time'          => 'nullable',
            'end_time'            => 'nullable',
            'unloaded_by'         => 'nullable|string|max:100',
            'notes'               => 'nullable|string',
            'sync_tank_stock'     => 'nullable|boolean',
        ]);

        $validated['variance_qty'] = (float)$validated['received_qty'] - (float)$validated['invoice_qty'];

        DB::transaction(function () use ($tankDecantation, $validated, $request) {
            $tankDecantation->update($validated);

            if ($request->boolean('sync_tank_stock') && !empty($validated['stock_after_litres'])) {
                Tank::where('id', $validated['tank_id'])->update([
                    'current_stock' => $validated['stock_after_litres']
                ]);
            }
        });

        return redirect()->back()->with('success', 'Tank decantation log updated successfully.');
    }

    public function destroy(TankDecantation $tankDecantation)
    {
        $tankDecantation->delete();
        return redirect()->back()->with('success', 'Tank decantation log removed.');
    }
}

