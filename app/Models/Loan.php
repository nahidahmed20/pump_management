<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Loan extends Model
{
    use SoftDeletes, BelongsToBranch;
    protected $guarded = ['id'];

    public function lender() { return $this->belongsTo(Party::class, 'lender_id'); }
    public function account() { return $this->belongsTo(Account::class); }
    public function repayments() { return $this->hasMany(LoanRepayment::class); }
}
