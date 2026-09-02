<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Invoice;
use App\Models\Party;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['account:id,name,type', 'party:id,name,type']);
        $query->when($request->filled('search'), fn ($q) => $q->where(fn ($sq) => $sq
            ->where('note', 'like', '%'.$request->search.'%')
            ->orWhereHas('party', fn ($pq) => $pq->where('name', 'like', '%'.$request->search.'%'))));
        $query->when($request->filled('type'), fn ($q) => $q->where('payment_type', $request->type));
        $query->when($request->filled('date'), fn ($q) => $q->whereDate('date', $request->date));

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $query->latest('date')->latest('id')->paginate($request->per_page === 'all' ? 100000 : ($request->per_page ?? 10))->withQueryString(),
            'accounts' => Account::get(['id', 'name', 'type', 'current_balance']),
            'parties' => Party::get(['id', 'name', 'type', 'current_balance']),
            'filters' => $request->only(['search', 'type', 'date', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'], 'payment_type' => ['required', 'in:due_receive,purchase_pay'],
            'party_id' => ['required', 'integer', 'exists:parties,id'], 'account_id' => ['required', 'integer', 'exists:accounts,id'],
            'amount' => ['required', 'numeric', 'gt:0'], 'note' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($data) {
            $party = Party::lockForUpdate()->findOrFail($data['party_id']);
            $account = Account::lockForUpdate()->findOrFail($data['account_id']);
            $receiving = $data['payment_type'] === 'due_receive';
            abort_if($receiving && $party->type !== 'customer', 422, 'Select a customer for due collection.');
            abort_if(!$receiving && $party->type !== 'supplier', 422, 'Select a supplier for purchase payment.');
            abort_if(!$receiving && $account->current_balance < $data['amount'], 422, 'Insufficient account balance.');
            $documents = $receiving
                ? Invoice::where('customer_id', $party->id)->where('due_amount', '>', 0)->oldest('date')->lockForUpdate()->get()
                : Purchase::where('supplier_id', $party->id)->where('due_amount', '>', 0)->oldest('date')->lockForUpdate()->get();
            abort_if($data['amount'] > $documents->sum('due_amount'), 422, 'Payment exceeds outstanding due.');
            $payment = Payment::create($data);
            $remaining = (float) $data['amount'];
            foreach ($documents as $document) {
                if ($remaining <= 0) break;
                $amount = min($remaining, (float) $document->due_amount);
                $document->increment('paid_amount', $amount);
                $document->decrement('due_amount', $amount);
                PaymentAllocation::create(['payment_id' => $payment->id, 'document_type' => $receiving ? 'invoice' : 'purchase', 'document_id' => $document->id, 'amount' => $amount]);
                $remaining -= $amount;
            }
            $receiving ? $account->increment('current_balance', $data['amount']) : $account->decrement('current_balance', $data['amount']);
            $party->decrement('current_balance', $data['amount']);

            DB::table('transactions')->insert([
                'branch_id' => auth()->user()->active_branch_id,
                'voucher_no' => 'PAY-'.str_pad($payment->id, 6, '0', STR_PAD_LEFT),
                'date' => $payment->date,
                'type' => $receiving ? 'payment_in' : 'payment_out',
                'account_id' => $payment->account_id,
                'party_id' => $payment->party_id,
                'user_id' => auth()->id(),
                'amount' => $payment->amount,
                'payment_method' => 'Due settlement',
                'note' => $payment->note ?: ($receiving ? 'Customer due collection' : 'Supplier due payment'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });
        return back()->with('success', 'Payment allocated to outstanding documents.');
    }

    public function destroy(Payment $payment)
    {
        DB::transaction(function () use ($payment) {
            $receiving = $payment->payment_type === 'due_receive';
            foreach ($payment->allocations()->get() as $allocation) {
                $document = $allocation->document_type === 'invoice' ? Invoice::find($allocation->document_id) : Purchase::find($allocation->document_id);
                if ($document) { $document->decrement('paid_amount', $allocation->amount); $document->increment('due_amount', $allocation->amount); }
            }
            $receiving ? Account::whereKey($payment->account_id)->decrement('current_balance', $payment->amount) : Account::whereKey($payment->account_id)->increment('current_balance', $payment->amount);
            Party::whereKey($payment->party_id)->increment('current_balance', $payment->amount);
            DB::table('transactions')->where('voucher_no', 'PAY-'.str_pad($payment->id, 6, '0', STR_PAD_LEFT))->delete();
            $payment->delete();
        });
        return back()->with('success', 'Payment and allocations reversed.');
    }
}
