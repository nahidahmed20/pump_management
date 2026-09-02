<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;

/** Branch-aware wrapper for legacy query-builder code. */
class BranchDB
{
    private const SCOPED_TABLES = [
        'categories', 'products', 'tanks', 'nozzles', 'shifts', 'nozzle_readings',
        'invoices', 'invoice_items', 'purchases', 'purchase_items', 'stock_ledgers',
        'parties', 'accounts', 'transactions', 'settings', 'stock_adjustments',
        'payments', 'expense_categories', 'expenses', 'tank_readings', 'loans',
        'loan_repayments', 'payment_allocations',
    ];

    public static function table(string $table, ?string $as = null)
    {
        $query = DB::table($table, $as);
        $branchId = auth()->user()?->active_branch_id;
        if ($branchId && in_array($table, self::SCOPED_TABLES, true)) {
            $query->where(($as ?: $table).'.branch_id', $branchId);
        }
        return $query;
    }

    public static function __callStatic(string $method, array $arguments)
    {
        return DB::$method(...$arguments);
    }
}
