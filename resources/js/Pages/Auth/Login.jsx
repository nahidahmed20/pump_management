import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import GuestLayout from '@/Layouts/GuestLayout';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [ready, setReady] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setReady(true), 700);
        return () => clearTimeout(t);
    }, []);

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Log in" />

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
                .pl-display { font-family: 'Oswald', sans-serif; }
                .pl-mono { font-family: 'IBM Plex Mono', monospace; }
                @keyframes pl-blink { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
                .pl-blink { animation: pl-blink 2.4s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) {
                    .pl-blink { animation: none; }
                }
            `}</style>

            <div className="mx-auto w-full max-w-sm">
                {/* Hazard stripe */}
                <div
                    className="h-1.5 w-full rounded-t-md"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(135deg, #F5A623 0 10px, #14171B 10px 20px)',
                    }}
                />

                <div className="rounded-b-md border border-t-0 border-[#2E353D] bg-[#1D2228] px-6 py-7 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)]">
                    {/* Status row */}
                    <div className="mb-5 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-[#8B939C] pl-mono">
                        <span className="pl-display text-base font-semibold tracking-wide text-[#E9E6DD]">
                            Petro<span className="text-[#F5A623]">Line</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full bg-[#4ADE80] ${ready ? 'pl-blink' : ''}`} />
                            {ready ? 'Terminal Ready' : 'Booting'}
                        </span>
                    </div>

                    <p className="mb-6 pl-mono text-[11px] uppercase tracking-[0.18em] text-[#5B8DBE]">
                        Station Control &middot; Sign In
                    </p>

                    {status && (
                        <div className="mb-5 rounded border border-[#2E5B3C] bg-[#173323] px-3 py-2 pl-mono text-xs text-[#4ADE80]">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} noValidate>
                        {/* Email */}
                        <div>
                            <label
                                htmlFor="email"
                                className="pl-mono mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[#8B939C]"
                            >
                                Operator Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                autoComplete="username"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="you@station.com"
                                className="pl-mono w-full rounded border border-[#333B44] bg-[#161B20] px-3 py-2.5 text-sm text-[#E9E6DD] placeholder-[#5A626B] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                            />
                            {errors.email && (
                                <p className="pl-mono mt-1.5 text-xs text-[#E5484D]">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="mt-4">
                            <label
                                htmlFor="password"
                                className="pl-mono mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-[#8B939C]"
                            >
                                Access Code
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="pl-mono w-full rounded border border-[#333B44] bg-[#161B20] px-3 py-2.5 text-sm text-[#E9E6DD] placeholder-[#5A626B] shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] focus:border-[#F5A623] focus:outline-none focus:ring-2 focus:ring-[#F5A623]/40"
                            />
                            {errors.password && (
                                <p className="pl-mono mt-1.5 text-xs text-[#E5484D]">{errors.password}</p>
                            )}
                        </div>

                        {/* Remember + forgot password */}
                        <div className="mt-5 flex items-center justify-between">
                            <label className="flex cursor-pointer items-center gap-2">
                                <span
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                        data.remember ? 'bg-[#F5A623]/80' : 'bg-[#333B44]'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="sr-only"
                                    />
                                    <span
                                        className={`ml-0.5 h-4 w-4 rounded-full bg-[#E9E6DD] transition-transform ${
                                            data.remember ? 'translate-x-4' : ''
                                        }`}
                                    />
                                </span>
                                <span className="pl-mono text-xs text-[#8B939C]">Keep terminal signed in</span>
                            </label>

                            {canResetPassword && (
                                <Link
                                    href={route('password.request')}
                                    className="pl-mono rounded text-xs text-[#5B8DBE] underline-offset-2 hover:text-[#F5A623] hover:underline focus:outline-none focus:ring-2 focus:ring-[#F5A623]/50"
                                >
                                    Forgot code?
                                </Link>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="pl-display mt-6 w-full rounded bg-[#F5A623] py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-[#1D2228] shadow-[0_4px_0_0_#B97A0F] transition-all hover:brightness-105 active:translate-y-1 active:shadow-[0_1px_0_0_#B97A0F] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {processing ? 'Signing In…' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center gap-2 pl-mono text-[10px] uppercase tracking-[0.14em] text-[#5A626B]">
                        <span className="h-px flex-1 bg-[#2E353D]" />
                        Node 04 · Bay 2
                        <span className="h-px flex-1 bg-[#2E353D]" />
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}