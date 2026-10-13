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
        // 1. SMS Logs table
        if (!Schema::hasTable('sms_logs')) {
            Schema::create('sms_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('branch_id')->default(1)->index();
                $table->string('recipient_phone', 25)->index();
                $table->text('message');
                $table->string('purpose', 50)->default('credit_sale');
                $table->enum('status', ['sent', 'failed', 'simulated'])->default('sent');
                $table->text('response_data')->nullable();
                $table->timestamps();
            });
        }

        // 2. Tank Truck Decantations table (Fuel Lorry Discharge Log)
        if (!Schema::hasTable('tank_decantations')) {
            Schema::create('tank_decantations', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('branch_id')->default(1)->index();
                $table->date('date')->index();
                $table->string('challan_no')->nullable();
                $table->unsignedBigInteger('supplier_id')->nullable();
                $table->unsignedBigInteger('tank_id');
                $table->unsignedBigInteger('product_id');
                $table->string('tank_lorry_no')->nullable();
                $table->string('driver_name')->nullable();
                $table->string('driver_phone')->nullable();
                $table->decimal('invoice_qty', 15, 3)->default(0); // Litres as per Challan
                $table->decimal('dip_before_mm', 10, 2)->default(0);
                $table->decimal('stock_before_litres', 15, 3)->default(0);
                $table->decimal('dip_after_mm', 10, 2)->default(0);
                $table->decimal('stock_after_litres', 15, 3)->default(0);
                $table->decimal('received_qty', 15, 3)->default(0); // Actual Received Litres
                $table->decimal('variance_qty', 15, 3)->default(0); // Shortage (-) or Gain (+)
                $table->decimal('density', 8, 4)->nullable();
                $table->decimal('temperature', 6, 2)->nullable();
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->string('unloaded_by')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('tank_id')->references('id')->on('tanks')->cascadeOnDelete();
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tank_decantations');
        Schema::dropIfExists('sms_logs');
    }
};

