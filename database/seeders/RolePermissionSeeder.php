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
            'dashboard.view',
            'sales.view',
            'purchase.view',
            'inventory.view',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        $superAdminRole = Role::create(['name' => 'Super Admin']);
        $managerRole = Role::create(['name' => 'Manager']);

        $managerRole->givePermissionTo(['dashboard.view', 'sales.view']);
        $admin = User::firstOrCreate(
            ['email' => 'surmafillingstation@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('11111111') 
            ]
        );
        $admin->assignRole($superAdminRole);

        $manager = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'name' => 'Station Manager',
                'password' => Hash::make('password') 
            ]
        );
        $manager->assignRole($managerRole);
    }
}