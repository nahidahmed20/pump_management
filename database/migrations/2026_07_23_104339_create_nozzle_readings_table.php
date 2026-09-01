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
        Schema::create('nozzle_readings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shift_id');
            $table->unsignedBigInteger('nozzle_id');
            $table->decimal('start_meter', 15, 3);
            $table->decimal('end_meter', 15, 3);
            $table->decimal('testing_qty', 15, 3)->default(0);
            $table->decimal('sold_qty', 15, 3)->storedAs('end_meter - start_meter - testing_qty');
            $table->decimal('unit_price', 15, 3);
            $table->decimal('total_amount', 15, 3)->storedAs('(end_meter - start_meter - testing_qty) * unit_price');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nozzle_readings');
    }
};
