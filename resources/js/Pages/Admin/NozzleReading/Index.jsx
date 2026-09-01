import { useState, useEffect } from "react";
import { usePage, useForm, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Plus, Search, Trash2, X, Gauge,
    ChevronLeft, ChevronRight, AlertTriangle, Activity,
    FileSpreadsheet, FileText, Printer, DownloadCloud
} from "lucide-react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function NozzleReadingIndex({ readings, openShifts, nozzles, filters, errors: serverErrors }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Delete Modal States (অন্যান্য মডিউলের মতো কনফার্মেশন মোডাল)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Live calculation states
    const [selectedNozzle, setSelectedNozzle] = useState(null);
    const [liveCalculation, setLiveCalculation] = useState({ soldQty: 0, totalAmount: 0 });

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        shift_id: "",
        nozzle_id: "",
        end_meter: "",
        testing_qty: 0,
    });

    // Handle Server Errors
    useEffect(() => {
        if (serverErrors?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: serverErrors.error,
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
        }
    }, [serverErrors]);

    // Live Calculation Logic
    useEffect(() => {
        if (selectedNozzle && data.end_meter) {
            const start = Number(selectedNozzle.current_meter);
            const end = Number(data.end_meter);
            const testing = Number(data.testing_qty) || 0;
            const price = Number(selectedNozzle.tank?.product?.selling_price || 0);

            const soldQty = end - start - testing;
            setLiveCalculation({
                soldQty: soldQty > 0 ? soldQty : 0,
                totalAmount: soldQty > 0 ? (soldQty * price) : 0
            });
        } else {
            setLiveCalculation({ soldQty: 0, totalAmount: 0 });
        }
    }, [data.end_meter, data.testing_qty, selectedNozzle]);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/nozzle-readings",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = () => {
        clearErrors();
        if (!openShifts || openShifts.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Active Shift',
                text: 'Please start a shift from Shift Management first.',
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
            return;
        }
        reset();
        setSelectedNozzle(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleNozzleChange = (e) => {
        const id = e.target.value;
        setData("nozzle_id", id);
        const nozzle = nozzles.find(n => n.id.toString() === id);
        setSelectedNozzle(nozzle || null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/admin/nozzle-readings", {
            onSuccess: (page) => {
                if (!page.props.errors?.error) {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Reading Saved!",
                        text: "Meter reading added and stocks updated.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                }
            },
        });
    };

    // Delete Handlers using ConfirmDeleteModal
    const handleDeleteClick = (reading) => {
        setItemToDelete(reading);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/nozzle-readings/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({
                        icon: 'success',
                        title: 'Deleted!',
                        text: 'Reading has been deleted and stocks reversed safely.',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                }
            });
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const exportToCSV = () => {
        const headers = ["ID,Shift ID,Nozzle,Start Meter,End Meter,Testing,Sold Qty,Amount,Date\n"];
        const rows = readings.data.map(
            (r) => `${r.id},${r.shift_id},"${r.nozzle?.name || 'N/A'}",${r.start_meter},${r.end_meter},${r.testing_qty},${r.sold_qty || 0},${r.total_amount || 0},"${r.created_at}"\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Nozzle_Readings_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <AdminLayout title="Nozzle Readings" icon={Gauge}>
            <Head title="Meter Readings | FuelDesk" />
            <div className="space-y-6 animate-in fade-in duration-300 w-full max-w-full overflow-x-hidden">

                {/* Active Shifts Alert */}
                {openShifts && openShifts.length > 0 ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 sm:px-5 py-4 rounded-2xl shadow-sm">
                        <Activity className="animate-pulse text-emerald-600 shrink-0" size={22} />
                        <div>
                            <span className="font-bold">Active Shifts Running ({openShifts.length}): </span>
                            <span className="text-xs sm:text-sm font-medium">
                                {openShifts.map(s => `#SHF-${s.id} (${s.user?.name})`).join(', ')}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 sm:px-5 py-4 rounded-2xl shadow-sm">
                        <AlertTriangle className="text-rose-600 shrink-0" size={22} />
                        <div>
                            <span className="font-bold">No Active Shifts! </span>
                            <span className="text-xs sm:text-sm font-medium">You cannot take meter readings until you start a shift.</span>
                        </div>
                    </div>
                )}

                {/* Top Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800">Meter Readings History</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Track nozzle start/end readings, testing quantities, and fuel sales.</p>
                    </div>
                    <div>
                        <button
                            onClick={openModal}
                            disabled={!openShifts || openShifts.length === 0}
                            className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" />
                            <span>New Reading</span>
                        </button>
                    </div>
                </div>

                {/* Filter Bar with Exports */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 transition-all hover:bg-slate-50 focus:ring-2 focus:ring-amber-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value="all">All</option>
                            </select>
                            <span>entries</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                            <button onClick={exportToCSV} title="Export CSV" className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200">
                                <DownloadCloud size={15} /> CSV
                            </button>
                            <button onClick={exportToCSV} title="Export Excel" className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200">
                                <FileSpreadsheet size={15} /> Excel
                            </button>
                            <button onClick={handlePrint} title="Save as PDF" className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                                <FileText size={15} /> PDF
                            </button>
                            <button onClick={handlePrint} title="Print Document" className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200">
                                <Printer size={15} /> Print
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by nozzle name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[900px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-4 sm:px-6 py-4 rounded-tl-2xl">Shift & Time</th>
                                <th className="px-4 sm:px-6 py-4">Nozzle Details</th>
                                <th className="px-4 sm:px-6 py-4 text-center">Reading (Start ➔ End)</th>
                                <th className="px-4 sm:px-6 py-4 text-right">Sold Qty</th>
                                <th className="px-4 sm:px-6 py-4 text-right">Amount (৳)</th>
                                <th className="px-4 sm:px-6 py-4 text-center rounded-tr-2xl">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {readings.data.length > 0 ? (
                                readings.data.map((reading) => (
                                    <tr key={reading.id} className="transition-colors hover:bg-slate-50/50 group">
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="font-bold text-slate-900">Shift #{reading.shift_id}</div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(reading.created_at)}</div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <div className="font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{reading.nozzle?.name}</div>
                                            <div className="text-xs font-bold text-amber-600 mt-0.5">
                                                @ <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {Number(reading.unit_price).toFixed(2)} / Ltr
                                            </div>
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                            <div className="inline-flex items-center justify-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                <span className="text-slate-500 font-bold">{Number(reading.start_meter).toFixed(2)}</span>
                                                <ChevronRight size={14} className="text-amber-500" />
                                                <span className="text-emerald-600 font-extrabold">{Number(reading.end_meter).toFixed(2)}</span>
                                            </div>
                                            {reading.testing_qty > 0 && (
                                                <div className="text-[11px] font-bold text-rose-500 mt-1">Testing: -{Number(reading.testing_qty).toFixed(2)} Ltr</div>
                                            )}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right font-bold text-slate-700">
                                            {Number(reading.sold_qty || (reading.end_meter - reading.start_meter - reading.testing_qty)).toFixed(2)} Ltr
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-right font-black text-slate-900 text-base">
                                            <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {Number(reading.total_amount || ((reading.end_meter - reading.start_meter - reading.testing_qty) * reading.unit_price)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                        </td>
                                        <td className="px-4 sm:px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDeleteClick(reading)}
                                                className="flex h-8 w-8 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm mx-auto transition-all hover:scale-105 active:scale-95"
                                                title="Delete & Revert Stock"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                                        No readings recorded yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination Footer */}
                    {readings?.links && readings.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-4 sm:px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl">
                            <div>
                                Showing <span className="font-bold text-slate-800">{readings.from || 0}</span> to <span className="font-bold text-slate-800">{readings.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{readings.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1 overflow-x-auto py-1">
                                {readings.links.map((link, idx) => {
                                    let content = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                                    if (link.label.includes("Previous")) content = <ChevronLeft size={16} />;
                                    else if (link.label.includes("Next")) content = <ChevronRight size={16} />;

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 font-semibold transition-all shrink-0 ${
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

            {/* CREATE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>

                    <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 sm:px-6 py-4 sm:py-5 shrink-0">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                                    <Gauge size={20} />
                                </div>
                                Record Meter Reading
                            </h3>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600 shrink-0">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">

                                {/* Shift Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Active Shift <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.shift_id}
                                        onChange={(e) => setData("shift_id", e.target.value)}
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm"
                                    >
                                        <option value="">-- Choose Active Shift --</option>
                                        {openShifts.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                Shift #{s.id} - Operator: {s.user?.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.shift_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.shift_id}</p>}
                                </div>

                                {/* Nozzle Selection */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Nozzle <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.nozzle_id}
                                        onChange={handleNozzleChange}
                                        required
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm"
                                    >
                                        <option value="">-- Choose Nozzle --</option>
                                        {nozzles.map((n) => (
                                            <option key={n.id} value={n.id}>
                                                {n.name} ({n.tank?.product?.name})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.nozzle_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.nozzle_id}</p>}
                                </div>

                                {/* Previous Meter */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Previous/Start Meter</label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={selectedNozzle ? selectedNozzle.current_meter : "0.00"}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-100 px-4 text-sm text-slate-500 cursor-not-allowed font-bold shadow-sm"
                                    />
                                </div>

                                {/* New Meter */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">End Meter Reading <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.end_meter}
                                        onChange={(e) => setData("end_meter", e.target.value)}
                                        required
                                        placeholder="Enter new meter..."
                                        className="h-12 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 text-sm font-bold outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 shadow-sm"
                                    />
                                    {errors.end_meter && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.end_meter}</p>}
                                </div>

                                {/* Testing Quantity */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Testing/Return Qty (Ltr)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.testing_qty}
                                        onChange={(e) => setData("testing_qty", e.target.value)}
                                        placeholder="0"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                </div>

                                {/* Fuel Price View */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Current Fuel Price</label>
                                    <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 shadow-sm">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {selectedNozzle ? Number(selectedNozzle.tank?.product?.selling_price).toFixed(2) : "0.00"} / Ltr
                                    </div>
                                </div>

                            </div>

                            {/* Live Calculation Panel */}
                            <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-slate-800">
                                <div>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Sold Quantity</p>
                                    <p className="text-white font-extrabold text-lg sm:text-xl mt-0.5">{liveCalculation.soldQty.toFixed(2)} Ltr</p>
                                </div>
                                <div className="sm:text-right w-full sm:w-auto border-t sm:border-t-0 border-slate-800 pt-2 sm:pt-0">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Amount</p>
                                    <p className="text-amber-400 font-extrabold text-xl sm:text-2xl mt-0.5"><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {liveCalculation.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0">
                                <button type="button" onClick={closeModal} className="h-11 px-5 sm:px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95">Cancel</button>
                                <button type="submit" disabled={processing || liveCalculation.soldQty <= 0} className="h-11 px-6 sm:px-8 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-bold text-slate-900 shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                                    Confirm & Save Reading
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
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
