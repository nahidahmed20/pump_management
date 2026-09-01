import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#14171B] px-4 py-10">
            {/* Faint blueprint grid — restrained background texture */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage:
                        'linear-gradient(#5B8DBE 1px, transparent 1px), linear-gradient(90deg, #5B8DBE 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                }}
            />

            <Link
                href="/"
                className="relative z-10 mb-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A623]/60"
            >
                <ApplicationLogo className="h-16 w-16 fill-current text-[#5B8DBE]" />
            </Link>

            <div className="relative z-10 w-full sm:max-w-sm">
                {children}
            </div>
        </div>
    );
}