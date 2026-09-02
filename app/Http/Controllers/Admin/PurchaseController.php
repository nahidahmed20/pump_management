<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\StockLedger;
use App\Models\Tank;
use App\Models\Account;
use Illuminate\Http\Request;
use App\Support\BranchDB as DB;
use Inertia\Inertia;

class PurchaseController extends Controller
{
    public function index(Request $request)
    {
        $query = Purchase::with(['supplier']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_no', 'like', '%' . $search . '%')
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        $perPage = $request->input('per_page', 10);
        $purchases = $query->latest()->paginate($perPage === 'all' ? 100000 : $perPage)->withQueryString();

        return Inertia::render('Admin/Purchase/Index', [
            'purchases' => $purchases,
            'filters'   => $request->only(['search', 'per_page']),
        ]);
    }

    public function create()
    {
        $suppliers = Party::where('type', 'supplier')->get(['id', 'name', 'phone']);
        $products  = Product::where('is_active', true)->with('category')->get();
        $tanks     = Tank::select('id', 'name')->get();
        $accounts  = Account::get(['id', 'name', 'type']);

        $lastPurchase = Purchase::latest('id')->first();
        $nextId       = $lastPurchase ? $lastPurchase->id + 1 : 1;
        $reference_no = 'PUR-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Admin/Purchase/Create', [
            'suppliers'    => $suppliers,
            'products'     => $products,
            'tanks'        => $tanks,
            'accounts'     => $accounts,
            'reference_no' => $reference_no,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id'           => 'required|exists:parties,id',
            'sub_total'             => 'required|numeric|min:0',
            'discount'              => 'nullable|numeric|min:0',
            'grand_total'           => 'required|numeric|min:0',
            'cart'                  => 'required|array|min:1',
            'cart.*.id'             => 'required|exists:products,id',
            'cart.*.quantity'       => 'required|numeric|gt:0',
            'cart.*.unit_price'     => 'required|numeric|min:0',
            'cart.*.total_price'    => 'required|numeric|min:0',
            'cart.*.tank_id'        => 'nullable|exists:tanks,id',
            'payments'              => 'required|array',
            'payments.*.account_id' => 'nullable|exists:accounts,id',
            'payments.*.amount'     => 'nullable|numeric|min:0',
        ]);

        // Process payments array and check account balances
        $accountPayments = [];
        $totalPaid = 0;
        $primaryAccountId = null;

        foreach ($request->payments as $payment) {
            $amt = floatval($payment['amount'] ?? 0);
            $accId = $payment['account_id'] ?? null;

            if ($amt > 0) {
                if (!$accId) {
                    return redirect()->back()->withErrors(['account_id' => 'Please select an account for the entered payment amount.']);
                }

                if (!isset($accountPayments[$accId])) {
                    $accountPayments[$accId] = 0;
                }
                $accountPayments[$accId] += $amt;
                $totalPaid += $amt;

                if (!$primaryAccountId) $primaryAccountId = $accId;
            }
        }

        if ($totalPaid > (float) $request->grand_total) {
            return back()->withErrors(['payments' => 'Paid amount cannot exceed purchase total.']);
        }

        // Verify Balance
        foreach ($accountPayments as $accId => $amount) {
            $account = Account::find($accId);
            if ($account && $account->current_balance < $amount) {
                return redirect()->back()->withErrors(['account_id' => 'Insufficient balance in ' . $account->name . '! Available: ৳' . number_format($account->current_balance, 2)]);
            }
        }

        try {
            DB::beginTransaction();

            $lastPurchase = Purchase::latest('id')->lockForUpdate()->first();
            $nextId = $lastPurchase ? $lastPurchase->id + 1 : 1;
            $final_reference_no = 'PUR-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $due_amount = max(0, $request->grand_total - $totalPaid);

            $purchase = Purchase::create([
                'reference_no' => $final_reference_no,
                'supplier_id'  => $request->supplier_id,
                'sub_total'    => $request->sub_total,
                'discount'     => $request->discount ?? 0,
                'grand_total'  => $request->grand_total,
                'paid_amount'  => $totalPaid,
                'due_amount'   => $due_amount,
                'date'         => now(),
            ]);

            // Insert Multiple Payments
            foreach ($accountPayments as $accId => $amount) {
                Account::where('id', $accId)->decrement('current_balance', $amount);

                DB::table('transactions')->insert([
                    'branch_id'      => auth()->user()->active_branch_id,
                    'voucher_no'     => $purchase->reference_no,
                    'date'           => now(),
                    'type'           => 'payment_out',
                    'account_id'     => $accId,
                    'party_id'       => $request->supplier_id,
                    'amount'         => $amount,
                    'payment_method' => 'Split Payment',
                    'note'           => 'Purchase Payment #' . $purchase->reference_no,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            if ($due_amount > 0) {
                Party::where('id', $request->supplier_id)->increment('current_balance', $due_amount);
            }

            foreach ($request->cart as $item) {
                $tankId = !empty($item['tank_id']) ? $item['tank_id'] : null;

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['id'],
                    'tank_id'     => $tankId,
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);

                Product::where('id', $item['id'])->increment('current_stock', $item['quantity']);

                if ($tankId) {
                    Tank::where('id', $tankId)->increment('current_stock', $item['quantity']);
                }

                StockLedger::create([
                    'product_id' => $item['id'],
                    'type'       => 'in',
                    'quantity'   => $item['quantity'],
                    'source'     => 'purchase',
                    'source_id'  => $purchase->id,
                    'date'       => now(),
                ]);
            }

            DB::commit();
            return redirect('/admin/purchases')->with('success', 'Purchase created successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $purchase = Purchase::with(['supplier', 'items.product', 'items.tank'])->findOrFail($id);

        $purchase->payments = DB::table('transactions')
            ->join('accounts', 'transactions.account_id', '=', 'accounts.id')
            ->where('transactions.voucher_no', $purchase->reference_no)
            ->where('transactions.type', 'payment_out')
            ->select('transactions.amount', 'accounts.name as account_name')
            ->get();

        return response()->json($purchase);
    }

    public function edit($id)
    {
        $purchase  = Purchase::with(['items'])->findOrFail($id);

        $purchase->payments = DB::table('transactions')
            ->where('voucher_no', $purchase->reference_no)
            ->where('type', 'payment_out')
            ->select('account_id', 'amount')
            ->get();

        $suppliers = Party::where('type', 'supplier')->get(['id', 'name', 'phone']);
        $products  = Product::where('is_active', true)->with('category')->get();
        $tanks     = Tank::select('id', 'name')->get();
        $accounts  = Account::get(['id', 'name', 'type']);

        return Inertia::render('Admin/Purchase/Edit', [
            'purchase'  => $purchase,
            'suppliers' => $suppliers,
            'products'  => $products,
            'tanks'     => $tanks,
            'accounts'  => $accounts,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'supplier_id'           => 'required|exists:parties,id',
            'sub_total'             => 'required|numeric|min:0',
            'discount'              => 'nullable|numeric|min:0',
            'grand_total'           => 'required|numeric|min:0',
            'cart'                  => 'required|array|min:1',
            'cart.*.id'             => 'required|exists:products,id',
            'cart.*.quantity'       => 'required|numeric|gt:0',
            'cart.*.unit_price'     => 'required|numeric|min:0',
            'cart.*.total_price'    => 'required|numeric|min:0',
            'cart.*.tank_id'        => 'nullable|exists:tanks,id',
            'payments'              => 'required|array',
            'payments.*.account_id' => 'nullable|exists:accounts,id',
            'payments.*.amount'     => 'nullable|numeric|min:0',
        ]);

        $purchase = Purchase::with('items')->findOrFail($id);

        $newAccountPayments = [];
        $totalPaid = 0;
        $primaryAccountId = null;

        foreach ($request->payments as $payment) {
            $amt = floatval($payment['amount'] ?? 0);
            $accId = $payment['account_id'] ?? null;

            if ($amt > 0) {
                if (!$accId) return redirect()->back()->withErrors(['account_id' => 'Please select an account for the payment.']);

                if (!isset($newAccountPayments[$accId])) {
                    $newAccountPayments[$accId] = 0;
                }
                $newAccountPayments[$accId] += $amt;
                $totalPaid += $amt;
                if (!$primaryAccountId) $primaryAccountId = $accId;
            }
        }

        if ($totalPaid > (float) $request->grand_total) {
            return back()->withErrors(['payments' => 'Paid amount cannot exceed purchase total.']);
        }

        $oldAccountPayments = DB::table('transactions')
            ->where('voucher_no', $purchase->reference_no)
            ->where('type', 'payment_out')
            ->select('account_id', DB::raw('SUM(amount) as total_amount'))
            ->groupBy('account_id')
            ->pluck('total_amount', 'account_id');

        foreach ($newAccountPayments as $accId => $amount) {
            $account = Account::find($accId);
            $restoredAmount = $oldAccountPayments[$accId] ?? 0;
            $available = $account->current_balance + $restoredAmount;

            if ($account && $available < $amount) {
                return redirect()->back()->withErrors(['account_id' => 'Insufficient balance in ' . $account->name . '! Available: ৳' . number_format($available, 2)]);
            }
        }

        try {
            DB::beginTransaction();

            // 1. REVERSE OLD PAYMENTS
            foreach ($oldAccountPayments as $accId => $amount) {
                Account::where('id', $accId)->increment('current_balance', $amount);
            }
            DB::table('transactions')->where('voucher_no', $purchase->reference_no)->where('type', 'payment_out')->delete();

            // 2. REVERSE OLD DUE
            $oldDue = $purchase->due_amount;
            if ($oldDue > 0 && $purchase->supplier_id) {
                Party::where('id', $purchase->supplier_id)->decrement('current_balance', $oldDue);
            }

            // 3. REVERSE OLD STOCK
            foreach ($purchase->items as $item) {
                Product::where('id', $item->product_id)->decrement('current_stock', $item->quantity);
                if ($item->tank_id) {
                    Tank::where('id', $item->tank_id)->decrement('current_stock', $item->quantity);
                }
            }
            StockLedger::where('source', 'purchase')->where('source_id', $purchase->id)->delete();
            $purchase->items()->delete();

            // 4. APPLY NEW DATA
            $newDue = max(0, $request->grand_total - $totalPaid);

            $purchase->update([
                'supplier_id'  => $request->supplier_id,
                'sub_total'    => $request->sub_total,
                'discount'     => $request->discount ?? 0,
                'grand_total'  => $request->grand_total,
                'paid_amount'  => $totalPaid,
                'due_amount'   => $newDue,
            ]);

            // APPLY NEW PAYMENTS
            foreach ($newAccountPayments as $accId => $amount) {
                Account::where('id', $accId)->decrement('current_balance', $amount);

                DB::table('transactions')->insert([
                    'branch_id'      => auth()->user()->active_branch_id,
                    'voucher_no'     => $purchase->reference_no,
                    'date'           => now(),
                    'type'           => 'payment_out',
                    'account_id'     => $accId,
                    'party_id'       => $request->supplier_id,
                    'amount'         => $amount,
                    'payment_method' => 'Split Payment',
                    'note'           => 'Purchase Payment Update #' . $purchase->reference_no,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            // APPLY NEW DUE
            if ($newDue > 0) {
                Party::where('id', $request->supplier_id)->increment('current_balance', $newDue);
            }

            // APPLY NEW STOCK
            foreach ($request->cart as $item) {
                $tankId = !empty($item['tank_id']) ? $item['tank_id'] : null;

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id'  => $item['id'],
                    'tank_id'     => $tankId,
                    'quantity'    => $item['quantity'],
                    'unit_price'  => $item['unit_price'],
                    'total_price' => $item['total_price'],
                ]);

                Product::where('id', $item['id'])->increment('current_stock', $item['quantity']);
                if ($tankId) {
                    Tank::where('id', $tankId)->increment('current_stock', $item['quantity']);
                }

                StockLedger::create([
                    'product_id' => $item['id'],
                    'type'       => 'in',
                    'quantity'   => $item['quantity'],
                    'source'     => 'purchase',
                    'source_id'  => $purchase->id,
                    'date'       => now(),
                ]);
            }

            DB::commit();
            return redirect('/admin/purchases')->with('success', 'Purchase updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Update Failed: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $purchase = Purchase::with('items')->findOrFail($id);

        try {
            DB::beginTransaction();

            $oldTransactions = DB::table('transactions')
                ->where('voucher_no', $purchase->reference_no)
                ->where('type', 'payment_out')
                ->get();

            foreach ($oldTransactions as $txn) {
                Account::where('id', $txn->account_id)->increment('current_balance', $txn->amount);
            }

            $dueAmount = $purchase->due_amount;
            if ($dueAmount > 0 && $purchase->supplier_id) {
                Party::where('id', $purchase->supplier_id)->decrement('current_balance', $dueAmount);
            }

            foreach ($purchase->items as $item) {
                Product::where('id', $item->product_id)->decrement('current_stock', $item->quantity);
                if ($item->tank_id) {
                    Tank::where('id', $item->tank_id)->decrement('current_stock', $item->quantity);
                }
            }

            StockLedger::where('source', 'purchase')->where('source_id', $purchase->id)->delete();
            DB::table('transactions')->where('voucher_no', $purchase->reference_no)->delete();
            $purchase->items()->delete();
            $purchase->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Purchase deleted and stock/payments reverted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Could not delete purchase: ' . $e->getMessage()]);
        }
    }
}
