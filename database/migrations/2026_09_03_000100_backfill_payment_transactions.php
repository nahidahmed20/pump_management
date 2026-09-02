<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('payments')->whereNull('deleted_at')->orderBy('id')->each(function ($payment) {
            $voucher = 'PAY-'.str_pad($payment->id, 6, '0', STR_PAD_LEFT);
            if (DB::table('transactions')->where('voucher_no', $voucher)->exists()) return;

            DB::table('transactions')->insert([
                'branch_id' => $payment->branch_id,
                'voucher_no' => $voucher,
                'date' => $payment->date,
                'type' => in_array($payment->payment_type, ['due_receive', 'invoice_receive'], true) ? 'payment_in' : 'payment_out',
                'account_id' => $payment->account_id,
                'party_id' => $payment->party_id,
                'amount' => $payment->amount,
                'payment_method' => 'Due settlement',
                'note' => $payment->note ?: 'Migrated payment transaction',
                'created_at' => $payment->created_at,
                'updated_at' => $payment->updated_at,
            ]);
        });
    }

    public function down(): void
    {
        DB::table('transactions')->where('voucher_no', 'like', 'PAY-%')->delete();
    }
};
