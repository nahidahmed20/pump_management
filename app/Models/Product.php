<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory, SoftDeletes, Concerns\BelongsToBranch;

    protected $guarded = ['id'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function tanks()
    {
        return $this->hasMany(Tank::class);
    }

    public function stockLedgers()
    {
        return $this->hasMany(StockLedger::class);
    }
}
