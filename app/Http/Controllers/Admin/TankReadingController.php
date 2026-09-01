<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TankReading;
use App\Models\Tank;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TankReadingController extends Controller
{
    public function index(Request $request)
    {
        $query = TankReading::with('tank:id,name');

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('note', 'like', "%{$search}%")
                  ->orWhereHas('tank', function($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('date') && $request->date != '') {
            $query->whereDate('date', $request->date);
        }

        $perPage = $request->per_page ?? 10;
        $readings = $query->latest('date')->latest('id')->paginate($perPage === 'all' ? 100000 : $perPage)->withQueryString();

        $tanks = Tank::select('id', 'name', 'current_stock')->get();

        return Inertia::render('Admin/TankReadings/Index', [
            'readings' => $readings,
            'tanks'    => $tanks,
            'filters'  => $request->only(['search', 'date', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'tank_id'        => 'required|exists:tanks,id',
            'physical_stock' => 'required|numeric|min:0',
            'note'           => 'nullable|string|max:255',
        ]);

        $tank = Tank::findOrFail($validated['tank_id']);
        $validated['software_stock'] = $tank->current_stock;

        TankReading::create($validated);

        return redirect()->back()->with('success', 'Tank dip reading recorded successfully.');
    }

    public function update(Request $request, TankReading $tankReading)
    {
        $validated = $request->validate([
            'date'           => 'required|date',
            'tank_id'        => 'required|exists:tanks,id',
            'physical_stock' => 'required|numeric|min:0',
            'note'           => 'nullable|string|max:255',
        ]);

        $tankReading->update([
            'date'           => $validated['date'],
            'tank_id'        => $validated['tank_id'],
            'physical_stock' => $validated['physical_stock'],
            'note'           => $validated['note'],
        ]);

        return redirect()->back()->with('success', 'Tank reading updated successfully.');
    }

    public function destroy(TankReading $tankReading)
    {
        $tankReading->delete();
        return redirect()->back()->with('success', 'Tank reading deleted successfully.');
    }
}
