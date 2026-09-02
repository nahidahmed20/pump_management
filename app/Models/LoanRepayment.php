<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LoanRepayment extends Model
{
    use SoftDeletes, BelongsToBranch;
    protected $guarded = ['id'];
    public function loan() { return $this->belongsTo(Loan::class); }
    public function account() { return $this->belongsTo(Account::class); }
}
