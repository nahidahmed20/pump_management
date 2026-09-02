<?php

namespace App\Models\Concerns;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

trait BelongsToBranch
{
    public static function bootBelongsToBranch(): void
    {
        static::addGlobalScope('branch', function (Builder $builder) {
            if (Auth::check() && Auth::user()->active_branch_id) {
                $builder->where($builder->qualifyColumn('branch_id'), Auth::user()->active_branch_id);
            }
        });

        static::creating(function ($model) {
            if (!$model->branch_id && Auth::check()) {
                $model->branch_id = Auth::user()->active_branch_id;
            }
        });
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
