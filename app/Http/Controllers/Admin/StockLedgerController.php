<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Support\BranchDB as DB;
use Inertia\Inertia;

class StockLedgerController extends Controller
{
    public function index(Request $request)
    {
        $products = DB::table('products')->get();
        $selectedProduct = $request->product_id ?? ($products->first()->id ?? null);

        if (!$selectedProduct) {
            return Inertia::render('Admin/Stock/Ledger', [
                'products' => [],
                'selectedProduct' => null,
                'ledgers' => ['data' => [], 'links' => []],
                'summary' => ['total_in' => 0, 'total_out' => 0],
                'filters' => $request->only(['search', 'start_date', 'end_date', 'per_page', 'product_id']),
            ]);
        }

        // Subqueries
        $purchases = DB::table('purchase_items')
            ->join('purchases', 'purchase_items.purchase_id', '=', 'purchases.id')
            ->where('purchase_items.product_id', $selectedProduct)
            ->select('purchases.date as date', DB::raw("'Purchase (Stock In)' as type"), 'purchases.reference_no as reference', 'purchase_items.quantity as in_qty', DB::raw("0 as out_qty"), 'purchases.created_at');

        $sales = DB::table('invoice_items')
            ->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id')
            ->where('invoice_items.product_id', $selectedProduct)
            ->select('invoices.date as date', DB::raw("'Sale (Stock Out)' as type"), 'invoices.invoice_no as reference', DB::raw("0 as in_qty"), 'invoice_items.quantity as out_qty', 'invoices.created_at');

        $adjustmentSurplus = DB::table('stock_adjustments')
            ->where('product_id', $selectedProduct)->where('type', 'surplus')
            ->select('date as date', DB::raw("'Adjustment (Surplus)' as type"), 'note as reference', 'quantity as in_qty', DB::raw("0 as out_qty"), 'created_at');

        $adjustmentShortage = DB::table('stock_adjustments')
            ->where('product_id', $selectedProduct)->where('type', 'shortage')
            ->select('date as date', DB::raw("'Adjustment (Shortage)' as type"), 'note as reference', DB::raw("0 as in_qty"), 'quantity as out_qty', 'created_at');

        // Union Query
        $unionQuery = $purchases->unionAll($sales)->unionAll($adjustmentSurplus)->unionAll($adjustmentShortage);

        // Wrap with DB Query for Pagination & Filtering
        $query = DB::query()->fromSub($unionQuery, 'ledgers');

        // Search Filter
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', '%' . $search . '%')
                  ->orWhere('type', 'like', '%' . $search . '%');
            });
        }

        // Date Filter
        if ($request->has('start_date') && $request->start_date != '') {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date != '') {
            $query->whereDate('date', '<=', $request->end_date);
        }

        // Summary (Total In & Out)
        $summaryQuery = clone $query;
        $totals = $summaryQuery->selectRaw('SUM(in_qty) as total_in, SUM(out_qty) as total_out')->first();

        // Pagination Logic (Added 'all' support)
        $perPage = $request->per_page ?? 10;
        
        if ($perPage === 'all') {
            $ledgers = $query->orderBy('date', 'desc')
                             ->orderBy('created_at', 'desc')
                             ->paginate(100000)->withQueryString();
        } else {
            $ledgers = $query->orderBy('date', 'desc')
                             ->orderBy('created_at', 'desc')
                             ->paginate((int) $perPage)->withQueryString();
        }

        return Inertia::render('Admin/Stock/Ledger', [
            'products' => $products,
            'selectedProduct' => $selectedProduct,
            'ledgers' => $ledgers,
            'summary' => [
                'total_in' => $totals->total_in ?? 0,
                'total_out' => $totals->total_out ?? 0,
            ],
            'filters' => $request->only(['search', 'start_date', 'end_date', 'per_page', 'product_id']),
        ]);
    }
}
