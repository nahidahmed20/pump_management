<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Support\BranchDB as DB;
use App\Models\Account;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('accounts');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('type', 'like', "%{$search}%")
                  ->orWhere('bank_name', 'like', "%{$search}%")
                  ->orWhere('account_number', 'like', "%{$search}%");
            });
        }

        $perPage = $request->per_page ?? 10;

        if ($perPage === 'all') {
            $accounts = $query->orderBy('id', 'asc')->paginate(100000)->withQueryString();
        } else {
            $accounts = $query->orderBy('id', 'asc')->paginate($perPage)->withQueryString();
        }

        $totalCash = DB::table('accounts')->where('type', 'cash')->sum('current_balance');
        $totalBank = DB::table('accounts')->whereIn('type', ['bank', 'mobile_banking'])->sum('current_balance');

        return Inertia::render('Admin/Account/Index', [
            'accounts' => $accounts,
            'summary' => [
                'totalCash' => $totalCash,
                'totalBank' => $totalBank,
                'grandTotal' => $totalCash + $totalBank
            ],
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function show($id)
    {
        $account = Account::findOrFail($id);

        $transactionsQuery = DB::table('transactions')
            ->where('account_id', $id)
            ->select(
                'id',
                'voucher_no as reference',
                'amount',
                'date',
                DB::raw("CASE
                    WHEN type = 'payment_in' THEN 'Sales Collection'
                    WHEN type = 'payment_out' THEN 'Purchase Payment'
                    ELSE type END as type")
            );

        $expensesQuery = DB::table('expenses')
            ->where('account_id', $id)
            ->select(
                'id',
                'note as reference',
                'amount',
                'date',
                DB::raw("'Expense' as type")
            );

        $transactions = $transactionsQuery->union($expensesQuery)
            ->orderBy('date', 'desc')
            ->get();

        return Inertia::render('Admin/Account/Show', [
            'account' => $account,
            'transactions' => $transactions,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,bank,mobile_banking',
            'opening_balance' => 'required|numeric|min:0',
        ]);

        DB::table('accounts')->insert([
            'branch_id' => auth()->user()->active_branch_id,
            'name' => $request->name,
            'type' => $request->type,
            'account_number' => $request->account_number,
            'bank_name' => $request->bank_name,
            'opening_balance' => $request->opening_balance,
            'current_balance' => $request->opening_balance,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Account created successfully.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:cash,bank,mobile_banking',
        ]);

        DB::table('accounts')->where('id', $id)->update([
            'name' => $request->name,
            'type' => $request->type,
            'account_number' => $request->account_number,
            'bank_name' => $request->bank_name,
            'updated_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Account updated successfully.');
    }

    public function destroy($id)
    {
        $account = DB::table('accounts')->where('id', $id)->first();

        if ($account && $account->current_balance > 0) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete account with available balance!']);
        }

        DB::table('accounts')->where('id', $id)->delete();
        return redirect()->back()->with('success', 'Account deleted successfully.');
    }
}
