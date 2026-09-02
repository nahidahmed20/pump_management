<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Party;
use App\Models\Product;
use App\Models\Shift;
use App\Models\StockLedger;
use App\Models\Tank;
use App\Models\Account;
use Carbon\Carbon;
use Illuminate\Http\Request;
use App\Support\BranchDB as DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\InventoryService;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['customer', 'shift.user']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('invoice_no', 'like', '%' . $search . '%')
                  ->orWhereHas('customer', function ($q) use ($search) {
                      $q->where('name', 'like', '%' . $search . '%');
                  });
        }

        $perPage = $request->per_page === 'all' ? 100000 : ($request->per_page ?? 10);
        $invoices = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Invoice/Index', [
            'invoices' => $invoices,
            'filters'  => $request->only(['search', 'per_page']),
        ]);
    }

    public function create()
    {
        $openShift = Shift::where('status', 'open')->first();
        $customers = Party::where('type', 'customer')->get(['id', 'name', 'phone']);
        $products  = Product::where('is_active', true)->with('category')->get();
        $accounts  = Account::get(['id', 'name', 'type']);

        $lastInvoice = Invoice::latest('id')->first();
        $nextId = $lastInvoice ? $lastInvoice->id + 1 : 1;
        $invoice_no = 'INV-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

        return Inertia::render('Admin/Invoice/Create', [
            'openShift'  => $openShift,
            'customers'  => $customers,
            'products'   => $products,
            'accounts'   => $accounts,
            'invoice_no' => $invoice_no,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id'           => 'nullable|exists:parties,id',
            'sub_total'             => 'required|numeric|min:0',
            'discount'              => 'nullable|numeric|min:0',
            'grand_total'           => 'required|numeric|min:0',
            'cart'                  => 'required|array|min:1',
            'cart.*.id'             => 'required|integer|exists:products,id',
            'cart.*.quantity'       => 'required|numeric|gt:0',
            'cart.*.unit_price'     => 'required|numeric|min:0',
            'payments'              => 'required|array',
            'payments.*.account_id' => 'nullable|exists:accounts,id',
            'payments.*.amount'     => 'nullable|numeric|min:0',
        ]);

        $serverSubTotal = collect($request->cart)->sum(fn ($item) => round((float) $item['quantity'] * (float) $item['unit_price'], 3));
        $serverDiscount = min((float) ($request->discount ?? 0), $serverSubTotal);
        $request->merge(['sub_total' => $serverSubTotal, 'discount' => $serverDiscount, 'grand_total' => $serverSubTotal - $serverDiscount]);

        $openShift = Shift::where('status', 'open')->first();

        // Process payments array and check account balances
        $accountPayments = [];
        $totalPaid = 0;

        foreach ($request->payments as $payment) {
            $amt = floatval($payment['amount'] ?? 0);
            $accId = $payment['account_id'] ?? null;

            if ($amt > 0) {
                if (!$accId) {
                    return redirect()->back()->withErrors(['account_id' => 'Please select an account for the payment.']);
                }

                if (!isset($accountPayments[$accId])) {
                    $accountPayments[$accId] = 0;
                }
                $accountPayments[$accId] += $amt;
                $totalPaid += $amt;
            }
        }

        if ($totalPaid > (float) $request->grand_total) {
            return back()->withErrors(['payments' => 'Paid amount cannot exceed invoice total.']);
        }

        // Verify Account Balances
        foreach ($accountPayments as $accId => $amount) {
            $account = Account::find($accId);
            if ($account && $account->current_balance < 0) {
                // Optional balance checks if required
            }
        }

        $due_amount = max(0, $request->grand_total - $totalPaid);
        if ($due_amount > 0 && !$request->customer_id) {
            return back()->withErrors(['customer_id' => 'A customer is required for a credit sale.']);
        }

        foreach ($request->cart as $item) {
            $product = Product::find($item['id'] ?? null);
            if (!$product || (float) $item['quantity'] <= 0 || $product->current_stock < (float) $item['quantity']) {
                return back()->withErrors(['cart' => 'Insufficient stock or invalid product in the cart.']);
            }
        }

        try {
            DB::beginTransaction();

            $lastInvoice = Invoice::latest('id')->first();
            $nextId = $lastInvoice ? $lastInvoice->id + 1 : 1;
            $final_invoice_no = 'INV-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            while(Invoice::where('invoice_no', $final_invoice_no)->exists()){
                $nextId++;
                $final_invoice_no = 'INV-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);
            }

            $invoice = Invoice::create([
                'invoice_no'  => $final_invoice_no,
                'customer_id' => $request->customer_id,
                'shift_id'    => $openShift ? $openShift->id : null,
                'sub_total'   => $request->sub_total,
                'discount'    => $request->discount ?? 0,
                'grand_total' => $request->grand_total,
                'paid_amount' => $totalPaid,
                'due_amount'  => $due_amount,
                'date'        => now(),
            ]);

            // Insert Split Payments & Increase Account Balances
            foreach ($accountPayments as $accId => $amount) {
                Account::where('id', $accId)->increment('current_balance', $amount);

                DB::table('transactions')->insert([
                    'branch_id'      => auth()->user()->active_branch_id,
                    'voucher_no'     => $invoice->invoice_no,
                    'date'           => now(),
                    'type'           => 'payment_in',
                    'account_id'     => $accId,
                    'party_id'       => $request->customer_id,
                    'amount'         => $amount,
                    'payment_method' => 'Split Payment',
                    'note'           => 'POS Sale Collection #' . $invoice->invoice_no,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            if ($due_amount > 0 && $request->customer_id) {
                Party::where('id', $request->customer_id)->increment('current_balance', $due_amount);
            }

            foreach ($request->cart as $item) app(InventoryService::class)->addSaleItem($invoice, $item);

            if ($openShift) {
                $openShift->increment('total_sales', $request->grand_total);
                $openShift->increment('total_collection', $totalPaid);
            }

            DB::commit();
            return redirect()->route('admin.invoices.index')->with('success', 'Sale completed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("POS Sale Error: " . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Sale could not be completed: ' . $e->getMessage()]);
        }
    }

    public function show($id)
    {
        $invoice = Invoice::with(['customer', 'items.product', 'shift.user'])->findOrFail($id);

        return Inertia::render('Admin/Invoice/Show', [
            'invoice' => $invoice,
        ]);
    }

    public function edit($id)
    {
        $invoice = Invoice::with(['items.product'])->findOrFail($id);

        // Fetch existing split payments from transactions table
        $invoice->payments = DB::table('transactions')
            ->where('voucher_no', $invoice->invoice_no)
            ->where('type', 'payment_in')
            ->select('account_id', 'amount')
            ->get();

        $openShift = Shift::where('status', 'open')->first();
        $customers = Party::where('type', 'customer')->get(['id', 'name', 'phone']);
        $products  = Product::where('is_active', true)->with('category')->get();
        $accounts  = Account::get(['id', 'name', 'type']);

        return Inertia::render('Admin/Invoice/Edit', [
            'invoice'   => $invoice,
            'openShift' => $openShift,
            'customers' => $customers,
            'products'  => $products,
            'accounts'  => $accounts,
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'customer_id'           => 'nullable|exists:parties,id',
            'sub_total'             => 'required|numeric|min:0',
            'discount'              => 'nullable|numeric|min:0',
            'grand_total'           => 'required|numeric|min:0',
            'cart'                  => 'required|array|min:1',
            'cart.*.id'             => 'required|integer|exists:products,id',
            'cart.*.quantity'       => 'required|numeric|gt:0',
            'cart.*.unit_price'     => 'required|numeric|min:0',
            'payments'              => 'required|array',
            'payments.*.account_id' => 'nullable|exists:accounts,id',
            'payments.*.amount'     => 'nullable|numeric|min:0',
        ]);

        $serverSubTotal = collect($request->cart)->sum(fn ($item) => round((float) $item['quantity'] * (float) $item['unit_price'], 3));
        $serverDiscount = min((float) ($request->discount ?? 0), $serverSubTotal);
        $request->merge(['sub_total' => $serverSubTotal, 'discount' => $serverDiscount, 'grand_total' => $serverSubTotal - $serverDiscount]);

        $invoice = Invoice::with('items')->findOrFail($id);

        $newAccountPayments = [];
        $totalPaid = 0;

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
            }
        }

        try {
            DB::beginTransaction();

            // 1. REVERSE OLD PAYMENTS FROM ACCOUNTS & TRANSACTIONS
            $oldTransactions = DB::table('transactions')
                ->where('voucher_no', $invoice->invoice_no)
                ->where('type', 'payment_in')
                ->get();

            foreach ($oldTransactions as $txn) {
                Account::where('id', $txn->account_id)->decrement('current_balance', $txn->amount);
            }
            DB::table('transactions')->where('voucher_no', $invoice->invoice_no)->where('type', 'payment_in')->delete();

            // 2. REVERSE OLD DUE FROM CUSTOMER
            if ($invoice->due_amount > 0 && $invoice->customer_id) {
                Party::where('id', $invoice->customer_id)->decrement('current_balance', $invoice->due_amount);
            }

            // 3. REVERSE OLD SHIFT STATS
            if ($invoice->shift_id) {
                $shift = Shift::find($invoice->shift_id);
                if ($shift) {
                    $shift->decrement('total_sales', $invoice->grand_total);
                    $shift->decrement('total_collection', $invoice->paid_amount);
                }
            }

            // 4. REVERSE OLD STOCK & LEDGER
            app(InventoryService::class)->reverseSale($invoice);

            // 5. APPLY NEW DATA
            $newDue = max(0, $request->grand_total - $totalPaid);

            $invoice->update([
                'customer_id' => $request->customer_id,
                'sub_total'   => $request->sub_total,
                'discount'    => $request->discount ?? 0,
                'grand_total' => $request->grand_total,
                'paid_amount' => $totalPaid,
                'due_amount'  => $newDue,
            ]);

            // APPLY NEW PAYMENTS
            foreach ($newAccountPayments as $accId => $amount) {
                Account::where('id', $accId)->increment('current_balance', $amount);

                DB::table('transactions')->insert([
                    'branch_id'      => auth()->user()->active_branch_id,
                    'voucher_no'     => $invoice->invoice_no,
                    'date'           => now(),
                    'type'           => 'payment_in',
                    'account_id'     => $accId,
                    'party_id'       => $request->customer_id,
                    'amount'         => $amount,
                    'payment_method' => 'Split Payment',
                    'note'           => 'POS Sale Collection Update #' . $invoice->invoice_no,
                    'created_at'     => now(),
                    'updated_at'     => now(),
                ]);
            }

            // APPLY NEW DUE
            if ($newDue > 0 && $request->customer_id) {
                Party::where('id', $request->customer_id)->increment('current_balance', $newDue);
            }

            // APPLY NEW STOCK
            foreach ($request->cart as $item) app(InventoryService::class)->addSaleItem($invoice, $item);

            $openShift = Shift::where('status', 'open')->first();
            if ($openShift) {
                $openShift->increment('total_sales', $request->grand_total);
                $openShift->increment('total_collection', $totalPaid);
            }

            DB::commit();
            return redirect()->route('admin.invoices.index')->with('success', 'Sale updated successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("POS Update Error: " . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Update Failed: ' . $e->getMessage()]);
        }
    }

    public function destroy($id)
    {
        $invoice = Invoice::with('items')->findOrFail($id);

        try {
            DB::beginTransaction();

            $oldTransactions = DB::table('transactions')
                ->where('voucher_no', $invoice->invoice_no)
                ->where('type', 'payment_in')
                ->get();

            foreach ($oldTransactions as $txn) {
                Account::where('id', $txn->account_id)->decrement('current_balance', $txn->amount);
            }

            if ($invoice->due_amount > 0 && $invoice->customer_id) {
                Party::where('id', $invoice->customer_id)->decrement('current_balance', $invoice->due_amount);
            }

            if ($invoice->shift_id) {
                $shift = Shift::find($invoice->shift_id);
                if ($shift) {
                    $shift->decrement('total_sales', $invoice->grand_total);
                    $shift->decrement('total_collection', $invoice->paid_amount);
                }
            }

            app(InventoryService::class)->reverseSale($invoice);
            DB::table('transactions')->where('voucher_no', $invoice->invoice_no)->delete();

            $invoice->delete();

            DB::commit();
            return redirect()->back()->with('success', 'Invoice deleted and stock reverted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Invoice Delete Error: " . $e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Could not delete invoice: ' . $e->getMessage()]);
        }
    }
}
