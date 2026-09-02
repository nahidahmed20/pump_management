<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        // Search logic
        if ($request->has('search') && $request->search != '') {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('type', 'like', '%' . $request->search . '%');
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $categories = $query->latest()->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Category/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories')->where('branch_id', auth()->user()->active_branch_id)],
            'type' => 'required|string|in:fuel,lube,gas,general', // Added 'gas' here
            'is_active' => 'boolean',
        ]);

        Category::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('categories')->where('branch_id', auth()->user()->active_branch_id)->ignore($category->id)],
            'type' => 'required|string|in:fuel,lube,gas,general', // Added 'gas' here
            'is_active' => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->back();
    }

    public function destroy(Category $category)
    {
        $category->delete();
        return redirect()->back();
    }
}
