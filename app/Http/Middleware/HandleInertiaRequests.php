<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $branchId = $request->user()?->active_branch_id ?? 1;
        $settingsMap = Setting::where('branch_id', $branchId)->pluck('value', 'key')->toArray();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->load('activeBranch:id,name,code'),
                'roles' => $request->user() ? $request->user()->getRoleNames() : [],
                'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name') : [],
                'branches' => $request->user() ? $request->user()->branches()->where('is_active', true)->get(['branches.id', 'name', 'code']) : [],
            ],
            'settings' => [
                'company_name'    => $settingsMap['company_name'] ?? 'FuelDesk ERP',
                'company_phone'   => $settingsMap['company_phone'] ?? '',
                'company_email'   => $settingsMap['company_email'] ?? '',
                'company_address' => $settingsMap['company_address'] ?? '',
                'currency_symbol' => $settingsMap['currency_symbol'] ?? '৳',
                'invoice_terms'   => $settingsMap['invoice_terms'] ?? '',
                'receipt_footer'  => $settingsMap['receipt_footer'] ?? 'Thank you for your business!',
                'logo_url'        => !empty($settingsMap['logo']) ? '/storage/' . ltrim($settingsMap['logo'], '/') : null,
            ],
        ];
    }
}
