<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Model;

class Nozzle extends Model
{
    use HasFactory, SoftDeletes, Concerns\BelongsToBranch;

    protected $guarded = ['id'];

    public function tank()
    {
        return $this->belongsTo(Tank::class);
    }

    public function readings()
    {
        return $this->hasMany(NozzleReading::class);
    }
}
