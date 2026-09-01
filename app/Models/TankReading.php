<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TankReading extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    public function tank()
    {
        return $this->belongsTo(Tank::class);
    }
}
