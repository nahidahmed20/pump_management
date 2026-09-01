import { useForm, usePage } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import { CheckCircle2, Link } from 'lucide-react';

export default function UpdateProfileInformation({ mustVerifyEmail, status, className = '' }) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">Full Name</label>
                    <input
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                    />
                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.name}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-xs font-bold text-slate-700">Email Address</label>
                    <input
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                    />
                    {errors.email && <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.email}</p>}
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                        <p className="text-sm text-amber-800">
                            Your email address is unverified.
                            <button
                                formAction={route('verification.send')}
                                method="post"
                                as="button"
                                className="ml-2 font-bold text-amber-600 underline hover:text-amber-900"
                            >
                                Click here to re-send the verification email.
                            </button>
                        </p>
                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-xs font-medium text-emerald-600">
                                A new verification link has been sent to your email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition-all hover:bg-amber-400 hover:shadow-md disabled:opacity-50"
                    >
                        Save Changes
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-300"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out duration-300"
                        leaveTo="opacity-0"
                    >
                        <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                            <CheckCircle2 size={16} /> Saved!
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
