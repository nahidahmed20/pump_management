<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class TankDecantation extends Model
{
    use HasFactory, SoftDeletes, Concerns\BelongsToBranch;

    protected $guarded = ['id'];

    protected $casts = [
        'date' => 'date',
        'invoice_qty' => 'float',
        'dip_before_mm' => 'float',
        'stock_before_litres' => 'float',
        'dip_after_mm' => 'float',
        'stock_after_litres' => 'float',
        'received_qty' => 'float',
        'variance_qty' => 'float',
        'density' => 'float',
        'temperature' => 'float',
    ];

    public function tank()
    {
        return $this->belongsTo(Tank::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function supplier()
    {
        return $this->belongsTo(Party::class, 'supplier_id');
    }
}

