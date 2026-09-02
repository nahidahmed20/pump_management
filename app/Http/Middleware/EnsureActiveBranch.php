<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveBranch
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) return $next($request);

        $allowed = $user->branches()->where('branches.is_active', true)->pluck('branches.id');
        if ($allowed->isEmpty()) abort(403, 'No active branch is assigned to your account.');

        if (!$user->active_branch_id || !$allowed->contains($user->active_branch_id)) {
            $user->forceFill(['active_branch_id' => $allowed->first()])->saveQuietly();
        }

        return $next($request);
    }
}
