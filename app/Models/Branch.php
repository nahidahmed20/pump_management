<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Branch extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];
    protected $casts = ['is_active' => 'boolean'];

    public function users()
    {
        return $this->belongsToMany(User::class);
    }
}
