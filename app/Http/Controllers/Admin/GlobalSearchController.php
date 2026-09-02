<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Support\BranchDB as DB;

class GlobalSearchController extends Controller
{
    public function search(Request $request)
    {
        $term = $request->query('q');

        if (!$term) {
            return response()->json([]);
        }

        $invoices = DB::table('invoices')
            ->leftJoin('parties', 'invoices.customer_id', '=', 'parties.id')
            ->where('invoices.invoice_no', 'like', "%{$term}%")
            ->select('invoices.id', 'invoices.invoice_no as title', 'parties.name as subtitle', DB::raw("'invoice' as type"))
            ->limit(3)
            ->get();

        $parties = DB::table('parties')
            ->where('name', 'like', "%{$term}%")
            ->orWhere('phone', 'like', "%{$term}%")
            ->select('id', 'name as title', 'phone as subtitle', DB::raw("'party' as type"))
            ->limit(3)
            ->get();

        $purchases = DB::table('purchases')
            ->leftJoin('parties', 'purchases.supplier_id', '=', 'parties.id')
            ->where('purchases.reference_no', 'like', "%{$term}%")
            ->select('purchases.id', 'purchases.reference_no as title', 'parties.name as subtitle', DB::raw("'purchase' as type"))
            ->limit(3)
            ->get();

        $results = $invoices->merge($parties)->merge($purchases);

        return response()->json($results);
    }
}
