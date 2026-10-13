import { useState, useEffect, useMemo, useRef } from "react";
import { router, Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Truck, Search, Plus, Trash2, Edit2, X, Calendar, Printer,
    ChevronLeft, ChevronRight, Droplets, Gauge, Clock, User,
    FileText, CheckCircle2, AlertTriangle, ArrowDownRight, ArrowUpRight,
    Building2, Phone, ShieldCheck
} from "lucide-react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function TankDecantationIndex({
    decantations,
    stats,
    tanks,
    products,
    suppliers,
    filters,
}) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [tankFilter, setTankFilter] = useState(filters?.tank_id || "");
    const [productFilter, setProductFilter] = useState(filters?.product_id || "");
    const [dateFilter, setDateFilter] = useState(filters?.date || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 15);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [printItem, setPrintItem] = useState(null);

    const printRef = useRef(null);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        id: null,
        date: new Date().toISOString().split("T")[0],
        challan_no: "",
        supplier_id: "",
        tank_id: "",
        product_id: "",
        tank_lorry_no: "",
        driver_name: "",
        driver_phone: "",
        invoice_qty: "",
        dip_before_mm: "",
        stock_before_litres: "",
        dip_after_mm: "",
        stock_after_litres: "",
        received_qty: "",
        density: "",
        temperature: "",
        start_time: "",
        end_time: "",
        unloaded_by: "",
        notes: "",
        sync_tank_stock: true,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/tank-decantations",
                {
                    search: searchTerm,
                    tank_id: tankFilter,
                    product_id: productFilter,
                    date: dateFilter,
                    per_page: perPage,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, tankFilter, productFilter, dateFilter, perPage]);

    // When tank is changed, auto-select product and suggest current stock
    const handleTankChange = (tankId) => {
        const selected = tanks.find((t) => t.id == tankId);
        if (selected) {
            setData((prev) => ({
                ...prev,
                tank_id: tankId,
                product_id: selected.product_id || "",
                stock_before_litres: prev.stock_before_litres || selected.current_stock || "",
            }));
        } else {
            setData((prev) => ({ ...prev, tank_id: tankId }));
        }
    };

    // Calculate received qty & variance dynamically
    const calculatedReceived = useMemo(() => {
        const before = parseFloat(data.stock_before_litres) || 0;
        const after = parseFloat(data.stock_after_litres) || 0;
        if (after > 0 && after >= before) {
            return (after - before).toFixed(2);
        }
        return data.received_qty || "0";
    }, [data.stock_before_litres, data.stock_after_litres, data.received_qty]);

    const liveVariance = useMemo(() => {
        const inv = parseFloat(data.invoice_qty) || 0;
        const rec = parseFloat(calculatedReceived) || 0;
        if (inv > 0 && rec > 0) {
            return (rec - inv).toFixed(2);
        }
        return "0.00";
    }, [data.invoice_qty, calculatedReceived]);

    const openAddModal = () => {
        setIsEditMode(false);
        clearErrors();
        reset();
        setData((prev) => ({
            ...prev,
            date: new Date().toISOString().split("T")[0],
            sync_tank_stock: true,
        }));
        setIsModalOpen(true);
    };

    const openEditModal = (row) => {
        setIsEditMode(true);
        clearErrors();
        setData({
            id: row.id,
            date: row.date ? row.date.substring(0, 10) : "",
            challan_no: row.challan_no || "",
            supplier_id: row.supplier_id || "",
            tank_id: row.tank_id || "",
            product_id: row.product_id || "",
            tank_lorry_no: row.tank_lorry_no || "",
            driver_name: row.driver_name || "",
            driver_phone: row.driver_phone || "",
            invoice_qty: row.invoice_qty || "",
            dip_before_mm: row.dip_before_mm || "",
            stock_before_litres: row.stock_before_litres || "",
            dip_after_mm: row.dip_after_mm || "",
            stock_after_litres: row.stock_after_litres || "",
            received_qty: row.received_qty || "",
            density: row.density || "",
            temperature: row.temperature || "",
            start_time: row.start_time || "",
            end_time: row.end_time || "",
            unloaded_by: row.unloaded_by || "",
            notes: row.notes || "",
            sync_tank_stock: false,
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Ensure received_qty is set to calculated received if empty
        const submissionData = {
            ...data,
            received_qty: data.received_qty || calculatedReceived,
        };

        if (isEditMode) {
            put(`/admin/tank-decantations/${data.id}`, {
                data: submissionData,
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    Swal.fire({
                        icon: "success",
                        title: "Updated",
                        text: "Decantation log updated successfully.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: "rounded-2xl" },
                    });
                },
            });
        } else {
            post("/admin/tank-decantations", {
                data: submissionData,
                preserveScroll: true,
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    Swal.fire({
                        icon: "success",
                        title: "Recorded",
                        text: "Fuel decantation entry logged successfully.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: "rounded-2xl" },
                    });
                },
            });
        }
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        router.delete(`/admin/tank-decantations/${itemToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
                Swal.fire({
                    icon: "success",
                    title: "Deleted",
                    text: "Decantation entry removed successfully.",
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: "rounded-2xl" },
                });
            },
        });
    };

    const handlePrint = (item) => {
        setPrintItem(item);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    return (
        <AdminLayout title="Tank Lorry Decantation Log" icon={Truck}>
            <Head title="Tank Decantation Log | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Top Header & New Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Tank Lorry Fuel Decantation (লরি আনলোডিং লগ)</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Audit underground storage tank replenishment, quality parameters, and transit shortage/gain.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openAddModal}
                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={18} /> New Decantation Entry
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                            <Truck size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Lorries</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.total_discharges || 0}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                            <FileText size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Challan Litres</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-0.5">
                                {Number(stats.total_invoice_litres || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })} L
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                            <Droplets size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Received Litres</p>
                            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
                                {Number(stats.total_received_litres || 0).toLocaleString(undefined, { minimumFractionDigits: 1 })} L
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${
                            stats.total_variance < 0 ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                            {stats.total_variance < 0 ? <ArrowDownRight size={22} /> : <ArrowUpRight size={22} />}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Variance</p>
                            <h3 className={`text-2xl font-black mt-0.5 ${
                                stats.total_variance < 0 ? "text-rose-600" : "text-emerald-600"
                            }`}>
                                {Number(stats.total_variance || 0) > 0 ? "+" : ""}
                                {Number(stats.total_variance || 0).toFixed(1)} L
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm print:hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search challan, lorry no, driver or staff..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                            />
                        </div>

                        <div>
                            <select
                                value={tankFilter}
                                onChange={(e) => setTankFilter(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-amber-500 focus:bg-white"
                            >
                                <option value="">All Storage Tanks</option>
                                {tanks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name} ({t.product?.name})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <select
                                value={productFilter}
                                onChange={(e) => setProductFilter(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-amber-500 focus:bg-white"
                            >
                                <option value="">All Products</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-amber-500 focus:bg-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-4">Date & Challan</th>
                                    <th className="px-5 py-4">Tank & Product</th>
                                    <th className="px-5 py-4">Lorry & Driver</th>
                                    <th className="px-5 py-4">Dip Before / After</th>
                                    <th className="px-5 py-4 text-right">Challan Qty</th>
                                    <th className="px-5 py-4 text-right">Received Qty</th>
                                    <th className="px-5 py-4 text-center">Variance (ঘাটতি)</th>
                                    <th className="px-5 py-4 text-center print:hidden">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {decantations.data && decantations.data.length > 0 ? (
                                    decantations.data.map((row) => {
                                        const variance = Number(row.variance_qty || 0);
                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span className="font-bold text-slate-800 block">
                                                        {row.date ? new Date(row.date).toLocaleDateString("en-GB") : "-"}
                                                    </span>
                                                    <span className="text-xs font-mono font-medium text-amber-600 block mt-0.5">
                                                        {row.challan_no ? `Challan: #${row.challan_no}` : "No Challan"}
                                                    </span>
                                                    {row.supplier && (
                                                        <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">
                                                            {row.supplier.name}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                                            <Droplets size={16} className="text-amber-500" />
                                                        </div>
                                                        <div>
                                                            <span className="font-bold text-slate-800 block">
                                                                {row.tank?.name || "-"}
                                                            </span>
                                                            <span className="text-xs font-semibold text-slate-500 block">
                                                                {row.product?.name || "-"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="font-bold font-mono text-xs text-slate-800 block">
                                                        {row.tank_lorry_no || "Lorry: N/A"}
                                                    </span>
                                                    <span className="text-xs text-slate-500 block">
                                                        {row.driver_name || "Driver: N/A"} {row.driver_phone ? `(${row.driver_phone})` : ""}
                                                    </span>
                                                    {row.unloaded_by && (
                                                        <span className="text-[11px] text-slate-400 block">
                                                            By: {row.unloaded_by}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap text-xs">
                                                    <div className="space-y-0.5">
                                                        <div>
                                                            <span className="text-slate-400">Before: </span>
                                                            <span className="font-semibold text-slate-700">
                                                                {row.dip_before_mm ? `${row.dip_before_mm}mm` : ""}{" "}
                                                                ({Number(row.stock_before_litres || 0).toLocaleString()}L)
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-slate-400">After: </span>
                                                            <span className="font-semibold text-slate-700">
                                                                {row.dip_after_mm ? `${row.dip_after_mm}mm` : ""}{" "}
                                                                ({Number(row.stock_after_litres || 0).toLocaleString()}L)
                                                            </span>
                                                        </div>
                                                        {(row.density || row.temperature) && (
                                                            <div className="text-[11px] text-slate-400">
                                                                {row.density ? `D: ${row.density}` : ""}{" "}
                                                                {row.temperature ? `T: ${row.temperature}°C` : ""}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4 text-right whitespace-nowrap font-mono font-bold text-slate-700">
                                                    {Number(row.invoice_qty || 0).toLocaleString()} L
                                                </td>

                                                <td className="px-5 py-4 text-right whitespace-nowrap font-mono font-black text-slate-900 text-sm">
                                                    {Number(row.received_qty || 0).toLocaleString()} L
                                                </td>

                                                <td className="px-5 py-4 text-center whitespace-nowrap">
                                                    {variance < 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                            <ArrowDownRight size={13} /> {variance.toFixed(1)} L Shortage
                                                        </span>
                                                    ) : variance > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            <ArrowUpRight size={13} /> +{variance.toFixed(1)} L Gain
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                            Exact Match
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-center whitespace-nowrap print:hidden">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            onClick={() => handlePrint(row)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                                                            title="Print Voucher"
                                                        >
                                                            <Printer size={15} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEditModal(row)}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                                                            title="Edit Record"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setItemToDelete(row);
                                                                setIsDeleteModalOpen(true);
                                                            }}
                                                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="py-12 text-center text-slate-400">
                                            <Truck size={44} className="mb-2 mx-auto opacity-20" />
                                            <p className="font-semibold text-slate-600">No decantation records found</p>
                                            <p className="text-xs text-slate-400 mt-1">Record fuel truck discharges when petrol/diesel is delivered.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {decantations.links && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{decantations.from || 0}</span> to{" "}
                                <span className="font-bold text-slate-800">{decantations.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{decantations.total}</span> entries
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {decantations.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || "#"}
                                        className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 font-semibold transition-all ${
                                            link.active
                                                ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20"
                                                : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                                        } ${!link.url ? "opacity-40 pointer-events-none" : ""}`}
                                    >
                                        <span dangerouslySetInnerHTML={{ __html: link.label.includes("Previous") ? "<" : link.label.includes("Next") ? ">" : link.label }} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Decantation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-4 shrink-0">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Truck size={18} />
                                </div>
                                {isEditMode ? "Edit Fuel Decantation Entry" : "Record Tank Lorry Decantation (তেল আনলোডিং)"}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    reset();
                                }}
                                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
                            {/* Section 1: Basic Delivery Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData("date", e.target.value)}
                                        required
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white transition-all"
                                    />
                                    {errors.date && <p className="text-xs text-rose-500 mt-1">{errors.date}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Challan / Invoice No
                                    </label>
                                    <input
                                        type="text"
                                        value={data.challan_no}
                                        onChange={(e) => setData("challan_no", e.target.value)}
                                        placeholder="e.g. CH-98762"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Supplier / Depot
                                    </label>
                                    <select
                                        value={data.supplier_id}
                                        onChange={(e) => setData("supplier_id", e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold outline-none focus:border-amber-500 focus:bg-white transition-all"
                                    >
                                        <option value="">-- Choose Supplier --</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Section 2: Storage Tank & Product */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-amber-50/50 border border-amber-100">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Target Tank <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.tank_id}
                                        onChange={(e) => handleTankChange(e.target.value)}
                                        required
                                        className="h-11 w-full rounded-xl border border-amber-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    >
                                        <option value="">-- Choose Tank --</option>
                                        {tanks.map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name} (Stock: {t.current_stock}L)
                                            </option>
                                        ))}
                                    </select>
                                    {errors.tank_id && <p className="text-xs text-rose-500 mt-1">{errors.tank_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Product Type <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={data.product_id}
                                        onChange={(e) => setData("product_id", e.target.value)}
                                        required
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    >
                                        <option value="">-- Choose Product --</option>
                                        {products.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.product_id && <p className="text-xs text-rose-500 mt-1">{errors.product_id}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Challan Quantity (Ltr) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.invoice_qty}
                                        onChange={(e) => setData("invoice_qty", e.target.value)}
                                        required
                                        placeholder="e.g. 9000"
                                        className="h-11 w-full rounded-xl border border-amber-300 bg-white px-3 text-sm font-black text-slate-900 outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
                                    />
                                    {errors.invoice_qty && <p className="text-xs text-rose-500 mt-1">{errors.invoice_qty}</p>}
                                </div>
                            </div>

                            {/* Section 3: Tank Lorry & Driver Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Tank Lorry No
                                    </label>
                                    <input
                                        type="text"
                                        value={data.tank_lorry_no}
                                        onChange={(e) => setData("tank_lorry_no", e.target.value)}
                                        placeholder="ঢাকা মেট্রো-শ ১১-২২৩৩"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Driver Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.driver_name}
                                        onChange={(e) => setData("driver_name", e.target.value)}
                                        placeholder="ড্রাইভারের নাম"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                        Driver Phone
                                    </label>
                                    <input
                                        type="text"
                                        value={data.driver_phone}
                                        onChange={(e) => setData("driver_phone", e.target.value)}
                                        placeholder="017XXXXXXXX"
                                        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white transition-all"
                                    />
                                </div>
                            </div>

                            {/* Section 4: Tank Dip & Physical Measurement */}
                            <div className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-slate-50/50">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                    <Gauge size={15} className="text-amber-500" />
                                    Underground Tank Dip Measurements (ডিপ পরিমাপ)
                                </h4>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Dip Before (mm)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.dip_before_mm}
                                            onChange={(e) => setData("dip_before_mm", e.target.value)}
                                            placeholder="e.g. 850"
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Stock Before (Ltr)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.stock_before_litres}
                                            onChange={(e) => setData("stock_before_litres", e.target.value)}
                                            placeholder="Before litres"
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none focus:border-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Dip After (mm)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.dip_after_mm}
                                            onChange={(e) => setData("dip_after_mm", e.target.value)}
                                            placeholder="e.g. 1750"
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                            Stock After (Ltr)
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={data.stock_after_litres}
                                            onChange={(e) => setData("stock_after_litres", e.target.value)}
                                            placeholder="After litres"
                                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>

                                {/* Dynamic Variance Live Feedback Banner */}
                                <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <span className="text-xs text-slate-500 block">Calculated Received Fuel:</span>
                                        <span className="text-lg font-black text-slate-800">
                                            {Number(calculatedReceived).toLocaleString()} Litres
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs text-slate-500 block">Variance (ঘাটতি / উদ্বৃত্ত):</span>
                                        <span
                                            className={`text-lg font-black inline-flex items-center gap-1 ${
                                                Number(liveVariance) < 0
                                                    ? "text-rose-600"
                                                    : Number(liveVariance) > 0
                                                    ? "text-emerald-600"
                                                    : "text-slate-700"
                                            }`}
                                        >
                                            {Number(liveVariance) > 0 ? "+" : ""}
                                            {liveVariance} Litres{" "}
                                            {Number(liveVariance) < 0
                                                ? "(Shortage)"
                                                : Number(liveVariance) > 0
                                                ? "(Gain)"
                                                : "(Match)"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Section 5: Quality & Timing */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Density (ঘনত্ব)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={data.density}
                                        onChange={(e) => setData("density", e.target.value)}
                                        placeholder="e.g. 0.8250"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Temp (°C)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={data.temperature}
                                        onChange={(e) => setData("temperature", e.target.value)}
                                        placeholder="e.g. 29.5"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Start / End Time
                                    </label>
                                    <div className="flex gap-1.5">
                                        <input
                                            type="time"
                                            value={data.start_time}
                                            onChange={(e) => setData("start_time", e.target.value)}
                                            className="h-10 w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-medium outline-none focus:border-amber-500 focus:bg-white"
                                        />
                                        <input
                                            type="time"
                                            value={data.end_time}
                                            onChange={(e) => setData("end_time", e.target.value)}
                                            className="h-10 w-1/2 rounded-xl border border-slate-200 bg-slate-50 px-2 text-xs font-medium outline-none focus:border-amber-500 focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                        Unloaded By
                                    </label>
                                    <input
                                        type="text"
                                        value={data.unloaded_by}
                                        onChange={(e) => setData("unloaded_by", e.target.value)}
                                        placeholder="স্টাফের নাম"
                                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            {/* Section 6: Notes & Auto-sync stock toggle */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                                    Remarks / Notes (মন্তব্য)
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    rows="2"
                                    placeholder="ঘাটতির কারণ বা লরি সংক্রান্ত কোনো মন্তব্য..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-amber-500 focus:bg-white"
                                ></textarea>
                            </div>

                            {!isEditMode && (
                                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="sync_tank_stock"
                                        checked={data.sync_tank_stock}
                                        onChange={(e) => setData("sync_tank_stock", e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                    />
                                    <label htmlFor="sync_tank_stock" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                                        ট্যাংক বর্তমান স্টক (Current Stock) স্বয়ংক্রিয়ভাবে ডিসচার্জ পরবর্তী স্টক দিয়ে আপডেট করুন
                                    </label>
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        reset();
                                    }}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-900 text-sm font-bold shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                                >
                                    {processing ? "Saving..." : isEditMode ? "Update Entry" : "Save Decantation Entry"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Printable Voucher Section (Active during print) */}
            {printItem && (
                <div className="hidden print:block fixed inset-0 bg-white p-8 font-sans text-slate-900 z-[9999]">
                    <div className="text-center border-b pb-4 mb-6">
                        <h1 className="text-2xl font-black uppercase tracking-wider">FUEL TANK DECANTATION CERTIFICATE</h1>
                        <p className="text-sm font-semibold text-slate-600 mt-1">ট্যাংক লরি ফুয়েল ডিসচার্জ ও আনলোডিং ভাউচার</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-6 border p-4 rounded-xl">
                        <div>
                            <p><strong>Date:</strong> {printItem.date ? new Date(printItem.date).toLocaleDateString("en-GB") : "-"}</p>
                            <p><strong>Challan No:</strong> {printItem.challan_no || "N/A"}</p>
                            <p><strong>Supplier:</strong> {printItem.supplier?.name || "N/A"}</p>
                            <p><strong>Storage Tank:</strong> {printItem.tank?.name}</p>
                            <p><strong>Fuel Product:</strong> {printItem.product?.name}</p>
                        </div>
                        <div>
                            <p><strong>Tank Lorry No:</strong> {printItem.tank_lorry_no || "N/A"}</p>
                            <p><strong>Driver Name:</strong> {printItem.driver_name || "N/A"} {printItem.driver_phone ? `(${printItem.driver_phone})` : ""}</p>
                            <p><strong>Start / End Time:</strong> {printItem.start_time || "-"} to {printItem.end_time || "-"}</p>
                            <p><strong>Unloaded By:</strong> {printItem.unloaded_by || "Staff"}</p>
                        </div>
                    </div>

                    <table className="w-full text-left border text-sm mb-6">
                        <thead>
                            <tr className="bg-slate-100 border-b">
                                <th className="p-2 border-r">Measurement Parameter</th>
                                <th className="p-2 border-r">Dip Level</th>
                                <th className="p-2 text-right">Volume (Litres)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b">
                                <td className="p-2 border-r">Dip Before Decantation</td>
                                <td className="p-2 border-r font-mono">{printItem.dip_before_mm} mm</td>
                                <td className="p-2 text-right font-mono">{Number(printItem.stock_before_litres || 0).toLocaleString()} L</td>
                            </tr>
                            <tr className="border-b">
                                <td className="p-2 border-r">Dip After Decantation</td>
                                <td className="p-2 border-r font-mono">{printItem.dip_after_mm} mm</td>
                                <td className="p-2 text-right font-mono">{Number(printItem.stock_after_litres || 0).toLocaleString()} L</td>
                            </tr>
                            <tr className="border-b font-bold bg-slate-50">
                                <td className="p-2 border-r" colSpan="2">Actual Received Litres (ট্যাংকে প্রাপ্ত)</td>
                                <td className="p-2 text-right font-mono">{Number(printItem.received_qty || 0).toLocaleString()} L</td>
                            </tr>
                            <tr className="border-b font-bold">
                                <td className="p-2 border-r" colSpan="2">Challan / Invoice Litres (চালান অনুযায়ী)</td>
                                <td className="p-2 text-right font-mono">{Number(printItem.invoice_qty || 0).toLocaleString()} L</td>
                            </tr>
                            <tr className="border-b font-bold bg-slate-100">
                                <td className="p-2 border-r" colSpan="2">Shortage / Gain Variance (ঘাটতি / উদ্বৃত্ত)</td>
                                <td className="p-2 text-right font-mono font-black">
                                    {Number(printItem.variance_qty || 0) > 0 ? "+" : ""}
                                    {Number(printItem.variance_qty || 0).toFixed(2)} L
                                </td>
                            </tr>
                            <tr>
                                <td className="p-2 border-r">Quality Check (ঘনত্ব ও তাপমাত্রা)</td>
                                <td className="p-2" colSpan="2">
                                    Density: {printItem.density || "N/A"} g/cm³ | Temperature: {printItem.temperature || "N/A"} °C
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {printItem.notes && (
                        <p className="text-xs italic mb-12"><strong>Notes:</strong> {printItem.notes}</p>
                    )}

                    <div className="grid grid-cols-3 gap-6 pt-16 text-center text-xs">
                        <div>
                            <div className="border-t border-slate-400 pt-2 font-bold">Tank Lorry Driver Signature</div>
                        </div>
                        <div>
                            <div className="border-t border-slate-400 pt-2 font-bold">Unloader / Operator Signature</div>
                        </div>
                        <div>
                            <div className="border-t border-slate-400 pt-2 font-bold">Station Manager Signature</div>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <ConfirmDeleteModal
                    item={itemToDelete}
                    onCancel={() => setIsDeleteModalOpen(false)}
                    onConfirm={confirmDelete}
                />
            )}
        </AdminLayout>
    );
}

