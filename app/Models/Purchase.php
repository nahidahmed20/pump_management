<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use SoftDeletes, Concerns\BelongsToBranch;

    protected $guarded = ['id'];

    public function supplier()
    {
        return $this->belongsTo(Party::class, 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'reference_id')->where('payment_type', 'purchase_pay');
    }
}
