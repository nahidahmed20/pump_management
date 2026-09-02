<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Loan;
use App\Models\LoanRepayment;
use App\Models\Party;
use App\Support\BranchDB as DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoanController extends Controller
{
    public function index(Request $request)
    {
        $loans = Loan::with(['lender:id,name,phone', 'account:id,name', 'repayments.account:id,name'])
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($sq) => $sq
                ->where('loan_no', 'like', '%'.$request->search.'%')
                ->orWhereHas('lender', fn ($lq) => $lq->where('name', 'like', '%'.$request->search.'%'))))
            ->latest('loan_date')->latest('id')->paginate(15)->withQueryString();

        return Inertia::render('Admin/Loans/Index', [
            'loans' => $loans,
            'lenders' => Party::whereIn('type', ['borrower', 'supplier', 'staff'])->get(['id', 'name', 'type']),
            'accounts' => Account::get(['id', 'name', 'type', 'current_balance']),
            'summary' => [
                'principal' => Loan::sum('principal_amount'),
                'payable' => Loan::sum('total_payable'),
                'paid' => Loan::sum(DB::raw('principal_paid + profit_paid')),
                'outstanding' => Loan::sum(DB::raw('total_payable - principal_paid - profit_paid')),
            ],
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'lender_id' => ['required', 'integer', 'exists:parties,id'],
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'loan_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:loan_date'],
            'principal_amount' => ['required', 'numeric', 'gt:0'],
            'profit_type' => ['required', 'in:none,fixed,percentage'],
            'profit_value' => ['nullable', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($data) {
            $profit = match ($data['profit_type']) {
                'fixed' => (float) ($data['profit_value'] ?? 0),
                'percentage' => round((float) $data['principal_amount'] * (float) ($data['profit_value'] ?? 0) / 100, 2),
                default => 0,
            };
            $loan = Loan::create([
                'loan_no' => 'LN-'.now()->format('YmdHis').'-'.random_int(100, 999),
                'lender_id' => $data['lender_id'], 'account_id' => $data['account_id'],
                'loan_date' => $data['loan_date'], 'due_date' => $data['due_date'] ?? null,
                'principal_amount' => $data['principal_amount'], 'profit_type' => $data['profit_type'],
                'profit_rate' => $data['profit_type'] === 'percentage' ? ($data['profit_value'] ?? 0) : 0,
                'profit_amount' => $profit,
                'total_payable' => (float) $data['principal_amount'] + $profit,
                'note' => $data['note'] ?? null,
            ]);
            Account::whereKey($data['account_id'])->increment('current_balance', $data['principal_amount']);
            DB::table('transactions')->insert([
                'branch_id' => auth()->user()->active_branch_id, 'voucher_no' => $loan->loan_no,
                'date' => $loan->loan_date, 'type' => 'loan_received', 'account_id' => $loan->account_id,
                'party_id' => $loan->lender_id, 'user_id' => auth()->id(), 'amount' => $loan->principal_amount,
                'payment_method' => 'Loan', 'note' => $loan->note ?: 'Loan received', 'created_at' => now(), 'updated_at' => now(),
            ]);
        });
        return back()->with('success', 'Loan received and account balance updated.');
    }

    public function repay(Request $request, Loan $loan)
    {
        $data = $request->validate([
            'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'date' => ['required', 'date'],
            'principal_amount' => ['required', 'numeric', 'min:0'],
            'profit_amount' => ['required', 'numeric', 'min:0'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);
        $total = (float) $data['principal_amount'] + (float) $data['profit_amount'];
        abort_if($total <= 0, 422, 'Repayment amount must be greater than zero.');
        abort_if($data['principal_amount'] > $loan->principal_amount - $loan->principal_paid, 422, 'Principal exceeds outstanding amount.');
        abort_if($data['profit_amount'] > $loan->profit_amount - $loan->profit_paid, 422, 'Profit exceeds outstanding amount.');

        DB::transaction(function () use ($data, $loan, $total) {
            $account = Account::lockForUpdate()->findOrFail($data['account_id']);
            abort_if($account->current_balance < $total, 422, 'Insufficient account balance.');
            $repayment = $loan->repayments()->create($data);
            $account->decrement('current_balance', $total);
            $loan->increment('principal_paid', $data['principal_amount']);
            $loan->increment('profit_paid', $data['profit_amount']);
            $loan->refresh();
            if ($loan->principal_paid + $loan->profit_paid >= $loan->total_payable) $loan->update(['status' => 'paid']);
            DB::table('transactions')->insert([
                'branch_id' => auth()->user()->active_branch_id, 'voucher_no' => 'LRP-'.str_pad($repayment->id, 6, '0', STR_PAD_LEFT),
                'date' => $repayment->date, 'type' => 'loan_repayment', 'account_id' => $repayment->account_id,
                'party_id' => $loan->lender_id, 'user_id' => auth()->id(), 'amount' => $total,
                'payment_method' => 'Loan', 'note' => $repayment->note ?: "Loan repayment {$loan->loan_no}", 'created_at' => now(), 'updated_at' => now(),
            ]);
        });
        return back()->with('success', 'Loan repayment recorded.');
    }

    public function destroy(Loan $loan)
    {
        abort_if($loan->repayments()->exists(), 422, 'Delete repayments before deleting this loan.');
        DB::transaction(function () use ($loan) {
            $account = Account::lockForUpdate()->findOrFail($loan->account_id);
            abort_if($account->current_balance < $loan->principal_amount, 422, 'Account balance is insufficient to reverse this loan.');
            $account->decrement('current_balance', $loan->principal_amount);
            DB::table('transactions')->where('voucher_no', $loan->loan_no)->delete();
            $loan->delete();
        });
        return back()->with('success', 'Loan reversed successfully.');
    }

    public function destroyRepayment(LoanRepayment $repayment)
    {
        DB::transaction(function () use ($repayment) {
            $loan = $repayment->loan()->lockForUpdate()->firstOrFail();
            $total = $repayment->principal_amount + $repayment->profit_amount;
            Account::whereKey($repayment->account_id)->increment('current_balance', $total);
            $loan->decrement('principal_paid', $repayment->principal_amount);
            $loan->decrement('profit_paid', $repayment->profit_amount);
            $loan->update(['status' => 'active']);
            DB::table('transactions')->where('voucher_no', 'LRP-'.str_pad($repayment->id, 6, '0', STR_PAD_LEFT))->delete();
            $repayment->delete();
        });
        return back()->with('success', 'Repayment reversed successfully.');
    }
}
