<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FuelPriceController extends Controller
{
    public function index()
    {
        // Fetch ONLY FUEL products
        $fuelProducts = Product::where('is_active',true)->whereHas('category', function($q) {
            $q->where('type', 'fuel');
        })->get(['id', 'name', 'unit', 'buying_price', 'selling_price']);

        return Inertia::render('Admin/FuelPrice/Index', [
            'fuelProducts' => $fuelProducts,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'prices' => 'required|array',
            'prices.*.id' => 'required|exists:products,id',
            'prices.*.buying_price' => 'required|numeric|min:0',
            'prices.*.selling_price' => 'required|numeric|min:0',
        ]);

        // Bulk update the prices
        foreach ($validated['prices'] as $item) {
            Product::where('id', $item['id'])->update([
                'buying_price' => $item['buying_price'],
                'selling_price' => $item['selling_price'],
            ]);
        }

        return redirect()->back();
    }
}