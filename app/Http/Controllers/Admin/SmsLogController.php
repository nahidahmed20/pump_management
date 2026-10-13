<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SmsLog;
use App\Services\SmsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SmsLogController extends Controller
{
    public function index(Request $request)
    {
        $query = SmsLog::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('recipient_phone', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('purpose')) {
            $query->where('purpose', $request->purpose);
        }

        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }

        // Summary counts for dashboard badges
        $stats = [
            'total'     => (clone $query)->count(),
            'sent'      => (clone $query)->where('status', 'sent')->count(),
            'failed'    => (clone $query)->where('status', 'failed')->count(),
            'simulated' => (clone $query)->where('status', 'simulated')->count(),
        ];

        $perPage = $request->input('per_page', 15);
        $logs = $query->latest('id')->paginate($perPage === 'all' ? 10000 : (int)$perPage)->withQueryString();

        return Inertia::render('Admin/SmsLog/Index', [
            'logs'    => $logs,
            'stats'   => $stats,
            'filters' => $request->only(['search', 'status', 'purpose', 'date', 'per_page']),
        ]);
    }

    public function resend(SmsLog $smsLog)
    {
        $success = SmsService::send($smsLog->recipient_phone, $smsLog->message, $smsLog->purpose);

        if ($success) {
            return redirect()->back()->with('success', 'SMS resent successfully.');
        }

        return redirect()->back()->with('error', 'Resend attempt failed. Check gateway credentials.');
    }

    public function destroy(SmsLog $smsLog)
    {
        $smsLog->delete();
        return redirect()->back()->with('success', 'SMS log removed.');
    }
}

