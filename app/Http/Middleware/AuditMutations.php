<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AuditLog;

class AuditMutations
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if (!in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true) && $request->user()) {
            try {
                $payload = $request->except([
                    'password',
                    'password_confirmation',
                    '_token',
                ]);
                foreach ($request->allFiles() as $fileKey => $file) {
                    unset($payload[$fileKey]);
                }

                AuditLog::create([
                    'branch_id' => $request->user()->active_branch_id,
                    'user_id' => $request->user()->id,
                    'method' => $request->method(),
                    'path' => $request->path(),
                    'ip_address' => $request->ip(),
                    'payload' => $payload,
                    'status_code' => $response->getStatusCode(),
                ]);
            } catch (\Throwable $e) {
                report($e);
            }
        }

        return $response;
    }
}
