<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Nozzle;
use App\Models\Tank;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NozzleController extends Controller
{
    public function index(Request $request)
    {
        $query = Nozzle::with(['tank.product']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where('name', 'like', '%' . $search . '%')
                  ->orWhereHas('tank', function ($q) use ($search) {
                      $q->where('name', 'like', '%' . $search . '%');
                  });
        }

        // Pagination
        $perPage = $request->per_page ?? 10;
        $nozzles = $query->latest()->paginate($perPage)->withQueryString();
        
        // Fetch tanks for the dropdown
        $tanks = Tank::with('product')->get(['id', 'name', 'product_id', 'current_stock']);

        return Inertia::render('Admin/Nozzle/Index', [
            'nozzles' => $nozzles,
            'tanks' => $tanks,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tank_id' => 'required|exists:tanks,id',
            'name' => 'required|string|max:255',
            'current_meter' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        Nozzle::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Nozzle $nozzle)
    {
        $validated = $request->validate([
            'tank_id' => 'required|exists:tanks,id',
            'name' => 'required|string|max:255',
            'current_meter' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        $nozzle->update($validated);

        return redirect()->back();
    }

    public function destroy(Nozzle $nozzle)
    {
        $nozzle->delete();
        return redirect()->back();
    }
}