<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->per_page === 'all' ? 1000000 : ($request->per_page ?? 10);
        $search = $request->search ?? '';

        $query = DB::table('transactions')
            ->leftJoin('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->leftJoin('parties', 'transactions.party_id', '=', 'parties.id')
            ->leftJoin('users', 'transactions.user_id', '=', 'users.id')
            ->select(
                'transactions.id',
                'transactions.voucher_no as reference',
                'transactions.date',
                'transactions.type',
                'accounts.name as account_name',
                'parties.name as party_name',
                'users.name as user_name',
                'transactions.amount',
                'transactions.note',
                DB::raw("'manual' as source")
            );

        if ($search != '') {
            $query->where(function($q) use ($search) {
                $q->where('transactions.voucher_no', 'like', "%{$search}%")
                  ->orWhere('parties.name', 'like', "%{$search}%")
                  ->orWhere('accounts.name', 'like', "%{$search}%")
                  ->orWhere('transactions.note', 'like', "%{$search}%");
            });
        }

        $transactions = $query->orderBy('transactions.date', 'desc')
            ->orderBy('transactions.id', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $accounts = DB::table('accounts')->get();
        $parties = DB::table('parties')->get();
        $users = DB::table('users')->select('id', 'name', 'email')->get();

        return Inertia::render('Admin/Transaction/Index', [
            'transactions' => $transactions,
            'accounts' => $accounts,
            'parties' => $parties,
            'users' => $users,
            'filters' => $request->only(['search', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'type' => 'required|in:payment_in,payment_out,transfer,salary,loan_received,loan_repayment',
            'account_id' => 'required|integer|exists:accounts,id',
            'amount' => 'required|numeric|min:1',
            'party_id' => 'nullable|integer|exists:parties,id',
            'user_id' => 'nullable|integer|exists:users,id',
            'to_account_id' => 'nullable|integer|exists:accounts,id',
            'note' => 'nullable|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $prefix = match($request->type) {
                'payment_in', 'loan_received' => 'MR-',
                'transfer' => 'TR-',
                default => 'PM-'
            };

            $lastId = DB::table('transactions')->max('id') ?? 0;
            $voucherNo = $prefix . str_pad($lastId + 1, 5, '0', STR_PAD_LEFT);

            $account = DB::table('accounts')->where('id', $request->account_id)->first();
            if (!$account) {
                throw new \Exception("Account not found.");
            }

            if (in_array($request->type, ['payment_in', 'loan_received'])) {
                DB::table('accounts')->where('id', $request->account_id)->increment('current_balance', $request->amount);
            } else {
                if ($account->current_balance < $request->amount) {
                    throw new \Exception("Insufficient balance in {$account->name}!");
                }
                DB::table('accounts')->where('id', $request->account_id)->decrement('current_balance', $request->amount);
            }

            if ($request->type == 'transfer' && $request->to_account_id) {
                DB::table('accounts')->where('id', $request->to_account_id)->increment('current_balance', $request->amount);
            }

            DB::table('transactions')->insert([
                'voucher_no' => $voucherNo,
                'date' => $request->date,
                'type' => $request->type,
                'account_id' => $request->account_id,
                'party_id' => $request->party_id,
                'user_id' => $request->user_id,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method ?? 'Cash',
                'note' => $request->note,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Transaction completed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $transaction = DB::table('transactions')->where('id', $id)->first();

            if (!$transaction) {
                throw new \Exception("Transaction not found.");
            }

            if (in_array($transaction->type, ['payment_in', 'loan_received'])) {
                DB::table('accounts')
                    ->where('id', $transaction->account_id)
                    ->decrement('current_balance', $transaction->amount);
            }
            elseif (in_array($transaction->type, ['payment_out', 'salary', 'transfer', 'loan_repayment'])) {
                DB::table('accounts')
                    ->where('id', $transaction->account_id)
                    ->increment('current_balance', $transaction->amount);
            }

            DB::table('transactions')->where('id', $id)->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Transaction deleted & balance reversed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Failed to reverse transaction: ' . $e->getMessage()]);
        }
    }
}
