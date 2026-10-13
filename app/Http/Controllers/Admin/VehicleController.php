<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use App\Models\Party;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = Vehicle::with('customer:id,name,phone');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('vehicle_no', 'like', "%{$search}%")
                  ->orWhere('driver_name', 'like', "%{$search}%")
                  ->orWhere('driver_phone', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('party_id')) {
            $query->where('party_id', $request->party_id);
        }

        $perPage = $request->per_page ?? 10;
        $vehicles = $query->latest()->paginate($perPage === 'all' ? 100000 : $perPage)->withQueryString();

        $customers = Party::where('type', 'customer')->get(['id', 'name', 'phone']);

        return Inertia::render('Admin/Vehicle/Index', [
            'vehicles'  => $vehicles,
            'customers' => $customers,
            'filters'   => $request->only(['search', 'party_id', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'party_id'             => 'required|exists:parties,id',
            'vehicle_no'           => 'required|string|max:100',
            'vehicle_type'         => 'nullable|string|max:50',
            'driver_name'          => 'nullable|string|max:100',
            'driver_phone'         => 'nullable|string|max:30',
            'monthly_credit_limit' => 'nullable|numeric|min:0',
            'is_active'            => 'boolean',
            'notes'                => 'nullable|string|max:500',
        ]);

        Vehicle::create($validated);

        return redirect()->back()->with('success', 'Vehicle registered successfully.');
    }

    public function update(Request $request, Vehicle $vehicle)
    {
        $validated = $request->validate([
            'party_id'             => 'required|exists:parties,id',
            'vehicle_no'           => 'required|string|max:100',
            'vehicle_type'         => 'nullable|string|max:50',
            'driver_name'          => 'nullable|string|max:100',
            'driver_phone'         => 'nullable|string|max:30',
            'monthly_credit_limit' => 'nullable|numeric|min:0',
            'is_active'            => 'boolean',
            'notes'                => 'nullable|string|max:500',
        ]);

        $vehicle->update($validated);

        return redirect()->back()->with('success', 'Vehicle updated successfully.');
    }

    public function destroy(Vehicle $vehicle)
    {
        $vehicle->delete();

        return redirect()->back()->with('success', 'Vehicle deleted successfully.');
    }

    public function byCustomer($customerId)
    {
        $vehicles = Vehicle::where('party_id', $customerId)
            ->where('is_active', true)
            ->get(['id', 'vehicle_no', 'vehicle_type', 'driver_name', 'driver_phone', 'monthly_credit_limit']);

        return response()->json($vehicles);
    }
}

