<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display listing of roles with assigned permissions.
     */
    public function index(Request $request): Response
    {

        $roles = Role::query()
            ->with('permissions:id,name') // Eager load permissions
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString()
            ->through(fn ($role) => [
                'id'          => $role->id,
                'name'        => $role->name,
                'permissions' => $role->permissions->pluck('name'),
                'created_at'  => $role->created_at->format('d M, Y'),
            ]);

        return Inertia::render('Admin/Roles/Index', [
            'roles'       => $roles,
            'permissions' => Permission::pluck('name', 'id'),
            'filters'     => $request->only(['search']),
        ]);
    }

    /**
     * Store new role & sync permissions.
     */
    public function store(Request $request){

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255', 'unique:roles,name'],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role = Role::create([
            'name'       => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (!empty($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return redirect()->back()->with('success', 'Role created successfully!');
    }

    /**
     * Update existing role & sync permissions.
     */
    public function update(Request $request, Role $role)
    {

        // Super Admin Role protection
        if ($role->name === 'Super Admin') {
            return redirect()->back()->with('error', 'Super Admin role cannot be modified.');
        }

        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255', 'unique:roles,name,' . $role->id],
            'permissions'   => ['nullable', 'array'],
            'permissions.*' => ['exists:permissions,name'],
        ]);

        $role->update(['name' => $validated['name']]);
        $role->syncPermissions($validated['permissions'] ?? []);

        return redirect()->back()->with('success', 'Role updated successfully!');
    }

    /**
     * Delete role.
     */
    public function destroy(Role $role)
    {

        if ($role->name === 'Super Admin') {
            return redirect()->back()->with('error', 'Super Admin role cannot be deleted!');
        }

        $role->delete();

        return redirect()->back()->with('success', 'Role deleted successfully!');
    }
}