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
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('supplier_id');
            $table->string('reference_no')->nullable();
            $table->decimal('sub_total', 15, 3);
            $table->decimal('discount', 15, 3)->default(0);
            $table->decimal('grand_total', 15, 3);
            $table->decimal('paid_amount', 15, 3);
            $table->decimal('due_amount', 15, 3)->default(0);
            $table->date('date');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
