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
use App\Http\Controllers\Admin\BranchController;
use App\Http\Controllers\Admin\LoanController;
use App\Http\Controllers\Admin\VehicleController;
use App\Http\Controllers\Admin\TankDecantationController;
use App\Http\Controllers\Admin\SmsLogController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified', 'branch', 'permission:dashboard.view'])
    ->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::post('/branch/switch', [BranchController::class, 'switch'])->middleware('branch')->name('branch.switch');

    Route::prefix('admin')->name('admin.')->middleware(['branch', 'period.open', 'audit'])->group(function () {
        Route::resource('branches', BranchController::class)->except(['create', 'show', 'edit'])->middleware('permission:branches.manage');
        Route::resource('users', UserController::class)->middleware('permission:users.manage');
        Route::resource('roles', RoleController::class)->middleware('permission:roles.manage');
        Route::resource('permissions', PermissionController::class)->middleware('permission:permissions.manage');
        Route::resource('categories', CategoryController::class)->middleware('permission:categories.manage');
        Route::resource('products', ProductController::class)->middleware('permission:products.manage');
        Route::resource('tanks', TankController::class)->middleware('permission:tanks.manage');
        Route::resource('nozzles', NozzleController::class)->middleware('permission:nozzles.manage');
        Route::post('/shifts/{shift}/close', [ShiftController::class, 'closeShift'])->middleware('permission:shifts.manage')->name('shifts.close');
        Route::resource('shifts', ShiftController::class)->middleware('permission:shifts.manage');
        Route::resource('nozzle-readings', NozzleReadingController::class)->middleware('permission:nozzle-readings.manage');
        Route::resource('invoices', InvoiceController::class)->middleware('permission:invoices.manage');
        Route::resource('purchases', PurchaseController::class)->middleware('permission:purchases.manage');
        Route::get('customers/{customer}/vehicles', [VehicleController::class, 'byCustomer'])->middleware('permission:parties.manage')->name('customers.vehicles');
        Route::resource('vehicles', VehicleController::class)->middleware('permission:parties.manage');
        Route::resource('parties', PartyController::class)->middleware('permission:parties.manage');
        Route::resource('expenses', ExpenseController::class)->middleware('permission:expenses.manage');
        Route::resource('accounts', AccountController::class)->middleware('permission:accounts.manage');
        Route::resource('transactions', TransactionController::class)->middleware('permission:transactions.manage');
        Route::resource('stock-adjustments', StockAdjustmentController::class)->middleware('permission:stock-adjustments.manage');
        Route::get('settings', [SettingController::class, 'index'])->middleware('permission:settings.manage')->name('settings.index');
        Route::match(['put', 'post'], 'settings', [SettingController::class, 'update'])->middleware('permission:settings.manage')->name('settings.update');
        Route::post('settings/test-sms', [SettingController::class, 'testSms'])->middleware('permission:settings.manage')->name('settings.test-sms');

        Route::resource('tank-decantations', TankDecantationController::class)->middleware('permission:tanks.manage');

        Route::get('sms-logs', [SmsLogController::class, 'index'])->middleware('permission:reports.view')->name('sms-logs.index');
        Route::post('sms-logs/{smsLog}/resend', [SmsLogController::class, 'resend'])->middleware('permission:reports.view')->name('sms-logs.resend');
        Route::delete('sms-logs/{smsLog}', [SmsLogController::class, 'destroy'])->middleware('permission:reports.view')->name('sms-logs.destroy');

        Route::get('/fuel-prices', [FuelPriceController::class, 'index'])->middleware('permission:fuel-prices.manage')->name('fuel-prices.index');
        Route::post('/fuel-prices', [FuelPriceController::class, 'update'])->middleware('permission:fuel-prices.manage')->name('fuel-prices.update');
        Route::get('stock-ledgers', [StockLedgerController::class, 'index'])->middleware('permission:stock-ledgers.view')->name('stock-ledgers.index');
        Route::get('/global-search', [GlobalSearchController::class, 'search'])->middleware('permission:dashboard.view')->name('global.search');

        Route::resource('tank-readings', TankReadingController::class)->middleware('permission:tank-readings.manage');
        Route::resource('payments', PaymentController::class)->middleware('permission:payments.manage');
        Route::post('loans/{loan}/repay', [LoanController::class, 'repay'])->middleware('permission:loans.manage')->name('loans.repay');
        Route::delete('loan-repayments/{repayment}', [LoanController::class, 'destroyRepayment'])->middleware('permission:loans.manage')->name('loan-repayments.destroy');
        Route::resource('loans', LoanController::class)->only(['index', 'store', 'destroy'])->middleware('permission:loans.manage');

        Route::prefix('reports')->name('reports.')->middleware('permission:reports.view')->group(function () {
            Route::get('/purchases', [ReportController::class, 'purchaseReport'])->name('purchases');
            Route::get('/sales', [ReportController::class, 'salesReport'])->name('sales');
            Route::get('/profit-loss', [ReportController::class, 'profitLossReport'])->name('profit_loss');
            Route::get('/customer-due', [ReportController::class, 'customerDueReport'])->name('customer_due');
            Route::get('/supplier-due', [ReportController::class, 'supplierDueReport'])->name('supplier_due');
            Route::get('/expenses', [ReportController::class, 'expenseReport'])->name('expenses');
            Route::get('/daily-cash', [ReportController::class, 'dailyCashSummary'])->name('daily_cash');
            Route::get('/daily-pump-summary', [ReportController::class, 'dailyPumpSummary'])->name('daily_pump_summary');
            Route::get('loans', [ReportController::class, 'loanReport'])->name('loans');
            Route::get('/loans/{id}/history', [ReportController::class, 'loanHistory'])->name('loans.history');
        });
    });
});

require __DIR__.'/auth.php';
