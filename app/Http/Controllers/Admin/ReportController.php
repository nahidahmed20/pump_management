<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Support\BranchDB as DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ReportController extends Controller
{
    // ১. Sales Report Method
    public function salesReport(Request $request)
    {
        $query = DB::table('invoices')
            ->select('invoices.*');

        // Date Filters
        if ($request->has('start_date') && $request->start_date != '') {
            $query->whereDate('invoices.date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date != '') {
            $query->whereDate('invoices.date', '<=', $request->end_date);
        }

        $summaryQuery = clone $query;
        $summary = [
            'total_sales' => $summaryQuery->sum('grand_total'),
            'total_paid' => $summaryQuery->sum('paid_amount'),
            'total_due' => $summaryQuery->sum('due_amount'),
            'total_discount' => $summaryQuery->sum('discount'),
        ];

        // Pagination
        $perPage = $request->per_page ?? 10;
        $sales = $query->orderBy('invoices.date', 'desc')
                       ->orderBy('invoices.id', 'desc')
                       ->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Reports/SalesReport', [
            'sales' => $sales,
            'summary' => $summary,
            'filters' => $request->only(['start_date', 'end_date', 'per_page']),
        ]);
    }

    public function purchaseReport(Request $request)
    {
        $query = DB::table('purchases')
            ->leftJoin('parties', 'purchases.supplier_id', '=', 'parties.id')
            ->select(
                'purchases.*',
                DB::raw('(purchases.grand_total - purchases.paid_amount) as due_amount'),
                'parties.name as supplier_name'
            );

        // Date Filters
        if ($request->has('start_date') && $request->start_date != '') {
            $query->whereDate('purchases.date', '>=', $request->start_date);
        }
        if ($request->has('end_date') && $request->end_date != '') {
            $query->whereDate('purchases.date', '<=', $request->end_date);
        }

        // Summary Calculations
        $summaryQuery = clone $query;
        $summary = [
            'total_purchase' => $summaryQuery->sum('grand_total'),
            'total_paid' => $summaryQuery->sum('paid_amount'),
            'total_due' => $summaryQuery->sum(DB::raw('purchases.grand_total - purchases.paid_amount')),
        ];

        // Pagination Logic (Added 'all' support)
        $perPage = $request->per_page ?? 10;

        if ($perPage === 'all') {
            $purchases = $query->orderBy('purchases.date', 'desc')
                               ->orderBy('purchases.id', 'desc')
                               ->paginate(100000)->withQueryString();
        } else {
            $purchases = $query->orderBy('purchases.date', 'desc')
                               ->orderBy('purchases.id', 'desc')
                               ->paginate((int) $perPage)->withQueryString();
        }

        return Inertia::render('Admin/Reports/PurchaseReport', [
            'purchases' => $purchases,
            'summary' => $summary,
            'filters' => $request->only(['start_date', 'end_date', 'per_page']),
        ]);
    }


    public function profitLossReport(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $startDate = $request->start_date;
        $endDate = $request->end_date;

        // ১. Total Sales Calculation
        $salesQuery = DB::table('invoices');
        if ($startDate) $salesQuery->whereDate('date', '>=', $startDate);
        if ($endDate) $salesQuery->whereDate('date', '<=', $endDate);
        $totalSales = $salesQuery->sum('grand_total');

        // ২. Total Purchases Calculation
        $purchaseQuery = DB::table('purchases');
        if ($startDate) $purchaseQuery->whereDate('date', '>=', $startDate);
        if ($endDate) $purchaseQuery->whereDate('date', '<=', $endDate);
        $totalPurchases = $purchaseQuery->sum('grand_total');

        $cogsQuery = DB::table('invoice_items')->join('invoices', 'invoice_items.invoice_id', '=', 'invoices.id');
        if ($startDate) $cogsQuery->whereDate('invoices.date', '>=', $startDate);
        if ($endDate) $cogsQuery->whereDate('invoices.date', '<=', $endDate);
        $totalCogs = $cogsQuery->sum(DB::raw('invoice_items.quantity * invoice_items.cost_price'));

        // ৩. Stock Adjustment (Shortage/Surplus) Calculation
        $latestPriceQuery = "(SELECT unit_price FROM purchase_items WHERE purchase_items.product_id = stock_adjustments.product_id ORDER BY id DESC LIMIT 1)";
        $adjQuery = DB::table('stock_adjustments')
            ->select('type', DB::raw("SUM(quantity * IFNULL($latestPriceQuery, 0)) as total_value"));

        if ($startDate) $adjQuery->whereDate('date', '>=', $startDate);
        if ($endDate) $adjQuery->whereDate('date', '<=', $endDate);

        $adjValues = $adjQuery->groupBy('type')->pluck('total_value', 'type');

        $totalShortage = $adjValues['shortage'] ?? 0;
        $totalSurplus = $adjValues['surplus'] ?? 0;

        // ৪. Operating Expenses Calculation (age eta missing chilo!)
        $expenseQuery = DB::table('expenses');
        if ($startDate) $expenseQuery->whereDate('date', '>=', $startDate);
        if ($endDate) $expenseQuery->whereDate('date', '<=', $endDate);
        $totalExpenses = $expenseQuery->sum('amount');

        $grossProfit = $totalSales - $totalCogs;
        $netProfit = $grossProfit + $totalSurplus - $totalShortage - $totalExpenses;

        return Inertia::render('Admin/Reports/ProfitLossReport', [
            'summary' => [
                'total_sales' => $totalSales,
                'total_purchases' => $totalPurchases,
                'total_cogs' => $totalCogs,
                'total_shortage' => $totalShortage,
                'total_surplus' => $totalSurplus,
                'total_expenses' => $totalExpenses,
                'gross_profit' => $grossProfit,
                'net_profit' => $netProfit,
            ],
            'filters' => $request->only(['start_date', 'end_date']),
        ]);
    }

    public function customerDueReport(Request $request)
    {
        $query = DB::table('parties')
            ->leftJoin('invoices', 'parties.id', '=', 'invoices.customer_id')
            ->select(
                'parties.id',
                'parties.name',
                'parties.phone',
                DB::raw('COALESCE(SUM(invoices.due_amount), 0) as due_amount')
            )
            ->where('parties.type', 'customer')
            ->groupBy('parties.id', 'parties.name', 'parties.phone')
            ->havingRaw('COALESCE(SUM(invoices.due_amount), 0) > 0');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('parties.name', 'like', '%' . $search . '%')
                  ->orWhere('parties.phone', 'like', '%' . $search . '%');
            });
        }

        $totalDue = DB::table('invoices')->sum('due_amount');

        // Pagination Logic (Added 'all' support)
        $perPage = $request->per_page ?? 10;

        if ($perPage === 'all') {
            $customers = $query->orderByDesc('due_amount')
                               ->paginate(100000)->withQueryString();
        } else {
            $customers = $query->orderByDesc('due_amount')
                               ->paginate((int) $perPage)->withQueryString();
        }

        return Inertia::render('Admin/Reports/CustomerDueReport', [
            'customers' => $customers,
            'totalDue' => $totalDue,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function supplierDueReport(Request $request)
    {
        $query = DB::table('parties')
            ->leftJoin('purchases', 'parties.id', '=', 'purchases.supplier_id')
            ->select(
                'parties.id',
                'parties.name',
                'parties.phone',
                DB::raw('COALESCE(SUM(purchases.grand_total - purchases.paid_amount), 0) as due_amount')
            )
            ->where('parties.type', 'supplier')
            ->groupBy('parties.id', 'parties.name', 'parties.phone')
            ->havingRaw('COALESCE(SUM(purchases.grand_total - purchases.paid_amount), 0) > 0');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('parties.name', 'like', '%' . $search . '%')
                  ->orWhere('parties.phone', 'like', '%' . $search . '%');
            });
        }

        $totalPayable = DB::table('purchases')->sum(DB::raw('grand_total - paid_amount'));

        // Pagination Logic (Added 'all' support)
        $perPage = $request->per_page ?? 10;

        if ($perPage === 'all') {
            $suppliers = $query->orderByDesc('due_amount')
                               ->paginate(100000)->withQueryString();
        } else {
            $suppliers = $query->orderByDesc('due_amount')
                               ->paginate((int) $perPage)->withQueryString();
        }

        return Inertia::render('Admin/Reports/SupplierDueReport', [
            'suppliers' => $suppliers,
            'totalPayable' => $totalPayable,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }
    public function expenseReport(Request $request)
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $query = DB::table('expenses');

        if ($request->filled('start_date')) {
            $query->whereDate('date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('date', '<=', $request->end_date);
        }

        $totalExpense = (clone $query)->sum('amount');

        // Pagination Logic (Added 'all' support)
        $perPage = $request->per_page ?? 10;

        if ($perPage === 'all') {
            $expenses = $query->orderBy('date', 'desc')
                              ->orderBy('id', 'desc')
                              ->paginate(100000)->withQueryString();
        } else {
            $expenses = $query->orderBy('date', 'desc')
                              ->orderBy('id', 'desc')
                              ->paginate((int) $perPage)->withQueryString();
        }

        return Inertia::render('Admin/Reports/ExpenseReport', [
            'expenses' => $expenses,
            'totalExpense' => $totalExpense,
            'filters' => $request->only(['start_date', 'end_date', 'per_page']),
        ]);
    }

    public function dailyCashSummary(Request $request)
    {
        $request->validate([
            'date' => 'nullable|date',
        ]);

        $date = $request->filled('date') ? $request->date : date('Y-m-d');

        $cashSales = DB::table('invoices')->whereDate('date', $date)->sum('paid_amount');

        $collections = DB::table('payments')->whereDate('date', $date)->where('payment_type', 'due_receive')->sum('amount');

        $expenses = DB::table('expenses')->whereDate('date', $date)->sum('amount');

        $supplierPayments = DB::table('payments')->whereDate('date', $date)->where('payment_type', 'purchase_pay')->sum('amount');

        $netCashInHand = ($cashSales + $collections) - ($expenses + $supplierPayments);

        return Inertia::render('Admin/Reports/DailyCashSummary', [
            'summary' => [
                'date' => $date,
                'cash_sales' => $cashSales,
                'collections' => $collections,
                'expenses' => $expenses,
                'supplier_payments' => $supplierPayments,
                'net_cash' => $netCashInHand,
            ],
            'prevDate' => Carbon::parse($date)->subDay()->toDateString(),
            'nextDate' => Carbon::parse($date)->addDay()->toDateString(),
            'filters' => $request->only(['date']),
        ]);
    }

    public function loanReport(Request $request)
    {
        $query = DB::table('parties')
            ->leftJoin('transactions', function($join) {
                $join->on('parties.id', '=', 'transactions.party_id')
                     ->whereIn('transactions.type', ['loan_received', 'loan_repayment']);
            })
            ->select(
                'parties.id',
                'parties.name',
                'parties.phone',
                DB::raw("COALESCE(SUM(CASE WHEN transactions.type = 'loan_received' THEN transactions.amount ELSE 0 END), 0) as total_received"),
                DB::raw("COALESCE(SUM(CASE WHEN transactions.type = 'loan_repayment' THEN transactions.amount ELSE 0 END), 0) as total_repaid"),
                DB::raw("COALESCE(SUM(CASE WHEN transactions.type = 'loan_received' THEN transactions.amount ELSE 0 END), 0) - COALESCE(SUM(CASE WHEN transactions.type = 'loan_repayment' THEN transactions.amount ELSE 0 END), 0) as current_due")
            )
            ->groupBy('parties.id', 'parties.name', 'parties.phone')
            ->havingRaw("COALESCE(SUM(CASE WHEN transactions.type = 'loan_received' THEN transactions.amount ELSE 0 END), 0) > 0");

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('parties.name', 'like', '%' . $search . '%')
                  ->orWhere('parties.phone', 'like', '%' . $search . '%');
            });
        }

        $summary = [
            'total_received' => DB::table('transactions')->where('type', 'loan_received')->sum('amount'),
            'total_repaid' => DB::table('transactions')->where('type', 'loan_repayment')->sum('amount'),
        ];
        $summary['net_due'] = $summary['total_received'] - $summary['total_repaid'];

        $perPage = $request->per_page ?? 10;
        if ($perPage === 'all') {
            $loans = $query->orderBy('parties.name', 'asc')->paginate(100000)->withQueryString();
        } else {
            $loans = $query->orderBy('parties.name', 'asc')->paginate((int) $perPage)->withQueryString();
        }

        return Inertia::render('Admin/Reports/LoanReport', [
            'loans' => $loans,
            'summary' => $summary,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function dailyPumpSummary(Request $request)
    {
        $date = $request->input('date', date('Y-m-d'));
        $shiftId = $request->input('shift_id', 'all');

        // 1. Shifts on this date
        $shifts = \App\Models\Shift::with('user:id,name')
            ->whereDate('start_time', $date)
            ->get();

        // 2. Nozzle Readings for this date / shift
        $nozzleReadingsQuery = \App\Models\NozzleReading::with(['nozzle.tank.product', 'shift.user:id,name'])
            ->whereDate('created_at', $date);
        if ($shiftId !== 'all' && !empty($shiftId)) {
            $nozzleReadingsQuery->where('shift_id', $shiftId);
        }
        $nozzleReadings = $nozzleReadingsQuery->get()->map(function ($nr) {
            $soldQty = max(0, (float)$nr->end_meter - (float)$nr->start_meter - (float)$nr->testing_qty);
            $totalAmount = $soldQty * (float)$nr->unit_price;
            return [
                'id'           => $nr->id,
                'nozzle_name'  => $nr->nozzle?->name ?? 'Nozzle',
                'product_name' => $nr->nozzle?->tank?->product?->name ?? 'Fuel',
                'shift_user'   => $nr->shift?->user?->name ?? 'N/A',
                'start_meter'  => (float)$nr->start_meter,
                'end_meter'    => (float)$nr->end_meter,
                'testing_qty'  => (float)$nr->testing_qty,
                'sold_qty'     => $soldQty,
                'unit_price'   => (float)$nr->unit_price,
                'total_amount' => $totalAmount,
            ];
        });

        $totalMeterSales = $nozzleReadings->sum('total_amount');
        $totalMeterLiters = $nozzleReadings->sum('sold_qty');

        // 3. Invoices on this date
        $invoicesQuery = \App\Models\Invoice::with(['customer:id,name,phone', 'vehicle:id,vehicle_no'])
            ->whereDate('date', $date);
        if ($shiftId !== 'all' && !empty($shiftId)) {
            $invoicesQuery->where('shift_id', $shiftId);
        }
        $invoices = $invoicesQuery->get();

        $invoiceGrossTotal = $invoices->sum('grand_total');
        $invoicePaid = $invoices->sum('paid_amount');
        $invoiceDue = $invoices->sum('due_amount');
        $creditSalesList = $invoices->where('due_amount', '>', 0)->values()->map(function ($inv) {
            return [
                'id'            => $inv->id,
                'invoice_no'    => $inv->invoice_no,
                'customer_name' => $inv->customer?->name ?? 'Walk-in',
                'vehicle_no'    => $inv->vehicle_no,
                'slip_no'       => $inv->slip_no,
                'grand_total'   => (float)$inv->grand_total,
                'paid_amount'   => (float)$inv->paid_amount,
                'due_amount'    => (float)$inv->due_amount,
            ];
        });

        // 4. Tank Stocks & Dip Analysis
        $tanks = \App\Models\Tank::with('product')->get();
        $tankReadings = \App\Models\TankReading::whereDate('date', $date)->get()->keyBy('tank_id');

        $tankSummary = $tanks->map(function ($tank) use ($tankReadings) {
            $reading = $tankReadings->get($tank->id);
            $softwareStock = (float)$tank->current_stock;
            $physicalStock = $reading ? (float)$reading->physical_stock : null;
            $variance = $physicalStock !== null ? ($physicalStock - $softwareStock) : null;

            return [
                'id'             => $tank->id,
                'tank_name'      => $tank->name,
                'product_name'   => $tank->product?->name ?? 'Fuel',
                'capacity'       => (float)$tank->capacity,
                'software_stock' => $softwareStock,
                'physical_stock' => $physicalStock,
                'variance'       => $variance,
                'dip_note'       => $reading?->note ?? null,
            ];
        });

        // 5. Daily Expenses
        $expenses = \App\Models\Expense::with('category')->whereDate('date', $date)->get();
        $totalExpense = $expenses->sum('amount');

        // 6. Payments collected
        $dueCollections = DB::table('payments')->whereDate('date', $date)->where('payment_type', 'due_receive')->sum('amount');
        $supplierPayments = DB::table('payments')->whereDate('date', $date)->where('payment_type', 'purchase_pay')->sum('amount');

        // 7. Cash In Hand
        $netCashInHand = ($invoicePaid + $dueCollections) - ($totalExpense + $supplierPayments);

        return Inertia::render('Admin/Reports/DailyPumpSummary', [
            'date'              => $date,
            'selectedShiftId'   => $shiftId,
            'shifts'            => $shifts,
            'nozzleReadings'    => $nozzleReadings,
            'totalMeterSales'   => $totalMeterSales,
            'totalMeterLiters'  => $totalMeterLiters,
            'invoiceGrossTotal' => $invoiceGrossTotal,
            'invoicePaid'       => $invoicePaid,
            'invoiceDue'        => $invoiceDue,
            'creditSalesList'   => $creditSalesList,
            'tankSummary'       => $tankSummary,
            'expenses'          => $expenses,
            'totalExpense'      => $totalExpense,
            'dueCollections'    => $dueCollections,
            'supplierPayments'  => $supplierPayments,
            'netCashInHand'     => $netCashInHand,
        ]);
    }
}
