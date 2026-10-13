<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingController extends Controller
{
    /**
     * Keys that are allowed to be written by this form.
     * Keeping this as a single source of truth avoids ever writing
     * stray request fields (e.g. Inertia's `_method` spoof field)
     * into the settings table.
     */
    private const TEXT_KEYS = [
        'company_name',
        'company_phone',
        'company_email',
        'company_address',
        'currency_symbol',
        'invoice_terms',
        'receipt_footer',
        'sms_enabled',
        'sms_provider',
        'sms_api_key',
        'sms_sender_id',
        'sms_credit_sale_notify',
    ];

    public function index()
    {
        $branchId = auth()->user()?->active_branch_id ?? 1;
        $settings = Setting::where('branch_id', $branchId)->pluck('value', 'key')->toArray();

        $formattedSettings = [
            'company_name'           => $settings['company_name'] ?? 'My Petrol Pump',
            'company_phone'          => $settings['company_phone'] ?? '',
            'company_email'          => $settings['company_email'] ?? '',
            'company_address'        => $settings['company_address'] ?? '',
            'currency_symbol'        => $settings['currency_symbol'] ?? '৳',
            'invoice_terms'          => $settings['invoice_terms'] ?? '',
            'receipt_footer'         => $settings['receipt_footer'] ?? 'Thank you for your business!',
            'sms_enabled'            => $settings['sms_enabled'] ?? '0',
            'sms_provider'           => $settings['sms_provider'] ?? 'greenweb',
            'sms_api_key'            => $settings['sms_api_key'] ?? '',
            'sms_sender_id'          => $settings['sms_sender_id'] ?? '',
            'sms_credit_sale_notify' => $settings['sms_credit_sale_notify'] ?? '1',
            'logo'                   => $settings['logo'] ?? null,
            // Give the frontend a ready-to-use URL instead of making it
            // guess the disk/path convention itself.
            'logo_url'               => !empty($settings['logo']) ? '/storage/' . ltrim($settings['logo'], '/') : null,
        ];

        return Inertia::render('Admin/Setting/Index', [
            'setting' => $formattedSettings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name'           => 'required|string|max:255',
            'company_phone'          => 'nullable|string|max:20',
            'company_email'          => 'nullable|email|max:255',
            'company_address'        => 'nullable|string',
            'currency_symbol'        => 'nullable|string|max:10',
            'invoice_terms'          => 'nullable|string',
            'receipt_footer'         => 'nullable|string|max:255',
            'sms_enabled'            => 'nullable|string',
            'sms_provider'           => 'nullable|string|max:50',
            'sms_api_key'            => 'nullable|string|max:255',
            'sms_sender_id'          => 'nullable|string|max:50',
            'sms_credit_sale_notify' => 'nullable|string',
            'logo'                   => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
            'remove_logo'            => 'nullable|boolean',
        ]);

        // Whitelisted text fields only — never trust $request->except().
        $data = array_intersect_key($validated, array_flip(self::TEXT_KEYS));

        $branchId = $request->user()?->active_branch_id ?? 1;
        $oldLogo = Setting::where('branch_id', $branchId)->where('key', 'logo')->first();

        if ($request->hasFile('logo')) {
            if ($oldLogo && $oldLogo->value && Storage::disk('public')->exists($oldLogo->value)) {
                Storage::disk('public')->delete($oldLogo->value);
            }
            $data['logo'] = $request->file('logo')->store('settings', 'public');
        } elseif ($request->boolean('remove_logo')) {
            if ($oldLogo && $oldLogo->value && Storage::disk('public')->exists($oldLogo->value)) {
                Storage::disk('public')->delete($oldLogo->value);
            }
            $data['logo'] = null;
        }

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['branch_id' => $branchId, 'key' => $key],
                ['value' => $value]
            );
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }

    public function testSms(Request $request)
    {
        $request->validate([
            'phone'   => 'required|string|min:10|max:20',
            'message' => 'nullable|string|max:160',
        ]);

        $branchId = $request->user()?->active_branch_id ?? 1;
        $companyName = Setting::where('branch_id', $branchId)->where('key', 'company_name')->value('value') ?? 'FuelDesk ERP';
        $message = $request->message ?: "Test notification from {$companyName}. SMS gateway configuration is working!";

        $success = \App\Services\SmsService::send($request->phone, $message, 'test', $branchId);

        if ($success) {
            return redirect()->back()->with('success', 'Test SMS successfully dispatched to ' . $request->phone);
        }

        return redirect()->back()->with('error', 'Failed to dispatch SMS. Please verify your API Key and Gateway settings.');
    }
}
