<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\SaleStockAllocation;
use App\Models\StockLedger;
use App\Models\Tank;
use Illuminate\Validation\ValidationException;

class InventoryService
{
    public function addSaleItem(Invoice $invoice, array $data): InvoiceItem
    {
        $product = Product::lockForUpdate()->findOrFail($data['id']);
        $quantity = (float) $data['quantity'];
        if ($quantity <= 0 || $product->current_stock < $quantity) throw ValidationException::withMessages(['cart' => "Insufficient {$product->name} stock."]);
        $item = InvoiceItem::create([
            'invoice_id' => $invoice->id, 'product_id' => $product->id, 'quantity' => $quantity,
            'unit_price' => $data['unit_price'], 'cost_price' => $product->buying_price,
            'total_price' => round($quantity * (float) $data['unit_price'], 3),
        ]);
        $remaining = $quantity;
        $tanks = Tank::where('product_id', $product->id)->where('current_stock', '>', 0)->orderBy('id')->lockForUpdate()->get();
        if ($tanks->isNotEmpty() && $tanks->sum('current_stock') < $quantity) throw ValidationException::withMessages(['cart' => "Tank stock is insufficient for {$product->name}."]);
        foreach ($tanks as $tank) {
            if ($remaining <= 0) break;
            $allocated = min($remaining, (float) $tank->current_stock);
            $tank->decrement('current_stock', $allocated);
            SaleStockAllocation::create(['invoice_item_id' => $item->id, 'tank_id' => $tank->id, 'quantity' => $allocated]);
            StockLedger::create(['product_id' => $product->id, 'tank_id' => $tank->id, 'type' => 'out', 'quantity' => $allocated, 'source' => 'pos_sale', 'source_id' => $invoice->id, 'date' => $invoice->date]);
            $remaining -= $allocated;
        }
        if ($tanks->isEmpty()) StockLedger::create(['product_id' => $product->id, 'type' => 'out', 'quantity' => $quantity, 'source' => 'pos_sale', 'source_id' => $invoice->id, 'date' => $invoice->date]);
        $product->decrement('current_stock', $quantity);
        return $item;
    }

    public function reverseSale(Invoice $invoice): void
    {
        $invoice->loadMissing('items');
        foreach ($invoice->items as $item) {
            Product::whereKey($item->product_id)->increment('current_stock', $item->quantity);
            foreach (SaleStockAllocation::where('invoice_item_id', $item->id)->get() as $allocation) {
                Tank::whereKey($allocation->tank_id)->increment('current_stock', $allocation->quantity);
            }
        }
        StockLedger::where('source', 'pos_sale')->where('source_id', $invoice->id)->delete();
        $invoice->items()->delete();
    }
}
