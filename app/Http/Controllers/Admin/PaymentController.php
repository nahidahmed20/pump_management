<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Account;
use App\Models\Party;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Payment::with(['account:id,name,type', 'party:id,name,type']);

        // Search by Note or Party name
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('note', 'like', "%{$search}%")
                  ->orWhereHas('party', function($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by Payment Type (invoice_receive, purchase_pay, due_receive, etc.)
        if ($request->has('type') && $request->type != '') {
            $query->where('payment_type', $request->type);
        }

        // Date Filter
        if ($request->has('date') && $request->date != '') {
            $query->whereDate('date', $request->date);
        }

        $perPage = $request->per_page ?? 10;
        $payments = $query->latest('date')->latest('id')->paginate($perPage === 'all' ? 100000 : $perPage)->withQueryString();

        $accounts = Account::select('id', 'name', 'type', 'current_balance')->get();
        $parties = Party::select('id', 'name', 'type', 'current_balance')->get();

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'accounts' => $accounts,
            'parties'  => $parties,
            'filters'  => $request->only(['search', 'type', 'date', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'         => 'required|date',
            'payment_type' => 'required|string', // invoice_receive, purchase_pay, due_receive, due_pay
            'party_id'     => 'nullable|exists:parties,id',
            'account_id'   => 'required|exists:accounts,id',
            'amount'       => 'required|numeric|min:1',
            'note'         => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated) {
            Payment::create($validated);

            $isReceive = in_array($validated['payment_type'], ['invoice_receive', 'due_receive']);

            if ($isReceive) {
                Account::where('id', $validated['account_id'])->increment('current_balance', $validated['amount']);
                if ($validated['party_id']) {
                    Party::where('id', $validated['party_id'])->decrement('current_balance', $validated['amount']); // Due কমবে
                }
            } else {
                Account::where('id', $validated['account_id'])->decrement('current_balance', $validated['amount']);
                if ($validated['party_id']) {
                    Party::where('id', $validated['party_id'])->decrement('current_balance', $validated['amount']); // Payable কমবে
                }
            }
        });

        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }

    public function destroy(Payment $payment)
    {
        DB::transaction(function () use ($payment) {
            $isReceive = in_array($payment->payment_type, ['invoice_receive', 'due_receive']);

            if ($isReceive) {
                Account::where('id', $payment->account_id)->decrement('current_balance', $payment->amount);
                if ($payment->party_id) {
                    Party::where('id', $payment->party_id)->increment('current_balance', $payment->amount);
                }
            } else {
                Account::where('id', $payment->account_id)->increment('current_balance', $payment->amount);
                if ($payment->party_id) {
                    Party::where('id', $payment->party_id)->increment('current_balance', $payment->amount);
                }
            }

            $payment->delete();
        });

        return redirect()->back()->with('success', 'Payment deleted successfully.');
    }
}
