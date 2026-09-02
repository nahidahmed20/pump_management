<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoice_items', function (Blueprint $table) {
            $table->decimal('cost_price', 15, 3)->default(0)->after('unit_price');
        });
        Schema::create('sale_stock_allocations', function (Blueprint $table) {
            $table->id(); $table->foreignId('branch_id')->index()->constrained()->restrictOnDelete();
            $table->foreignId('invoice_item_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tank_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity', 15, 3); $table->timestamps();
        });
        Schema::create('accounting_periods', function (Blueprint $table) {
            $table->id(); $table->foreignId('branch_id')->index()->constrained()->cascadeOnDelete();
            $table->date('start_date'); $table->date('end_date'); $table->boolean('is_closed')->default(true);
            $table->foreignId('closed_by')->nullable()->constrained('users')->nullOnDelete(); $table->timestamps();
        });
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id(); $table->foreignId('branch_id')->nullable()->index()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); $table->string('method', 10);
            $table->string('path'); $table->string('ip_address', 45)->nullable(); $table->json('payload')->nullable();
            $table->unsignedSmallInteger('status_code'); $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('audit_logs'); Schema::dropIfExists('accounting_periods'); Schema::dropIfExists('sale_stock_allocations');
        Schema::table('invoice_items', fn (Blueprint $table) => $table->dropColumn('cost_price'));
    }
};
