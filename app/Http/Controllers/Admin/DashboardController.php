<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Support\BranchDB as DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();

        // Today's Basic Stats
        $todaySales = DB::table('invoices')->whereDate('date', $today)->sum('grand_total') ?? 0;
        $todayPurchases = DB::table('purchases')->whereDate('date', $today)->sum('grand_total') ?? 0;

        $todayExpenses = DB::table('transactions')
            ->whereIn('type', ['payment_out', 'salary'])
            ->whereDate('date', $today)
            ->sum('amount') ?? 0;


        $todayPaidSales = DB::table('invoices')->whereDate('date', $today)->sum('paid_amount') ?? 0;
        $todayCollections = DB::table('transactions')->where('type', 'payment_in')->whereDate('date', $today)->sum('amount') ?? 0;
        $todayLoanReceived = DB::table('transactions')->where('type', 'loan_received')->whereDate('date', $today)->sum('amount') ?? 0;

        $todayLoanRepayment = DB::table('transactions')->where('type', 'loan_repayment')->whereDate('date', $today)->sum('amount') ?? 0;
        $todayBankDeposit = DB::table('transactions')->where('type', 'transfer')->whereDate('date', $today)->sum('amount') ?? 0;

        $netCash = ($todayPaidSales + $todayCollections + $todayLoanReceived) - ($todayExpenses + $todayLoanRepayment + $todayBankDeposit);
        // ---------------------------------------------------

        $totalCustomerDue = DB::table('invoices')->sum('due_amount') ?? 0;
        $totalSupplierPayable = DB::table('purchases')->sum(DB::raw('grand_total - paid_amount')) ?? 0;

        $activeShift = DB::table('shifts')->where('status', 'open')->first();

        $tanks = DB::table('tanks')
            ->select('id', 'name', 'capacity', 'current_stock')
            ->get();

        $lowStockProducts = DB::table('products')
            ->where('current_stock', '<=', 500)
            ->select('name', 'current_stock', 'unit')
            ->limit(5)
            ->get();

        $recentSales = DB::table('invoices')
            ->leftJoin('parties', 'invoices.customer_id', '=', 'parties.id')
            ->select('invoices.invoice_no', 'invoices.grand_total', 'parties.name as customer_name', 'invoices.date')
            ->orderBy('invoices.id', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'todaySales' => $todaySales,
                'todayPurchases' => $todayPurchases,
                'todayExpenses' => $todayExpenses,
                'netCash' => $netCash,
                'totalCustomerDue' => $totalCustomerDue,
                'totalSupplierPayable' => $totalSupplierPayable,
            ],
            'activeShift' => $activeShift,
            'tanks' => $tanks,
            'lowStockProducts' => $lowStockProducts,
            'recentSales' => $recentSales,
        ]);
    }

    public function loanHistory(Request $request, $id)
    {
        $party = DB::table('parties')->where('id', $id)->first();

        if (!$party) {
            abort(404, 'Party not found');
        }

        $query = DB::table('transactions')
            ->where('party_id', $id)
            ->whereIn('type', ['loan_received', 'loan_repayment']);

        $totalReceived = (clone $query)->where('type', 'loan_received')->sum('amount');
        $totalRepaid = (clone $query)->where('type', 'loan_repayment')->sum('amount');

        $perPage = $request->per_page ?? 10;

        if ($perPage === 'all') {
            $history = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate(100000)->withQueryString();
        } else {
            $history = $query->orderBy('date', 'desc')->orderBy('id', 'desc')->paginate((int) $perPage)->withQueryString();
        }

        return Inertia::render('Admin/Reports/LoanHistory', [
            'party' => $party,
            'history' => $history,
            'summary' => [
                'total_received' => $totalReceived,
                'total_repaid' => $totalRepaid,
                'current_due' => $totalReceived - $totalRepaid,
            ],
            'filters' => $request->only(['per_page']),
        ]);
    }
}
