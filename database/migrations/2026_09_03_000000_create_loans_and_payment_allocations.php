<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('to_account_id')->nullable()->after('account_id')->constrained('accounts')->nullOnDelete();
        });
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->index()->constrained()->restrictOnDelete();
            $table->foreignId('lender_id')->constrained('parties')->restrictOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->string('loan_no')->unique();
            $table->date('loan_date');
            $table->date('due_date')->nullable();
            $table->decimal('principal_amount', 15, 2);
            $table->enum('profit_type', ['none', 'fixed', 'percentage'])->default('none');
            $table->decimal('profit_rate', 8, 3)->default(0);
            $table->decimal('profit_amount', 15, 2)->default(0);
            $table->decimal('total_payable', 15, 2);
            $table->decimal('principal_paid', 15, 2)->default(0);
            $table->decimal('profit_paid', 15, 2)->default(0);
            $table->enum('status', ['active', 'paid'])->default('active');
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('loan_repayments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->index()->constrained()->restrictOnDelete();
            $table->foreignId('loan_id')->constrained()->restrictOnDelete();
            $table->foreignId('account_id')->constrained()->restrictOnDelete();
            $table->date('date');
            $table->decimal('principal_amount', 15, 2)->default(0);
            $table->decimal('profit_amount', 15, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->index()->constrained()->restrictOnDelete();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->string('document_type');
            $table->unsignedBigInteger('document_id');
            $table->decimal('amount', 15, 2);
            $table->timestamps();
            $table->index(['document_type', 'document_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('loans');
        Schema::table('transactions', fn (Blueprint $table) => $table->dropConstrainedForeignId('to_account_id'));
    }
};
