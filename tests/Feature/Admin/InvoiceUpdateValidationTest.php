<?php

namespace Tests\Feature\Admin;

use App\Models\Account;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceUpdateValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_invoice_update_rejects_payments_over_the_invoice_total(): void
    {
        [$user, $product, $account, $invoice] = $this->makeInvoice();

        $response = $this->withoutMiddleware()->actingAs($user)->put("/admin/invoices/{$invoice->id}", [
            'customer_id' => null,
            'sub_total' => 100,
            'discount' => 0,
            'grand_total' => 100,
            'cart' => [['id' => $product->id, 'quantity' => 1, 'unit_price' => 100]],
            'payments' => [['account_id' => $account->id, 'amount' => 101]],
        ]);

        $response->assertSessionHasErrors('payments');
        $this->assertSame('INV-ORIGINAL', $invoice->fresh()->invoice_no);
    }

    public function test_invoice_update_requires_a_customer_when_a_balance_is_due(): void
    {
        [$user, $product, $account, $invoice] = $this->makeInvoice();

        $response = $this->withoutMiddleware()->actingAs($user)->put("/admin/invoices/{$invoice->id}", [
            'customer_id' => null,
            'sub_total' => 100,
            'discount' => 0,
            'grand_total' => 100,
            'cart' => [['id' => $product->id, 'quantity' => 1, 'unit_price' => 100]],
            'payments' => [['account_id' => null, 'amount' => 0]],
        ]);

        $response->assertSessionHasErrors('customer_id');
        $this->assertSame('INV-ORIGINAL', $invoice->fresh()->invoice_no);
    }

    private function makeInvoice(): array
    {
        $user = User::factory()->create(['active_branch_id' => 1]);
        $this->actingAs($user);

        $product = Product::create([
            'category_id' => 1,
            'name' => 'Diesel',
            'unit' => 'Ltr',
            'buying_price' => 90,
            'selling_price' => 100,
            'current_stock' => 50,
            'is_active' => true,
        ]);

        $account = Account::create([
            'name' => 'Cash',
            'type' => 'cash',
            'current_balance' => 1000,
        ]);

        $invoice = Invoice::create([
            'invoice_no' => 'INV-ORIGINAL',
            'sub_total' => 100,
            'discount' => 0,
            'grand_total' => 100,
            'paid_amount' => 100,
            'due_amount' => 0,
            'date' => now()->toDateString(),
        ]);

        return [$user, $product, $account, $invoice];
    }
}
