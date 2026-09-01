import { useState, useEffect } from "react";
import { useForm, router, Link, Head } from "@inertiajs/react";
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
    KeyRound,
    DownloadCloud,
    Printer
} from "lucide-react";

import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function PermissionIndex({ permissions, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState(null);

    // Inertia Form State
    const { data, setData, post, put, processing, errors, reset, clearErrors } =
        useForm({
            name: "",
        });

    // Handle Search & Per Page Filter
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/permissions",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    // Open Modal
    const openModal = (perm = null) => {
        clearErrors();
        if (perm) {
            setEditingPermission(perm);
            setData({ name: perm.name || "" });
        } else {
            setEditingPermission(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPermission(null);
        reset();
    };

    // Submit Handler with SweetAlert
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingPermission) {
            put(`/admin/permissions/${editingPermission.id}`, {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Updated!",
                        text: "Permission has been updated successfully.",
                        confirmButtonColor: "#f59e0b",
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        } else {
            post("/admin/permissions", {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Created!",
                        text: "New permission has been created successfully.",
                        confirmButtonColor: "#f59e0b",
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        }
    };

    // Delete Modal Handlers
    const handleDeleteClick = (perm) => {
        setPermissionToDelete(perm);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (permissionToDelete) {
            router.delete(`/admin/permissions/${permissionToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setPermissionToDelete(null);
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: "Permission has been deleted.",
                        confirmButtonColor: "#f59e0b",
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setPermissionToDelete(null);
    };

    // Export to Excel / CSV
    const exportToCSV = () => {
        const headers = ["ID,Permission Key Name\n"];
        const rows = permissions.data.map((p) => `${p.id},"${p.name}"\n`);
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Permissions_List_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <AdminLayout title="Permission Management" icon={KeyRound}>
            <Head title="Permission Management | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">System Permissions</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage granular permission keys for system control.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToCSV} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95">
                            <DownloadCloud size={18} /> CSV
                        </button>

                        <button onClick={() => window.print()} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print
                        </button>

                        <button
                            onClick={() => openModal()}
                            className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> Add Permission
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <span>Show</span>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(Number(e.target.value))}
                            className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search permission name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Permissions Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Permission Name</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {permissions.data.length > 0 ? (
                                    permissions.data.map((perm) => (
                                        <tr
                                            key={perm.id}
                                            className="transition-colors hover:bg-slate-50/50 group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold shadow-sm border border-slate-200">
                                                        <KeyRound size={16} />
                                                    </div>
                                                    <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800 border border-slate-200 shadow-sm">
                                                        {perm.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(perm)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(perm)}
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
                                            colSpan="2"
                                            className="py-16 text-center text-slate-400"
                                        >
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <KeyRound size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">No permissions found.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {permissions?.links && permissions.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl">
                            <div>
                                Showing{" "}
                                <span className="font-bold text-slate-800">
                                    {permissions.from || 0}
                                </span>{" "}
                                to{" "}
                                <span className="font-bold text-slate-800">
                                    {permissions.to || 0}
                                </span>{" "}
                                of{" "}
                                <span className="font-bold text-slate-800">
                                    {permissions.total}
                                </span>{" "}
                                entries
                            </div>
                            <div className="flex items-center gap-1">
                                {permissions.links.map((link, idx) => {
                                    let content = (
                                        <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                    );
                                    if (link.label.includes("Previous")) {
                                        content = <ChevronLeft size={16} />;
                                    } else if (link.label.includes("Next")) {
                                        content = <ChevronRight size={16} />;
                                    }

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 font-semibold transition-all ${
                                                link.active
                                                    ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20"
                                                    : "border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600"
                                            } ${!link.url ? "opacity-40 pointer-events-none" : ""}`}
                                        >
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Permission Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <KeyRound size={20} />
                                </div>
                                {editingPermission
                                    ? "Edit Permission Details"
                                    : "Create New Permission"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Permission Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="e.g. sales.view or users.create"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                />
                                {errors.name && (
                                    <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.name}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 disabled:opacity-50"
                                >
                                    {editingPermission ? "Save Changes" : "Create Permission"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    item={permissionToDelete}
                    onCancel={cancelDelete}
                    onConfirm={confirmDelete}
                />
            )}
        </AdminLayout>
    );
}
