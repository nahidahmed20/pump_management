<?php
namespace App\Http\Middleware;
use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
class AuditMutations {
    public function handle(Request $request, Closure $next) {
        $response = $next($request);
        if (!in_array($request->method(), ['GET','HEAD','OPTIONS'], true) && $request->user()) {
            AuditLog::create(['branch_id'=>$request->user()->active_branch_id,'user_id'=>$request->user()->id,'method'=>$request->method(),'path'=>$request->path(),'ip_address'=>$request->ip(),'payload'=>$request->safe()->except(['password','password_confirmation']),'status_code'=>$response->getStatusCode()]);
        }
        return $response;
    }
}
