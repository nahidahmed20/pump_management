import { Head } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import { User, Lock, AlertTriangle } from 'lucide-react';

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <AdminLayout title="My Profile" icon={User}>
            <Head title="Profile" />

            <div className="mx-auto max-w-4xl space-y-6 pb-10">

                {/* Header Section */}
                <div className="flex flex-col gap-1 mb-2">
                    <h2 className="text-xl font-bold text-slate-800">Profile & Security</h2>
                    <p className="text-xs text-slate-500">Manage your operator details, password, and account access.</p>
                </div>

                {/* Profile Information Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:px-8">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Profile Information</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Update your account's profile information and email address.
                            </p>
                        </div>
                    </div>
                    <div className="p-5 sm:p-8">
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                            className="max-w-xl"
                        />
                    </div>
                </div>

                {/* Password & Security Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-slate-100 bg-slate-50 p-5 sm:px-8">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800">Update Password</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Ensure your account is using a long, random password to stay secure.
                            </p>
                        </div>
                    </div>
                    <div className="p-5 sm:p-8">
                        <UpdatePasswordForm className="max-w-xl" />
                    </div>
                </div>

                {/* Danger Zone Card */}
                <div className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 border-b border-rose-100 bg-rose-50 p-5 sm:px-8">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-rose-200 text-rose-700">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-rose-800">Danger Zone</h3>
                            <p className="text-xs text-rose-600 mt-0.5 font-medium">
                                Permanently delete your account and all associated data. This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="bg-rose-50/30 p-5 sm:p-8">
                        <DeleteUserForm className="max-w-xl" />
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
