<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vehicle extends Model
{
    use HasFactory, SoftDeletes, Concerns\BelongsToBranch;

    protected $guarded = ['id'];

    public function customer()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function party()
    {
        return $this->belongsTo(Party::class, 'party_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }
}

