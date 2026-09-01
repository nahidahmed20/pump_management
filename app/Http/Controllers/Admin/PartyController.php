<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Party;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PartyController extends Controller
{
    public function index(Request $request)
    {
        $query = Party::query();

        // Search Filter
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }

        if ($request->has('type') && in_array($request->type, ['customer', 'supplier', 'borrower', 'staff'])) {
            $query->where('type', $request->type);
        }

        $perPage = $request->per_page ?? 10;

        if ($perPage === 'all') {
            $parties = $query->latest()->paginate(100000)->withQueryString();
        } else {
            $parties = $query->latest()->paginate($perPage)->withQueryString();
        }

        $accounts = Account::all();

        return Inertia::render('Admin/Party/Index', [
            'parties' => $parties,
            'accounts' => $accounts,
            'filters' => $request->only(['search', 'type', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'      => 'required|string|max:255',
            'type'      => 'required|in:customer,supplier,borrower,staff',
            'phone'     => 'nullable|string|max:20',
            'email'     => 'nullable|email|max:255',
            'address'   => 'nullable|string',
            'account_id' => 'nullable|integer',
        ]);

        Party::create([
            'name' => $request->name,
            'type' => $request->type,
            'phone' => $request->phone,
            'email' => $request->email,
            'address' => $request->address,
            'balance' => 0,
            'account_id' => $request->account_id,
        ]);

        return redirect()->back()->with('success', 'Party added successfully.');
    }

    public function update(Request $request, Party $party)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:customer,supplier,borrower,staff',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'account_id' => 'nullable|integer',
        ]);

        $party->update($request->only('name', 'type', 'phone', 'email', 'address', 'account_id'));

        return redirect()->back()->with('success', 'Party updated successfully.');
    }
    public function destroy(Party $party)
    {
        if ($party->invoices()->exists() || $party->purchases()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete! This party has related transactions.']);
        }

        $party->delete();
        return redirect()->back()->with('success', 'Party deleted successfully.');
    }
}
