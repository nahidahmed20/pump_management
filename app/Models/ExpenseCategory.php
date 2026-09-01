<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExpenseCategory extends Model
{
    use SoftDeletes;

    protected $guarded = ['id'];

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
