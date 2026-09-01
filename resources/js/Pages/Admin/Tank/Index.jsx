import { useState, useEffect } from "react";
import { usePage, useForm, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Plus, Search, Edit, Trash2, X, Database,
    ChevronLeft, ChevronRight, Droplets, Gauge
} from "lucide-react";

import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function TankIndex({ tanks, fuelProducts, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTank, setEditingTank] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: "",
        product_id: "",
        capacity: "",
        current_stock: 0,
    });

    // Auto trigger search when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/tanks",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = (tank = null) => {
        clearErrors();
        if (tank) {
            setEditingTank(tank);
            setData({
                name: tank.name || "",
                product_id: tank.product_id || "",
                capacity: tank.capacity || "",
                current_stock: tank.current_stock || 0,
            });
        } else {
            setEditingTank(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTank(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingTank) {
            put(`/admin/tanks/${editingTank.id}`, {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: "Tank updated successfully!",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                },
            });
        } else {
            post("/admin/tanks", {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: "Tank created successfully!",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                },
            });
        }
    };

    const handleDeleteClick = (tank) => {
        setItemToDelete(tank);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/tanks/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({
                        toast: true,
                        position: "top-end",
                        icon: "success",
                        title: "Tank deleted successfully!",
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true,
                    });
                },
            });
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // Calculate Progress Bar for Tank Stock
    const getStockPercentage = (stock, capacity) => {
        if (!capacity || capacity <= 0) return 0;
        const percentage = (stock / capacity) * 100;
        return percentage > 100 ? 100 : percentage;
    };

    return (
        <AdminLayout title="Tank Management" icon={Database}>
            <Head title="Underground Tanks | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Underground Tanks</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage physical fuel/gas storage capacity and monitor live stock.</p>
                    </div>
                    <div>
                        <button
                            onClick={() => openModal()}
                            className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> Add New Tank
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
                            placeholder="Search tanks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Tank Details</th>
                                    <th className="px-6 py-4">Assigned Product</th>
                                    <th className="px-6 py-4">Max Capacity</th>
                                    <th className="px-6 py-4 w-1/3">Live Stock Level</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {tanks?.data?.length > 0 ? (
                                    tanks.data.map((tank) => {
                                        const percentage = getStockPercentage(tank.current_stock, tank.capacity);
                                        let barColor = "bg-emerald-500 shadow-emerald-500/30";
                                        let textColor = "text-emerald-600";

                                        // Dynamic unit resolution
                                        const unit = tank.product?.unit || "Ltr";

                                        if (percentage < 20) {
                                            barColor = "bg-rose-500 shadow-rose-500/30";
                                            textColor = "text-rose-600";
                                        } else if (percentage < 50) {
                                            barColor = "bg-amber-500 shadow-amber-500/30";
                                            textColor = "text-amber-600";
                                        }

                                        return (
                                            <tr key={tank.id} className="transition-colors hover:bg-slate-50/50 group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 font-bold shadow-sm border border-slate-200">
                                                            <Database size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-base">{tank.name}</div>
                                                            <div className="text-xs font-medium text-slate-500 mt-0.5">Tank ID: #{tank.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200 shadow-sm">
                                                        <Droplets size={12} /> {tank.product?.name || "Unassigned"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-700">
                                                    {Number(tank.capacity).toLocaleString()} <span className="text-xs text-slate-400 font-normal">{unit}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex justify-between items-center text-xs">
                                                            <div className="flex items-center gap-1 font-black text-slate-800">
                                                                <Gauge size={14} className={textColor} />
                                                                {Number(tank.current_stock).toLocaleString()} <span className="font-medium text-slate-400">{unit}</span>
                                                            </div>
                                                            <span className={`font-bold ${textColor}`}>{percentage.toFixed(1)}% Full</span>
                                                        </div>
                                                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner">
                                                            <div
                                                                className={`h-full rounded-full shadow-md transition-all duration-500 ease-out ${barColor}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => openModal(tank)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                            title="Edit"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(tank)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Database size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">No tanks set up yet. Create your first underground tank.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {tanks?.links && tanks.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl">
                            <div>
                                Showing <span className="font-bold text-slate-800">{tanks.from || 0}</span> to <span className="font-bold text-slate-800">{tanks.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{tanks.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {tanks.links.map((link, idx) => {
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
                    <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Database size={20} />
                                </div>
                                {editingTank ? "Edit Tank Details" : "Add New Tank"}
                            </h3>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tank Name <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData("name", e.target.value)}
                                    placeholder="e.g. Tank 1 (Diesel)"
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                />
                                {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Assigned Product (Fuel/Gas) <span className="text-rose-500">*</span></label>
                                <select
                                    value={data.product_id}
                                    onChange={(e) => setData("product_id", e.target.value)}
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm"
                                >
                                    <option value="">-- Select Product --</option>
                                    {fuelProducts.map((fp) => (
                                        <option key={fp.id} value={fp.id}>{fp.name}</option>
                                    ))}
                                </select>
                                {errors.product_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.product_id}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Max Capacity <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        value={data.capacity}
                                        onChange={(e) => setData("capacity", e.target.value)}
                                        placeholder="e.g. 20000"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.capacity && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.capacity}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Initial Stock</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.current_stock}
                                        onChange={(e) => setData("current_stock", e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.current_stock && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.current_stock}</p>}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 disabled:opacity-50">
                                    {editingTank ? "Save Changes" : "Create Tank"}
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
