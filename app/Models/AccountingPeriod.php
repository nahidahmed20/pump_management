<?php
namespace App\Models;
use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
class AccountingPeriod extends Model { use BelongsToBranch; protected $guarded=['id']; protected $casts=['is_closed'=>'boolean']; }
