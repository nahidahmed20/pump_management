<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with(['category:id,name', 'account:id,name,type']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('note', 'like', "%{$search}%")
                  ->orWhereHas('category', function($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('date') && $request->date != '') {
            $query->whereDate('date', $request->date);
        }

        $perPage = $request->per_page ?? 10;
        if ($perPage === 'all') {
            $expenses = $query->latest('date')->latest('id')->paginate(100000)->withQueryString();
        } else {
            $expenses = $query->latest('date')->latest('id')->paginate($perPage)->withQueryString();
        }

        $categories = ExpenseCategory::select('id', 'name')->get();
        $accounts = Account::select('id', 'name', 'type', 'current_balance')->get();

        return Inertia::render('Admin/Expense/Index', [
            'expenses'   => $expenses,
            'categories' => $categories,
            'accounts'   => $accounts,
            'filters'    => $request->only(['search', 'per_page', 'date']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'account_id'          => 'required|exists:accounts,id',
            'amount'              => 'required|numeric|min:1',
            'date'                => 'required|date',
            'note'                => 'nullable|string|max:255',
        ]);

        $account = Account::find($validated['account_id']);
        if ($account->current_balance < $validated['amount']) {
            return redirect()->back()->withErrors(['account_id' => 'Insufficient balance in ' . $account->name]);
        }

        DB::transaction(function () use ($validated) {
            $expense = Expense::create($validated);

            Account::where('id', $validated['account_id'])
                   ->decrement('current_balance', $validated['amount']);

            DB::table('transactions')->insert([
                'voucher_no'     => 'EXP-' . str_pad($expense->id, 5, '0', STR_PAD_LEFT),
                'date'           => $expense->date,
                'type'           => 'payment_out',
                'account_id'     => $expense->account_id,
                'user_id'        => auth()->id(),
                'amount'         => $expense->amount,
                'payment_method' => 'Cash',
                'note'           => $expense->note ?? 'Expense Payment',
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Expense recorded successfully.');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'account_id'          => 'required|exists:accounts,id',
            'amount'              => 'required|numeric|min:1',
            'date'                => 'required|date',
            'note'                => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $expense) {
            if ($expense->account_id) {
                Account::where('id', $expense->account_id)
                       ->increment('current_balance', $expense->amount);
            }

            $voucherNo = 'EXP-' . str_pad($expense->id, 5, '0', STR_PAD_LEFT);

            $expense->update($validated);

            Account::where('id', $validated['account_id'])
                   ->decrement('current_balance', $validated['amount']);

            DB::table('transactions')->where('voucher_no', $voucherNo)->update([
                'date'       => $expense->date,
                'account_id' => $expense->account_id,
                'amount'     => $expense->amount,
                'note'       => $expense->note ?? 'Expense Payment',
                'updated_at' => now(),
            ]);
        });

        return redirect()->back()->with('success', 'Expense updated successfully.');
    }

    public function destroy(Expense $expense)
    {
        DB::transaction(function () use ($expense) {
            if ($expense->account_id) {
                Account::where('id', $expense->account_id)
                       ->increment('current_balance', $expense->amount);
            }

            $voucherNo = 'EXP-' . str_pad($expense->id, 5, '0', STR_PAD_LEFT);
            DB::table('transactions')->where('voucher_no', $voucherNo)->delete();

            $expense->delete();
        });

        return redirect()->back()->with('success', 'Expense deleted successfully.');
    }
}
