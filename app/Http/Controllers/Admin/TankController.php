<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Tank;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TankController extends Controller
{
    public function index(Request $request)
    {
        $query = Tank::with('product');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('product', function ($q) use ($search) {
                      $q->where('name', 'like', '%' . $search . '%');
                  });
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $tanks = $query->latest()->paginate($perPage)->withQueryString();

        // UPDATE: Fetch products that are either 'fuel' or 'gas'
        $fuelProducts = Product::where('is_active', true)->whereHas('category', function($q) {
            $q->whereIn('type', ['fuel', 'gas']);
        })->get(['id', 'name', 'unit']);

        return Inertia::render('Admin/Tank/Index', [
            'tanks' => $tanks,
            'fuelProducts' => $fuelProducts,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tanks,name',
            'product_id' => 'required|exists:products,id',
            'capacity' => 'required|numeric|min:1',
            'current_stock' => 'nullable|numeric|min:0', // Opening stock during setup
        ]);

        Tank::create([
            'name' => $validated['name'],
            'product_id' => $validated['product_id'],
            'capacity' => $validated['capacity'],
            'current_stock' => $validated['current_stock'] ?? 0,
        ]);

        return redirect()->back();
    }

    public function update(Request $request, Tank $tank)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:tanks,name,' . $tank->id,
            'product_id' => 'required|exists:products,id',
            'capacity' => 'required|numeric|min:1',
            'current_stock' => 'nullable|numeric|min:0',
        ]);

        $tank->update($validated);

        return redirect()->back();
    }

    public function destroy(Tank $tank)
    {
        $tank->delete();
        return redirect()->back();
    }
}
