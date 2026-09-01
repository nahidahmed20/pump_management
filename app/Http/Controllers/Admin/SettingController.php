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
    ];

    public function index()
    {
        $settings = Setting::pluck('value', 'key')->toArray();

        $formattedSettings = [
            'company_name'    => $settings['company_name'] ?? 'My Petrol Pump',
            'company_phone'   => $settings['company_phone'] ?? '',
            'company_email'   => $settings['company_email'] ?? '',
            'company_address' => $settings['company_address'] ?? '',
            'currency_symbol' => $settings['currency_symbol'] ?? '৳',
            'invoice_terms'   => $settings['invoice_terms'] ?? '',
            'receipt_footer'  => $settings['receipt_footer'] ?? 'Thank you for your business!',
            'logo'            => $settings['logo'] ?? null,
            // Give the frontend a ready-to-use URL instead of making it
            // guess the disk/path convention itself.
            'logo_url'        => !empty($settings['logo']) ? Storage::disk('public')->url($settings['logo']) : null,
        ];

        return Inertia::render('Admin/Setting/Index', [
            'setting' => $formattedSettings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name'    => 'required|string|max:255',
            'company_phone'   => 'nullable|string|max:20',
            'company_email'   => 'nullable|email|max:255',
            'company_address' => 'nullable|string',
            'currency_symbol' => 'nullable|string|max:10',
            'invoice_terms'   => 'nullable|string',
            'receipt_footer'  => 'nullable|string|max:255',
            'logo'            => 'nullable|image|mimes:jpeg,png,jpg,svg|max:2048',
            'remove_logo'     => 'nullable|boolean',
        ]);

        // Whitelisted text fields only — never trust $request->except().
        $data = array_intersect_key($validated, array_flip(self::TEXT_KEYS));

        $oldLogo = Setting::where('key', 'logo')->first();

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
            Setting::updateOrCreate(['key' => $key], ['value' => $value]);
        }

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}
