<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    use HasFactory, Concerns\BelongsToBranch;

    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function invoices()
    {
        return $this->hasMany(Invoice::class);
    }

    public function nozzleReadings()
    {
        return $this->hasMany(NozzleReading::class);
    }
}
