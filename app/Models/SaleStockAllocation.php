<?php
namespace App\Models;
use App\Models\Concerns\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;
class SaleStockAllocation extends Model { use BelongsToBranch; protected $guarded = ['id']; }
