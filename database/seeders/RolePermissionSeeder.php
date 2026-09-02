<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'dashboard.view', 'branches.manage', 'users.manage', 'roles.manage',
            'permissions.manage', 'categories.manage', 'products.manage', 'tanks.manage',
            'nozzles.manage', 'fuel-prices.manage', 'parties.manage', 'accounts.manage',
            'payments.manage', 'expenses.manage', 'transactions.manage', 'purchases.manage',
            'stock-adjustments.manage', 'stock-ledgers.view', 'shifts.manage',
            'tank-readings.manage', 'nozzle-readings.manage', 'invoices.manage', 'reports.view',
            'settings.manage',
            'loans.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $superAdminRole = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $managerRole = Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);

        $managerRole->syncPermissions(array_diff($permissions, [
            'branches.manage', 'users.manage', 'roles.manage', 'permissions.manage', 'settings.manage',
        ]));
        $admin = User::firstOrCreate(
            ['email' => 'surmafillingstation@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('11111111') 
            ]
        );
        $admin->assignRole($superAdminRole);
        if (\Illuminate\Support\Facades\Schema::hasTable('branches')) {
            $admin->branches()->syncWithoutDetaching([1]);
            $admin->update(['active_branch_id' => 1]);
        }

        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Station Manager',
                'password' => Hash::make('password') 
            ]
        );
        $manager->assignRole($managerRole);
        if (\Illuminate\Support\Facades\Schema::hasTable('branches')) {
            $manager->branches()->syncWithoutDetaching([1]);
            $manager->update(['active_branch_id' => 1]);
        }
    }
}
