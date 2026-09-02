<?php
namespace App\Http\Middleware;
use App\Models\AccountingPeriod;
use Closure;
use Illuminate\Http\Request;
class RejectClosedPeriod {
    public function handle(Request $request, Closure $next) {
        if (!in_array($request->method(), ['GET','HEAD','OPTIONS'], true) && $request->user() && !$request->routeIs('admin.controls.*')) {
            $date = $request->input('date') ?: $request->input('loan_date') ?: now()->toDateString();
            abort_if(AccountingPeriod::where('is_closed', true)->whereDate('start_date','<=',$date)->whereDate('end_date','>=',$date)->exists(), 423, 'This accounting period is closed.');
        }
        return $next($request);
    }
}
