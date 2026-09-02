<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user()?->load('activeBranch:id,name,code'),
                'roles' => $request->user() ? $request->user()->getRoleNames() : [],
                'permissions' => $request->user() ? $request->user()->getAllPermissions()->pluck('name') : [],
                'branches' => $request->user() ? $request->user()->branches()->where('is_active', true)->get(['branches.id', 'name', 'code']) : [],
            ],
        ];
    }

}
