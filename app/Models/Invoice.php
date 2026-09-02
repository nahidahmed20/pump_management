<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory, Concerns\BelongsToBranch;

    protected $guarded = [];

    // Customer Relationship
    public function customer()
    {
        return $this->belongsTo(Party::class, 'customer_id');
    }

    // Shift Relationship
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    // Invoice Items
    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }
}
