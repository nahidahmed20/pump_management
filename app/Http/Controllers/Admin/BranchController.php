<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Admin/Branches/Index', [
            'branches' => Branch::withCount('users')->latest()->paginate(15),
        ]);
    }

    public function store(Request $request)
    {
        Branch::create($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'alpha_dash', 'max:30', 'unique:branches,code'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]));
        return back()->with('success', 'Branch created successfully.');
    }

    public function update(Request $request, Branch $branch)
    {
        $branch->update($request->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'alpha_dash', 'max:30', Rule::unique('branches')->ignore($branch)],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
        ]));
        return back()->with('success', 'Branch updated successfully.');
    }

    public function destroy(Branch $branch)
    {
        abort_if($branch->id === auth()->user()->active_branch_id, 422, 'The active branch cannot be deleted.');
        abort_if($branch->users()->exists(), 422, 'Remove assigned users before deleting this branch.');
        $branch->delete();
        return back()->with('success', 'Branch deleted successfully.');
    }

    public function switch(Request $request)
    {
        $data = $request->validate(['branch_id' => ['required', 'integer']]);
        abort_unless($request->user()->branches()->whereKey($data['branch_id'])->where('is_active', true)->exists(), 403);
        $request->user()->forceFill(['active_branch_id' => $data['branch_id']])->save();
        return back()->with('success', 'Active branch changed.');
    }
}
