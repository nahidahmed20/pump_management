<?php

use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\FuelPriceController;
use App\Http\Controllers\Admin\InvoiceController;
use App\Http\Controllers\Admin\NozzleController;
use App\Http\Controllers\Admin\NozzleReadingController;
use App\Http\Controllers\Admin\PartyController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\PurchaseController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\ShiftController;
use App\Http\Controllers\Admin\TankController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\ExpenseController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\AccountController;
use App\Http\Controllers\Admin\TransactionController;
use App\Http\Controllers\Admin\StockLedgerController;
use App\Http\Controllers\Admin\StockAdjustmentController;
use App\Http\Controllers\Admin\SettingController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\GlobalSearchController;
use App\Http\Controllers\Admin\TankReadingController;
use App\Http\Controllers\Admin\PaymentController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::resource('users', UserController::class);
        Route::resource('roles', RoleController::class);
        Route::resource('permissions', PermissionController::class);
        Route::resource('categories', CategoryController::class);
        Route::resource('products', ProductController::class);
        Route::resource('tanks', TankController::class);
        Route::resource('nozzles', NozzleController::class);
        Route::post('/shifts/{shift}/close', [ShiftController::class, 'closeShift'])->name('shifts.close');
        Route::resource('shifts', ShiftController::class);
        Route::resource('nozzle-readings', NozzleReadingController::class);
        Route::resource('invoices', InvoiceController::class);
        Route::resource('purchases', PurchaseController::class);
        Route::resource('parties', PartyController::class);
        Route::resource('expenses', ExpenseController::class);
        Route::resource('accounts', AccountController::class);
        Route::resource('transactions', TransactionController::class);
        Route::resource('stock-adjustments', StockAdjustmentController::class);
        Route::get('settings', [SettingController::class, 'index'])->name('settings.index');
        Route::put('settings', [SettingController::class, 'update'])->name('settings.update');

        Route::get('/fuel-prices', [FuelPriceController::class, 'index'])->name('fuel-prices.index');
        Route::post('/fuel-prices', [FuelPriceController::class, 'update'])->name('fuel-prices.update');
        Route::get('stock-ledgers', [StockLedgerController::class, 'index'])->name('stock-ledgers.index');
        Route::get('/global-search', [GlobalSearchController::class, 'search'])->name('global.search');

        Route::resource('tank-readings', TankReadingController::class);
        Route::resource('payments', PaymentController::class);

        Route::prefix('reports')->name('reports.')->group(function () {
            Route::get('/purchases', [ReportController::class, 'purchaseReport'])->name('purchases');
            Route::get('/sales', [ReportController::class, 'salesReport'])->name('sales');
            Route::get('/profit-loss', [ReportController::class, 'profitLossReport'])->name('profit_loss');
            Route::get('/customer-due', [ReportController::class, 'customerDueReport'])->name('customer_due');
            Route::get('/supplier-due', [ReportController::class, 'supplierDueReport'])->name('supplier_due');
            Route::get('/expenses', [ReportController::class, 'expenseReport'])->name('expenses');
            Route::get('/daily-cash', [ReportController::class, 'dailyCashSummary'])->name('daily_cash');
            Route::get('loans', [ReportController::class, 'loanReport'])->name('loans');
            Route::get('/loans/{id}/history', [ReportController::class, 'loanHistory'])->name('loans.history');
        });
    });
});

require __DIR__.'/auth.php';
