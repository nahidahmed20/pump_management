<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('payment_type'); // invoice_receive, purchase_pay, due_receive
            $table->unsignedBigInteger('reference_id')->nullable(); // invoice_id or purchase_id
            $table->unsignedBigInteger('party_id')->nullable();
            $table->unsignedBigInteger('account_id'); // cash/bank
            $table->decimal('amount', 15, 2);
            $table->string('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
