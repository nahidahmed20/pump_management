import { useState, useEffect } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import {
    Plus, Search, Edit, Trash2, X, FileSpreadsheet, FileText,
    ChevronLeft, ChevronRight, Scale, ArrowUpRight, ArrowDownRight, Calendar
} from "lucide-react";

export default function StockAdjustment({ adjustments, products, summary, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [startDate, setStartDate] = useState(filters?.start_date || "");
    const [endDate, setEndDate] = useState(filters?.end_date || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data, setData, post, put, reset, errors, processing, clearErrors } = useForm({
        id: "",
        date: new Date().toISOString().split('T')[0],
        product_id: "",
        type: "shortage",
        quantity: "",
        note: "",
    });

    // Debounced Search & Filters
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/stock-adjustments", {
                search: searchTerm,
                start_date: startDate,
                end_date: endDate,
                per_page: perPage
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, startDate, endDate, perPage]);

    // Modal Actions
    const openAddModal = () => { setIsEditMode(false); clearErrors(); reset(); setIsModalOpen(true); };
    const openEditModal = (item) => { setIsEditMode(true); clearErrors(); setData({ id: item.id, date: item.date, product_id: item.product_id, type: item.type, quantity: item.quantity, note: item.note || "" }); setIsModalOpen(true); };
    const handleDeleteClick = (item) => { setItemToDelete(item); setIsDeleteModalOpen(true); };

    // Form Submit
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(`/admin/stock-adjustments/${data.id}`, {
                onSuccess: () => {
                    setIsModalOpen(false);
                    Swal.fire({ icon: "success", title: "Updated!", text: "Adjustment updated.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                }
            });
        } else {
            post("/admin/stock-adjustments", {
                onSuccess: () => {
                    setIsModalOpen(false);
                    reset();
                    Swal.fire({ icon: "success", title: "Saved!", text: "Stock adjusted.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                }
            });
        }
    };

    // Delete Action
    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/stock-adjustments/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({ icon: "success", title: "Deleted!", text: "Record removed.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                }
            });
        }
    };

    // Exports
    const exportToExcel = () => {
        const headers = ["Date,Product,Type,Quantity,Financial Value,Note\n"];
        const rows = adjustments.data.map(i =>
            `"${i.date}","${i.product_name}","${i.type.toUpperCase()}","${i.quantity}","${i.total_value}","${(i.note || '').replace(/"/g, '""')}"\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `stock_adjustments_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const exportToPDF = () => window.print();

    // Money Formatter
    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    return (
        <AdminLayout title="Stock Adjustments" icon={Scale}>
            <Head title="Stock Adjustments | FuelDesk" />
            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Stock Adjustments</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage fuel shortages or surplus and track financial impact.</p>
                    </div>
                    <button onClick={openAddModal} className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95">
                        <Plus size={18} /> New Adjustment
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 print:grid-cols-2">
                    <div className="bg-white border border-rose-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-rose-500 uppercase mb-1">Total Shortage Loss (৳)</p>
                            <h3 className="text-2xl font-black text-slate-800">৳ {formatMoney(summary.total_shortage_amount)}</h3>
                        </div>
                        <div className="h-10 w-10 bg-rose-50 text-rose-600 flex items-center justify-center rounded-xl"><ArrowUpRight size={20}/></div>
                    </div>
                    <div className="bg-white border border-emerald-200 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Total Surplus Gain (৳)</p>
                            <h3 className="text-2xl font-black text-slate-800">৳ {formatMoney(summary.total_surplus_amount)}</h3>
                        </div>
                        <div className="h-10 w-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl"><ArrowDownRight size={20}/></div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span>Show</span>
                            <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500">
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                            <span>entries</span>
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                            <button onClick={exportToExcel} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600">
                                <FileSpreadsheet size={15} /> Excel
                            </button>
                            <button onClick={exportToPDF} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-rose-50 hover:text-rose-600">
                                <FileText size={15} /> PDF / Print
                            </button>
                        </div>

                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                            <Calendar size={15} className="text-slate-400 ml-2" />
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-amber-500" />
                            <span className="text-xs text-slate-400">to</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-amber-500" />
                        </div>
                    </div>

                    <div className="relative w-full xl:w-72">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input type="text" placeholder="Search product or note..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" />
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full text-left text-sm text-slate-700 min-w-[750px]">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Date</th>
                                <th className="px-6 py-4">Product Details</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4 text-right">Qty (Ltr)</th>
                                <th className="px-6 py-4 text-right">Financial Value (৳)</th>
                                <th className="px-6 py-4 text-center rounded-tr-2xl print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {adjustments.data.length > 0 ? (
                                adjustments.data.map((item) => (
                                    <tr key={item.id} className="transition-colors hover:bg-slate-50/50 group">
                                        <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">{item.date}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-slate-800">{item.product_name}</div>
                                            {item.note && <div className="text-xs text-slate-500 mt-0.5">Note: {item.note}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase border ${item.type === 'surplus' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                {item.type === 'surplus' ? <ArrowDownRight size={13}/> : <ArrowUpRight size={13}/>}
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 text-base">{item.quantity}</td>
                                        <td className="px-6 py-4 text-right font-bold text-base">
                                            <span className={item.type === 'surplus' ? 'text-emerald-600' : 'text-rose-600'}>
                                                ৳ {formatMoney(item.total_value)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center print:hidden">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEditModal(item)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 shadow-sm" title="Edit"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteClick(item)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm" title="Delete"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No adjustments found for the selected criteria.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                        <div>Showing <span className="font-bold text-slate-800">{adjustments.from || 0}</span> to <span className="font-bold text-slate-800">{adjustments.to || 0}</span> of <span className="font-bold text-slate-800">{adjustments.total}</span> entries</div>
                        <div className="flex flex-wrap items-center gap-1">
                            {adjustments.links.map((link, idx) => {
                                let content = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                                if (link.label.includes("Previous")) content = <ChevronLeft size={16} />;
                                else if (link.label.includes("Next")) content = <ChevronRight size={16} />;
                                return (
                                    <Link key={idx} href={link.url || "#"} className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 font-semibold transition-all ${link.active ? "bg-amber-500 text-slate-900 shadow-md shadow-amber-500/20" : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"} ${!link.url ? "opacity-40 pointer-events-none" : ""}`}>
                                        {content}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Scale size={20} className="text-amber-500" />
                                {isEditMode ? "Edit Stock Adjustment" : "New Stock Adjustment"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-rose-600"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Date <span className="text-rose-500">*</span></label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-500 cursor-pointer" />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Adjustment Type <span className="text-rose-500">*</span></label>
                                    <select value={data.type} onChange={e => setData('type', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-amber-500 cursor-pointer">
                                        <option value="shortage">Shortage (Loss / Evaporation)</option>
                                        <option value="surplus">Surplus (Excess Fuel)</option>
                                    </select>
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Select Product <span className="text-rose-500">*</span></label>
                                    <select value={data.product_id} onChange={e => setData('product_id', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-500 cursor-pointer">
                                        <option value="">-- Choose Fuel/Product --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.current_stock})</option>)}
                                    </select>
                                    {errors.product_id && <p className="mt-1 text-xs text-rose-500">{errors.product_id}</p>}
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Quantity (Ltr) <span className="text-rose-500">*</span></label>
                                    <input type="number" step="any" min="0.01" value={data.quantity} onChange={e => setData('quantity', e.target.value)} required placeholder="0.00" className="h-12 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 text-lg font-black outline-none focus:border-amber-500" />
                                </div>
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Note / Reason</label>
                                    <textarea value={data.note} onChange={e => setData('note', e.target.value)} rows="2" placeholder="e.g. Evaporation loss during summer" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-amber-500"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 px-5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={processing} className="h-11 px-6 rounded-xl bg-amber-500 font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-50">
                                    {isEditMode ? "Save Changes" : "Confirm Adjustment"}
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
