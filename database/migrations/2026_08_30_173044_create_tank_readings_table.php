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
        Schema::create('tank_readings', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->unsignedBigInteger('tank_id');
            $table->decimal('software_stock', 15, 3);
            $table->decimal('physical_stock', 15, 3);
            $table->decimal('difference', 15, 3)->storedAs('physical_stock - software_stock'); 
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tank_readings');
    }
};
