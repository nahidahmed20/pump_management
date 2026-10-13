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
        Schema::create('vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->default(1)->constrained('branches')->cascadeOnDelete();
            $table->foreignId('party_id')->constrained('parties')->cascadeOnDelete();
            $table->string('vehicle_no');
            $table->string('vehicle_type')->nullable(); // Truck, Bus, Pickup, Car, Motorcycle, Tractor, Generator, Other
            $table->string('driver_name')->nullable();
            $table->string('driver_phone')->nullable();
            $table->decimal('monthly_credit_limit', 15, 2)->default(0);
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['branch_id', 'party_id']);
            $table->index(['branch_id', 'vehicle_no']);
        });

        Schema::table('invoices', function (Blueprint $table) {
            $table->foreignId('vehicle_id')->nullable()->after('customer_id')->constrained('vehicles')->nullOnDelete();
            $table->string('vehicle_no')->nullable()->after('vehicle_id');
            $table->string('slip_no')->nullable()->after('vehicle_no');
            $table->decimal('odometer_km', 12, 2)->nullable()->after('slip_no');
            $table->string('driver_name')->nullable()->after('odometer_km');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropForeign(['vehicle_id']);
            $table->dropColumn(['vehicle_id', 'vehicle_no', 'slip_no', 'odometer_km', 'driver_name']);
        });

        Schema::dropIfExists('vehicles');
    }
};

