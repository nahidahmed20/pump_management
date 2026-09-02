<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        DB::table('branches')->insert([
            'id' => 1, 'name' => 'Main Branch', 'code' => 'MAIN', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('active_branch_id')->nullable()->after('password')->constrained('branches')->nullOnDelete();
        });

        Schema::create('branch_user', function (Blueprint $table) {
            $table->foreignId('branch_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->primary(['branch_id', 'user_id']);
        });

        $tables = [
            'categories', 'products', 'tanks', 'nozzles', 'shifts', 'nozzle_readings',
            'invoices', 'invoice_items', 'purchases', 'purchase_items', 'stock_ledgers',
            'parties', 'accounts', 'transactions', 'settings', 'stock_adjustments',
            'payments', 'expense_categories', 'expenses', 'tank_readings',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->foreignId('branch_id')->default(1)->index()->constrained('branches')->restrictOnDelete();
            });
        }

        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_name_unique');
            $table->unique(['branch_id', 'name']);
        });
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique('settings_key_unique');
            $table->unique(['branch_id', 'key']);
        });

        DB::table('users')->update(['active_branch_id' => 1]);
        DB::table('users')->orderBy('id')->each(function ($user) {
            DB::table('branch_user')->insertOrIgnore(['branch_id' => 1, 'user_id' => $user->id]);
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique(['branch_id', 'name']);
            $table->unique('name');
        });
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['branch_id', 'key']);
            $table->unique('key');
        });
        $tables = [
            'categories', 'products', 'tanks', 'nozzles', 'shifts', 'nozzle_readings',
            'invoices', 'invoice_items', 'purchases', 'purchase_items', 'stock_ledgers',
            'parties', 'accounts', 'transactions', 'settings', 'stock_adjustments',
            'payments', 'expense_categories', 'expenses', 'tank_readings',
        ];
        foreach ($tables as $tableName) {
            Schema::table($tableName, fn (Blueprint $table) => $table->dropConstrainedForeignId('branch_id'));
        }
        Schema::dropIfExists('branch_user');
        Schema::table('users', fn (Blueprint $table) => $table->dropConstrainedForeignId('active_branch_id'));
        Schema::dropIfExists('branches');
    }
};
