import { useState, useEffect } from "react";
import { usePage, useForm, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    FileSpreadsheet,
    FileText,
    ChevronLeft,
    ChevronRight,
    Users,
    ShieldCheck,
    Mail,
    Printer,
    DownloadCloud
} from "lucide-react";

import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function UserIndex({ users, roles, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // Inertia Form State
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
            email: "",
            password: "",
            roles: [],
        });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/users",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = (user = null) => {
        clearErrors();
        if (user) {
            setEditingUser(user);
            setData({
                name: user.name || "",
                email: user.email || "",
                password: "",
                roles: user.roles ? user.roles.map((r) => typeof r === 'string' ? r : r.name) : [],
            });
        } else {
            setEditingUser(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        reset();
    };

    // Submit Handler
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingUser) {
            put(`/admin/users/${editingUser.id}`, {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Updated!",
                        text: "User has been updated successfully.",
                        confirmButtonColor: "#f59e0b",
                    });
                },
            });
        } else {
            post("/admin/users", {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Created!",
                        text: "New user has been created successfully.",
                        confirmButtonColor: "#f59e0b",
                    });
                },
            });
        }
    };

    // Delete Modal Handlers
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (userToDelete) {
            router.delete(`/admin/users/${userToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: "User has been deleted.",
                        confirmButtonColor: "#f59e0b",
                    });
                },
            });
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
    };

    // Export to Excel (CSV format)
    const exportToExcel = () => {
        const headers = ["ID,Name,Email,Roles,Created At\n"];
        const rows = users.data.map(
            (u) =>
                `${u.id},"${u.name}","${u.email}","${u.roles?.map((r) => typeof r === 'string' ? r : r.name).join("; ")}","${u.created_at}"\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_list_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const exportToPDF = () => {
        window.print();
    };

    return (
        <AdminLayout title="User Management" icon={Users}>
            <Head title="User Management | FuelDesk" />
            <div className="space-y-6">
                {/* Top Header & Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            System Users
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Manage all registered users and assign roles.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={exportToExcel}
                            className="hidden sm:flex h-10 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                            <FileSpreadsheet size={15} /> Excel
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="hidden sm:flex h-10 items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700 transition-colors hover:bg-rose-100"
                        >
                            <FileText size={15} /> PDF
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="flex h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-amber-400"
                        >
                            <Plus size={18} /> Add New User
                        </button>
                    </div>
                </div>

                {/* Filter Bar with Exports */}
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Show Entries */}
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="h-9 w-16 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-8 text-xs outline-none transition-colors hover:bg-slate-100 focus:border-amber-500 focus:bg-white"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>entries</span>
                        </div>
                    </div>

                    {/* Search Box */}
                    <div className="relative w-full xl:w-72">
                        <Search
                            size={16}
                            className="absolute left-3 top-3 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Users Data Table */}
                <div className="overflow-x-auto overflow-y-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <table className="w-full min-w-[600px] text-left text-sm text-slate-700">
                        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-600">
                            <tr>
                                <th className="px-5 py-4">User Info</th>
                                <th className="px-5 py-4">Email</th>
                                <th className="px-5 py-4">Assigned Roles</th>
                                <th className="px-5 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="transition-colors hover:bg-slate-50/80"
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="font-bold text-slate-900">
                                                {user.name}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-slate-600">
                                            {user.email}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role, idx) => {
                                                        const roleName = typeof role === 'string' ? role : role.name;
                                                        return (
                                                            <span
                                                                key={role.id || idx}
                                                                className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10"
                                                            >
                                                                {roleName}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No Role Assigned</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            {/* আপনার পছন্দ অনুযায়ী অরিজিনাল বর্ডারযুক্ত অ্যাকশন বাটন */}
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => openModal(user)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="p-8 text-center text-slate-400"
                                    >
                                        No users found in the system.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Footer */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
                        <div>
                            Showing <span className="font-semibold text-slate-700">{users.from || 0}</span> to <span className="font-semibold text-slate-700">{users.to || 0}</span> of{" "}
                            <span className="font-semibold text-slate-700">{users.total}</span> entries
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            {users.links.map((link, idx) => {
                                let content = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                                if (link.label.includes("Previous")) {
                                    content = <ChevronLeft size={16} />;
                                } else if (link.label.includes("Next")) {
                                    content = <ChevronRight size={16} />;
                                }

                                return (
                                    <Link
                                        key={idx}
                                        href={link.url || "#"}
                                        className={`flex h-8 min-w-[32px] items-center justify-center rounded-md px-2.5 font-medium transition-colors ${
                                            link.active
                                                ? "bg-amber-500 text-slate-900 font-bold shadow-sm"
                                                : "border border-slate-200 bg-white hover:bg-slate-100 text-slate-600"
                                        } ${!link.url ? "opacity-40 pointer-events-none" : ""}`}
                                    >
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingUser ? "Edit User Details" : "Create New User"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                {/* Name */}
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="e.g. John Doe"
                                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData("email", e.target.value)}
                                        placeholder="e.g. john@example.com"
                                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                                    />
                                    {errors.email && (
                                        <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Password{" "}
                                        {editingUser && (
                                            <span className="text-slate-400 font-normal text-xs ml-1">
                                                (Leave empty to keep unchanged)
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData("password", e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-500">{errors.password}</p>
                                    )}
                                </div>

                                {/* Roles */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Assign Roles
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                                        {roles.map((roleName, index) => (
                                            <label key={index} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none group">
                                                <input
                                                    type="checkbox"
                                                    value={roleName}
                                                    checked={data.roles.includes(roleName)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setData("roles", [...data.roles, roleName]);
                                                        } else {
                                                            setData("roles", data.roles.filter((r) => r !== roleName));
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded border-slate-300 text-amber-500 transition-colors focus:ring-amber-500 cursor-pointer"
                                                />
                                                <span className="truncate group-hover:text-slate-900 transition-colors">
                                                    {roleName}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-10 px-5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="h-10 px-6 rounded-lg bg-amber-500 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-amber-400 disabled:opacity-50"
                                >
                                    {editingUser ? "Save Changes" : "Create User"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    item={userToDelete}
                    onCancel={cancelDelete}
                    onConfirm={confirmDelete}
                />
            )}
        </AdminLayout>
    );
}
