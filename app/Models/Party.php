<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Party extends Model
{
    use SoftDeletes, Concerns\BelongsToBranch;

    protected $guarded = ['id'];

    public function invoices()
    {
        return $this->hasMany(Invoice::class, 'customer_id');
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class, 'supplier_id');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
