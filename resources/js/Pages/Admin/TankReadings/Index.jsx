import { useState, useEffect } from "react";
import { router, Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Container, Search, Plus, Trash2, Edit2, X, Calendar, Printer,
    ChevronLeft, ChevronRight, FileSpreadsheet, Droplets
} from "lucide-react";

import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function TankReadingIndex({ readings, tanks, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [searchDate, setSearchDate] = useState(filters?.date || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        id: null,
        tank_id: "",
        physical_stock: "",
        date: new Date().toISOString().split('T')[0],
        note: "",
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/tank-readings",
                { search: searchTerm, date: searchDate, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, searchDate, perPage]);

    const openAddModal = () => {
        setIsEditMode(false);
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const openEditModal = (reading) => {
        setIsEditMode(true);
        clearErrors();
        setData({
            id: reading.id,
            tank_id: reading.tank_id || "",
            physical_stock: reading.physical_stock,
            date: reading.date,
            note: reading.note || "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(`/admin/tank-readings/${data.id}`, {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        setIsModalOpen(false); reset();
                        Swal.fire({ icon: "success", title: "Updated!", text: "Reading updated.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
            });
        } else {
            post("/admin/tank-readings", {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        setIsModalOpen(false); reset();
                        Swal.fire({ icon: "success", title: "Saved!", text: "Tank dip reading recorded.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
            });
        }
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/tank-readings/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    Swal.fire({ icon: "success", title: "Deleted!", text: "Record removed.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } })
                }
            });
        }
    };

    const handlePrint = () => window.print();

    // Export Logic
    const exportToCSV = () => {
        const headers = ["Date,Tank,Software Stock,Physical Stock,Difference,Note\n"];
        const rows = readings.data.map(r => `${r.date},"${r.tank?.name || 'N/A'}",${r.software_stock},${r.physical_stock},${r.difference},"${(r.note || '').replace(/"/g, '""')}"\n`);
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Tank_Readings_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <AdminLayout title="Tank Dip Readings" icon={Container}>
            <Head title="Tank Readings | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Daily Tank Dip Readings</h2>
                        <p className="text-sm text-slate-500 mt-1">Compare physical scale readings with software stock to track shortage/surplus.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToCSV} className="hidden sm:flex h-11 items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95">
                            <FileSpreadsheet size={18} /> Excel
                        </button>
                        <button onClick={handlePrint} className="hidden sm:flex h-11 items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={openAddModal} className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <Plus size={18} /> Add New Reading
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <span>Show</span>
                        <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value="all">All</option>
                        </select>
                        <span>entries</span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative w-full sm:w-48">
                            <Calendar size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm transition-all" />
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input type="text" placeholder="Search by tank or note..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm transition-all" />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[850px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Date</th>
                                <th className="px-6 py-4">Tank Name</th>
                                <th className="px-6 py-4 text-right">Software Stock</th>
                                <th className="px-6 py-4 text-right">Physical Stock</th>
                                <th className="px-6 py-4 text-right">Difference (Loss/Gain)</th>
                                <th className="px-6 py-4 text-center rounded-tr-2xl print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {readings.data.length > 0 ? (
                                readings.data.map((row) => {
                                    const diff = Number(row.difference);
                                    const isShortage = diff < 0;
                                    const isSurplus = diff > 0;

                                    return (
                                        <tr key={row.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                                    <Calendar size={14} className="text-amber-500"/>
                                                    {new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                                    <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-500 border border-indigo-100"><Container size={12}/></div>
                                                    {row.tank?.name || "N/A"}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-500">
                                                {Number(row.software_stock).toLocaleString()} Ltr
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800">
                                                {Number(row.physical_stock).toLocaleString()} Ltr
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                    isShortage ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                    isSurplus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                }`}>
                                                    {diff > 0 ? '+' : ''}{diff} Ltr
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center print:hidden">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button onClick={() => openEditModal(row)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 hover:scale-105 active:scale-95" title="Edit">
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button onClick={() => {setItemToDelete(row); setIsDeleteModalOpen(true)}} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:scale-105 active:scale-95" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center text-slate-400">
                                        <Droplets size={48} className="mb-3 mx-auto opacity-20" />
                                        <p className="font-semibold text-slate-600">No tank readings found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {readings.links && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>Showing <span className="font-bold text-slate-800">{readings.from || 0}</span> to <span className="font-bold text-slate-800">{readings.to || 0}</span> of <span className="font-bold text-slate-800">{readings.total}</span> entries</div>
                            <div className="flex flex-wrap items-center gap-1">
                                {readings.links.map((link, idx) => (
                                    <Link key={idx} href={link.url || "#"} className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 font-semibold transition-all ${link.active ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20" : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"} ${!link.url ? "opacity-40 pointer-events-none" : ""}`}>
                                        <span dangerouslySetInnerHTML={{ __html: link.label.includes("Previous") ? "<" : link.label.includes("Next") ? ">" : link.label }} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => {setIsModalOpen(false); reset();}}></div>
                    <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 sm:px-6 py-4 sm:py-5">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><Container size={18}/></div>
                                {isEditMode ? "Edit Dip Reading" : "Record Tank Dip"}
                            </h3>
                            <button onClick={() => {setIsModalOpen(false); reset();}} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-600"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="col-span-1">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Reading Date <span className="text-rose-500">*</span></label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm" />
                                    {errors.date && <p className="mt-1 text-xs text-rose-500">{errors.date}</p>}
                                </div>
                                <div className="col-span-1">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Select Tank <span className="text-rose-500">*</span></label>
                                    <select value={data.tank_id} onChange={e => setData('tank_id', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="">-- Choose Tank --</option>
                                        {tanks.map((t) => <option key={t.id} value={t.id}>{t.name} (Current: {t.current_stock}L)</option>)}
                                    </select>
                                    {errors.tank_id && <p className="mt-1 text-xs text-rose-500">{errors.tank_id}</p>}
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Physical Scale Reading (Dip Stick) <span className="text-rose-500">*</span></label>
                                    <input type="number" min="0" step="any" value={data.physical_stock} onChange={e => setData('physical_stock', e.target.value)} required className="h-12 w-full font-black text-lg text-slate-800 rounded-xl border border-amber-300 bg-amber-50 px-4 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 shadow-sm" placeholder="Enter physically measured liters..." />
                                    <p className="mt-1.5 text-xs font-medium text-slate-500">Software stock will be recorded automatically at the time of entry.</p>
                                    {errors.physical_stock && <p className="mt-1 text-xs text-rose-500">{errors.physical_stock}</p>}
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Note (Optional)</label>
                                    <textarea value={data.note} onChange={e => setData('note', e.target.value)} rows="2" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white shadow-sm" placeholder="Write any reason for discrepancy..."></textarea>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-5 border-t border-slate-100">
                                <button type="button" onClick={() => {setIsModalOpen(false); reset();}} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-95">Cancel</button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                                    {processing ? 'Saving...' : 'Save Record'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && <ConfirmDeleteModal item={itemToDelete} onCancel={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />}
        </AdminLayout>
    );
}
