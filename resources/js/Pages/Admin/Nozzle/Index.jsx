import { useState, useEffect } from "react";
import { usePage, useForm, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Plus, Search, Edit, Trash2, X, GaugeCircle,
    ChevronLeft, ChevronRight, Database, CheckCircle2, XCircle, Fuel
} from "lucide-react";

import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function NozzleIndex({ nozzles, tanks, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNozzle, setEditingNozzle] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        tank_id: "",
        name: "",
        current_meter: "",
        is_active: true,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/nozzles",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = (nozzle = null) => {
        clearErrors();
        if (nozzle) {
            setEditingNozzle(nozzle);
            setData({
                tank_id: nozzle.tank_id || "",
                name: nozzle.name || "",
                current_meter: nozzle.current_meter || "",
                is_active: nozzle.is_active === 1 || nozzle.is_active === true,
            });
        } else {
            setEditingNozzle(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingNozzle(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingNozzle) {
            put(`/admin/nozzles/${editingNozzle.id}`, {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Updated Successfully!",
                        html: `Nozzle <b class="text-slate-900">${data.name}</b> has been updated.`,
                        confirmButtonText: "Got it!",
                        buttonsStyling: false,
                        backdrop: `rgba(15, 23, 42, 0.6)`, // Matches your slate-900/60 backdrop
                        customClass: {
                            popup: 'rounded-3xl border border-slate-100 shadow-2xl',
                            title: 'text-slate-800 text-xl font-bold mt-2',
                            htmlContainer: 'text-slate-500 text-sm mt-2',
                            confirmButton: 'mt-6 h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95'
                        }
                    });
                },
            });
        } else {
            post("/admin/nozzles", {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Created Successfully!",
                        html: `New dispensing nozzle <b class="text-slate-900">${data.name}</b> has been added.`,
                        confirmButtonText: "Awesome!",
                        buttonsStyling: false,
                        backdrop: `rgba(15, 23, 42, 0.6)`,
                        customClass: {
                            popup: 'rounded-3xl border border-slate-100 shadow-2xl',
                            title: 'text-slate-800 text-xl font-bold mt-2',
                            htmlContainer: 'text-slate-500 text-sm mt-2',
                            confirmButton: 'mt-6 h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95'
                        }
                    });
                },
            });
        }
    };

    const handleDeleteClick = (nozzle) => {
        setItemToDelete(nozzle);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            // Save name before clearing state to use in the alert
            const deletedName = itemToDelete.name;

            router.delete(`/admin/nozzles/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        html: `Nozzle <b class="text-slate-900">${deletedName}</b> has been permanently removed.`,
                        confirmButtonText: "Close",
                        buttonsStyling: false,
                        backdrop: `rgba(15, 23, 42, 0.6)`,
                        customClass: {
                            popup: 'rounded-3xl border border-slate-100 shadow-2xl',
                            title: 'text-slate-800 text-xl font-bold mt-2',
                            htmlContainer: 'text-slate-500 text-sm mt-2',
                            confirmButton: 'mt-6 h-11 px-8 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95'
                        }
                    });
                },
            });
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    return (
        <AdminLayout title="Nozzle Setup" icon={GaugeCircle}>
            <Head title="Pump Nozzles | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Dispensing Nozzles</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage physical dispensing nozzles, link them to tanks, and monitor meters.</p>
                    </div>
                    <div>
                        <button
                            onClick={() => openModal()}
                            className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> Add New Nozzle
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
                            <option value="all">All</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search nozzles..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Nozzle Details</th>
                                    <th className="px-6 py-4">Connected Tank & Fuel</th>
                                    <th className="px-6 py-4">Current Meter Reading</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {nozzles?.data?.length > 0 ? (
                                    nozzles.data.map((nozzle) => (
                                        <tr key={nozzle.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold shadow-sm border border-slate-200">
                                                        <GaugeCircle size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-base">{nozzle.name}</div>
                                                        <div className="text-xs font-medium text-slate-500 mt-0.5">Nozzle ID: #{nozzle.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                                    <Database size={14} className="text-slate-400"/>
                                                    {nozzle.tank?.name || <span className="text-slate-300 italic">Not Assigned</span>}
                                                </div>
                                                <div className="mt-1.5">
                                                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase border border-blue-200 shadow-sm">
                                                        <Fuel size={10} /> {nozzle.tank?.product?.name || "Unknown Fuel"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center font-black text-slate-800 text-base tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-inner">
                                                    {Number(nozzle.current_meter).toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {nozzle.is_active ? (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-sm">
                                                        <CheckCircle2 size={14} /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 shadow-sm">
                                                        <XCircle size={14} /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(nozzle)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(nozzle)}
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
                                        <td colSpan="5" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <GaugeCircle size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">No nozzles found. Add a nozzle to get started.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {nozzles?.links && nozzles.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl">
                            <div>
                                Showing <span className="font-bold text-slate-800">{nozzles.from || 0}</span> to <span className="font-bold text-slate-800">{nozzles.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{nozzles.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {nozzles.links.map((link, idx) => {
                                    let content = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                                    if (link.label.includes("Previous")) content = <ChevronLeft size={16} />;
                                    else if (link.label.includes("Next")) content = <ChevronRight size={16} />;

                                    return (
                                        <Link key={idx} href={link.url || "#"} className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 font-semibold transition-all ${link.active ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20" : "border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-600"} ${!link.url ? "opacity-40 pointer-events-none" : ""}`}>
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <GaugeCircle size={20} />
                                </div>
                                {editingNozzle ? "Edit Nozzle Details" : "Add New Nozzle"}
                            </h3>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 gap-5">

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Nozzle Name / Identifier <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="e.g. Dispenser 1 - Left (Diesel)"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.name}</p>}
                                </div>

                                {/* Connected Tank */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Connect to Tank <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.tank_id}
                                        onChange={(e) => setData("tank_id", e.target.value)}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm"
                                    >
                                        <option value="">-- Select a Tank --</option>
                                        {tanks.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} ({t.product?.name || 'No Fuel'}) - Stock: {t.current_stock}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.tank_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.tank_id}</p>}
                                </div>

                                {/* Current Meter */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Current Meter Reading <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.current_meter}
                                        onChange={(e) => setData("current_meter", e.target.value)}
                                        placeholder="e.g. 15400.50"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.current_meter && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.current_meter}</p>}
                                    <p className="text-xs text-slate-500 mt-1.5 font-medium">This will be the starting point for your first shift reading.</p>
                                </div>

                                {/* Is Active Toggle */}
                                <div className="pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                                            <div className={`block h-7 w-12 rounded-full transition-colors ${data.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <div className={`dot absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${data.is_active ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                            Nozzle is currently Active
                                        </span>
                                    </label>
                                </div>

                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 disabled:opacity-50">
                                    {editingNozzle ? "Save Changes" : "Create Nozzle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    item={itemToDelete}
                    onCancel={cancelDelete}
                    onConfirm={confirmDelete}
                />
            )}
        </AdminLayout>
    );
}
