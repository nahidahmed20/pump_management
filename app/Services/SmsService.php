<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\SmsLog;
use App\Models\Invoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    /**
     * Send an SMS and record the dispatch in sms_logs.
     */
    public static function send(string $phone, string $message, string $purpose = 'general', ?int $branchId = null): bool
    {
        $branchId = $branchId ?? (auth()->user()?->active_branch_id ?? 1);
        $settings = Setting::where('branch_id', $branchId)->pluck('value', 'key')->toArray();

        // Sanitize phone number (e.g. remove spaces, hyphens, ensure 880 or 017 prefix)
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '880')) {
            $normalizedPhone = $cleanPhone;
        } elseif (str_starts_with($cleanPhone, '01')) {
            $normalizedPhone = '88' . $cleanPhone;
        } else {
            $normalizedPhone = $cleanPhone;
        }

        $isEnabled = !empty($settings['sms_enabled']) && in_array(strtolower((string)$settings['sms_enabled']), ['1', 'true', 'yes'], true);
        $apiKey = $settings['sms_api_key'] ?? '';
        $senderId = $settings['sms_sender_id'] ?? '';
        $provider = $settings['sms_provider'] ?? 'greenweb';

        // If SMS is disabled or no API key, record simulated SMS log and return
        if (!$isEnabled || empty($apiKey)) {
            SmsLog::create([
                'branch_id'       => $branchId,
                'recipient_phone' => $phone,
                'message'         => $message,
                'purpose'         => $purpose,
                'status'          => 'simulated',
                'response_data'   => 'SMS Gateway disabled or API key not configured. Simulated dispatch.',
            ]);
            return true;
        }

        try {
            $responseBody = '';
            $isSuccess = false;

            if ($provider === 'greenweb') {
                $response = Http::timeout(5)->asForm()->post('https://api.greenweb.com.bd/api.php', [
                    'token'   => $apiKey,
                    'to'      => $normalizedPhone,
                    'message' => $message,
                ]);
                $responseBody = $response->body();
                $isSuccess = $response->successful() && !str_contains(strtolower($responseBody), 'error');
            } elseif ($provider === 'mimsms') {
                $response = Http::timeout(5)->post('https://api.mimsms.com/api/v3/send-sms', [
                    'api_key'    => $apiKey,
                    'type'       => 'text',
                    'contacts'   => $normalizedPhone,
                    'senderid'   => $senderId ?: '8809612...',
                    'msg'        => $message,
                ]);
                $responseBody = $response->body();
                $isSuccess = $response->successful();
            } else {
                // Generic HTTP GET / POST
                $response = Http::timeout(5)->get('https://api.greenweb.com.bd/api.php', [
                    'token'   => $apiKey,
                    'to'      => $normalizedPhone,
                    'message' => $message,
                ]);
                $responseBody = $response->body();
                $isSuccess = $response->successful();
            }

            SmsLog::create([
                'branch_id'       => $branchId,
                'recipient_phone' => $phone,
                'message'         => $message,
                'purpose'         => $purpose,
                'status'          => $isSuccess ? 'sent' : 'failed',
                'response_data'   => substr((string)$responseBody, 0, 500),
            ]);

            return $isSuccess;
        } catch (\Throwable $e) {
            Log::error('SMS Dispatch Error: ' . $e->getMessage());
            SmsLog::create([
                'branch_id'       => $branchId,
                'recipient_phone' => $phone,
                'message'         => $message,
                'purpose'         => $purpose,
                'status'          => 'failed',
                'response_data'   => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send instant SMS notification on Credit Fueling / Invoice generation.
     */
    public static function sendCreditSaleNotification(Invoice $invoice): void
    {
        try {
            $customer = $invoice->customer;
            if (!$customer || empty($customer->phone)) {
                return;
            }

            $branchId = $invoice->branch_id ?? (auth()->user()?->active_branch_id ?? 1);
            $settings = Setting::where('branch_id', $branchId)->pluck('value', 'key')->toArray();

            // Check if credit sale notification is enabled
            $notifyEnabled = !empty($settings['sms_credit_sale_notify']) && in_array(strtolower((string)$settings['sms_credit_sale_notify']), ['1', 'true', 'yes'], true);
            if (!$notifyEnabled) {
                return;
            }

            $companyName = $settings['company_name'] ?? 'Surma Filling Station';
            $vehicleText = $invoice->vehicle_no ? "Veh: {$invoice->vehicle_no}, " : "";
            $slipText = $invoice->slip_no ? "Slip: {$invoice->slip_no}, " : "";
            $amount = number_format($invoice->grand_total, 2);
            $due = number_format($invoice->due_amount, 2);

            $msg = "Dear {$customer->name}, {$vehicleText}{$slipText}Fueled for Tk {$amount}. Current Due: Tk {$due}. Thanks - {$companyName}";

            self::send($customer->phone, $msg, 'credit_sale', $branchId);
        } catch (\Throwable $e) {
            Log::warning('Credit Sale SMS Trigger failed: ' . $e->getMessage());
        }
    }
}

