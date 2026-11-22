<?php

namespace Tests\Feature\Admin;

use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseTotalValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchase_totals_are_recalculated_from_cart_lines(): void
    {
        $user = User::factory()->create(['active_branch_id' => 1]);
        $this->withoutMiddleware()->actingAs($user);

        $supplier = Party::create(['name' => 'Supplier', 'type' => 'supplier']);
        $product = Product::create([
            'category_id' => 1,
            'name' => 'Diesel',
            'unit' => 'Ltr',
            'buying_price' => 90,
            'selling_price' => 100,
            'current_stock' => 0,
            'is_active' => true,
        ]);

        $response = $this->post('/admin/purchases', [
            'supplier_id' => $supplier->id,
            'sub_total' => 1,
            'discount' => 0,
            'grand_total' => 1,
            'cart' => [[
                'id' => $product->id,
                'quantity' => 2,
                'unit_price' => 10,
                'total_price' => 1,
            ]],
            'payments' => [['account_id' => null, 'amount' => 0]],
        ]);

        $response->assertRedirect('/admin/purchases');
        $purchase = Purchase::firstOrFail();
        $this->assertEquals(20, $purchase->grand_total);
        $this->assertEquals(20, $purchase->sub_total);
        $this->assertEquals(20, $purchase->due_amount);
        $this->assertEquals(2, $product->fresh()->current_stock);
    }
}
