<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $latestPriceQuery = "(SELECT unit_price FROM purchase_items WHERE purchase_items.product_id = stock_adjustments.product_id ORDER BY id DESC LIMIT 1)";

        $query = DB::table('stock_adjustments')
            ->join('products', 'stock_adjustments.product_id', '=', 'products.id')
            ->select(
                'stock_adjustments.*',
                'products.name as product_name',
                DB::raw("IFNULL($latestPriceQuery, 0) as current_unit_price"),
                DB::raw("(stock_adjustments.quantity * IFNULL($latestPriceQuery, 0)) as total_value")
            );

        // Search Filter
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('stock_adjustments.note', 'like', '%' . $search . '%')
                  ->orWhere('products.name', 'like', '%' . $search . '%');
            });
        }

        // Date-wise Filter
        if ($request->has('start_date') && $request->start_date != '') {
            $query->whereDate('stock_adjustments.date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date != '') {
            $query->whereDate('stock_adjustments.date', '<=', $request->end_date);
        }

        $summaryData = clone $query;
        $allAdjustments = $summaryData->get();

        $summary = [
            'total_shortage_amount' => $allAdjustments->where('type', 'shortage')->sum('total_value'),
            'total_surplus_amount' => $allAdjustments->where('type', 'surplus')->sum('total_value'),
        ];

        $perPage = $request->per_page ?? 10;
        $adjustments = $query->orderBy('stock_adjustments.date', 'desc')
                             ->orderBy('stock_adjustments.id', 'desc')
                             ->paginate($perPage)->withQueryString();

        $products = DB::table('products')->get();

        return Inertia::render('Admin/Stock/Adjustment', [
            'adjustments' => $adjustments,
            'products' => $products,
            'summary' => $summary,
            'filters' => $request->only(['search', 'start_date', 'end_date', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'product_id' => 'required|integer',
            'type' => 'required|in:surplus,shortage',
            'quantity' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            DB::table('stock_adjustments')->insert([
                'date' => $request->date,
                'product_id' => $request->product_id,
                'type' => $request->type,
                'quantity' => $request->quantity,
                'note' => $request->note,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($request->type === 'surplus') {
                DB::table('products')->where('id', $request->product_id)->increment('current_stock', $request->quantity);
            } else {
                DB::table('products')->where('id', $request->product_id)->decrement('current_stock', $request->quantity);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Stock adjusted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to adjust stock!']);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'date' => 'required|date',
            'product_id' => 'required|integer',
            'type' => 'required|in:surplus,shortage',
            'quantity' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
        ]);

        DB::beginTransaction();
        try {
            $oldAdjustment = DB::table('stock_adjustments')->where('id', $id)->first();

            if (!$oldAdjustment) {
                return redirect()->back()->withErrors(['error' => 'Adjustment record not found!']);
            }

            if ($oldAdjustment->type === 'surplus') {
                DB::table('products')->where('id', $oldAdjustment->product_id)->decrement('current_stock', $oldAdjustment->quantity);
            } else {
                DB::table('products')->where('id', $oldAdjustment->product_id)->increment('current_stock', $oldAdjustment->quantity);
            }

            DB::table('stock_adjustments')->where('id', $id)->update([
                'date' => $request->date,
                'product_id' => $request->product_id,
                'type' => $request->type,
                'quantity' => $request->quantity,
                'note' => $request->note,
                'updated_at' => now(),
            ]);

            if ($request->type === 'surplus') {
                DB::table('products')->where('id', $request->product_id)->increment('current_stock', $request->quantity);
            } else {
                DB::table('products')->where('id', $request->product_id)->decrement('current_stock', $request->quantity);
            }

            DB::commit();
            return redirect()->back()->with('success', 'Adjustment updated and stock synchronized successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to update adjustment!']);
        }
    }

    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $adjustment = DB::table('stock_adjustments')->where('id', $id)->first();

            if ($adjustment) {
                if ($adjustment->type === 'surplus') {
                    DB::table('products')->where('id', $adjustment->product_id)->decrement('current_stock', $adjustment->quantity);
                } else {
                    DB::table('products')->where('id', $adjustment->product_id)->increment('current_stock', $adjustment->quantity);
                }

                DB::table('stock_adjustments')->where('id', $id)->delete();
            }

            DB::commit();
            return redirect()->back()->with('success', 'Adjustment deleted and stock reversed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to reverse stock!']);
        }
    }
}
