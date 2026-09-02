<?php

namespace App\Models;

use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class PaymentAllocation extends Model
{
    use BelongsToBranch;
    protected $guarded = ['id'];
    public function payment() { return $this->belongsTo(Payment::class); }
}
