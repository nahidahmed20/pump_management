<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display permissions listing with search & pagination.
     */
    public function index(Request $request): Response
    {

        $permissions = Permission::query()
            ->when($request->input('search'), function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(15)
            ->withQueryString()
            ->through(fn ($perm) => [
                'id'         => $perm->id,
                'name'       => $perm->name,
                'guard_name' => $perm->guard_name,
                'created_at' => $perm->created_at->format('d M, Y'),
            ]);

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'filters'     => $request->only(['search']),
        ]);
    }

    /**
     * Store new permission.
     */
    public function store(Request $request)
    {

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name'],
        ]);

        Permission::create([
            'name'       => strtolower(trim($validated['name'])),
            'guard_name' => 'web',
        ]);

        return redirect()->back()->with('success', 'Permission created successfully!');
    }

    /**
     * Update existing permission.
     */
    public function update(Request $request, Permission $permission)
    {

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:permissions,name,' . $permission->id],
        ]);

        $permission->update([
            'name' => strtolower(trim($validated['name'])),
        ]);

        return redirect()->back()->with('success', 'Permission updated successfully!');
    }

    /**
     * Delete permission.
     */
    public function destroy(Permission $permission)
    {

        $permission->delete();

        return redirect()->back()->with('success', 'Permission deleted successfully!');
    }
}
