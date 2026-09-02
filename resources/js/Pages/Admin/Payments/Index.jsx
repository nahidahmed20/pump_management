import { useState, useEffect } from "react";
import { router, Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    WalletCards, Search, Plus, Trash2, X, Calendar, Printer,
    ChevronLeft, ChevronRight, FileSpreadsheet, ArrowDownLeft, ArrowUpRight
} from "lucide-react";

import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function PaymentIndex({ payments, accounts, parties, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [searchDate, setSearchDate] = useState(filters?.date || "");
    const [searchType, setSearchType] = useState(filters?.type || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const { data, setData, post, reset, processing, errors, clearErrors } = useForm({
        payment_type: "due_receive",
        party_id: "",
        account_id: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        note: "",
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/payments",
                { search: searchTerm, date: searchDate, type: searchType, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, searchDate, searchType, perPage]);

    const openAddModal = () => {
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/admin/payments", {
            onSuccess: (page) => {
                if (Object.keys(page.props.errors || {}).length === 0) {
                    setIsModalOpen(false); reset();
                    Swal.fire({ icon: "success", title: "Saved!", text: "Payment transaction recorded.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                }
            },
        });
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/payments/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    Swal.fire({ icon: "success", title: "Deleted!", text: "Transaction removed and balances reversed.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } })
                }
            });
        }
    };

    const exportToCSV = () => {
        const headers = ["Date,Type,Party,Account,Amount,Note\n"];
        const rows = payments.data.map(p => `${p.date},${p.payment_type},"${p.party?.name || 'N/A'}","${p.account?.name || 'N/A'}",${p.amount},"${(p.note || '').replace(/"/g, '""')}"\n`);
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Payments_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    return (
        <AdminLayout title="Transactions & Payments" icon={WalletCards}>
            <Head title="Payments | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Payment Transactions</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage customer due collections, supplier payments, and cash flows.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToCSV} className="hidden sm:flex h-11 items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition-all active:scale-95">
                            <FileSpreadsheet size={18} /> Excel
                        </button>
                        <button onClick={() => window.print()} className="hidden sm:flex h-11 items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95">
                            <Printer size={18} /> Print
                        </button>
                        <button onClick={openAddModal} className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                            <Plus size={18} /> New Payment
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
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
                        <select value={searchType} onChange={(e) => setSearchType(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-600 outline-none focus:border-amber-500 cursor-pointer">
                            <option value="">All Types</option>
                            <option value="due_receive">Due Receive (From Customer)</option>
                            <option value="purchase_pay">Purchase Pay (To Supplier)</option>
                            <option value="invoice_receive">Invoice Direct Pay</option>
                        </select>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="relative w-full sm:w-48">
                            <Calendar size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white cursor-pointer shadow-sm" />
                        </div>
                        <div className="relative w-full sm:w-72">
                            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input type="text" placeholder="Search by party or note..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white shadow-sm" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[850px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Date</th>
                                <th className="px-6 py-4">Transaction Type</th>
                                <th className="px-6 py-4">Party Name</th>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center rounded-tr-2xl print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payments.data.length > 0 ? (
                                payments.data.map((p) => {
                                    const isReceive = p.payment_type === 'due_receive';
                                    return (
                                        <tr key={p.id} className="hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4 font-semibold text-slate-700">{p.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                                    isReceive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {isReceive ? <ArrowDownLeft size={13}/> : <ArrowUpRight size={13}/>}
                                                    {p.payment_type.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{p.party?.name || "Walk-in / General"}</td>
                                            <td className="px-6 py-4 font-medium text-slate-600">{p.account?.name || "N/A"}</td>
                                            <td className={`px-6 py-4 text-right font-black text-base ${isReceive ? 'text-emerald-600' : 'text-slate-800'}`}>
                                                <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {Number(p.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                            <td className="px-6 py-4 text-center print:hidden">
                                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => {setItemToDelete(p); setIsDeleteModalOpen(true)}} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 shadow-sm" title="Delete">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">No payment records found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center"><WalletCards size={18}/></div>
                                Record New Payment
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-600"><X size={18}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Date <span className="text-rose-500">*</span></label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Type <span className="text-rose-500">*</span></label>
                                    <select value={data.payment_type} onChange={e => setData('payment_type', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-amber-500">
                                        <option value="due_receive">Due Receive (Customer)</option>
                                        <option value="purchase_pay">Purchase Pay (Supplier)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Select Party (Customer/Supplier) <span className="text-rose-500">*</span></label>
                                    <select value={data.party_id} onChange={e => setData('party_id', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-500">
                                        <option value="">-- Choose Party --</option>
                                        {parties.filter(p => data.payment_type === 'due_receive' ? p.type === 'customer' : p.type === 'supplier').map(p => <option key={p.id} value={p.id}>{p.name} ({p.type}) - Due: {p.current_balance}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Account (Cash/Bank) <span className="text-rose-500">*</span></label>
                                    <select value={data.account_id} onChange={e => setData('account_id', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-amber-500">
                                        <option value="">-- Choose Account --</option>
                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.name} (Bal: {a.current_balance})</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Amount (৳) <span className="text-rose-500">*</span></label>
                                    <input type="number" step="any" value={data.amount} onChange={e => setData('amount', e.target.value)} required placeholder="0.00" className="h-12 w-full font-black text-lg rounded-xl border border-amber-300 bg-amber-50 px-4 outline-none focus:border-amber-500" />
                                </div>
                                <div className="col-span-2">
                                    <label className="mb-1.5 block text-sm font-bold text-slate-700">Note</label>
                                    <textarea value={data.note} onChange={e => setData('note', e.target.value)} rows="2" placeholder="Optional notes..." className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-amber-500"></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 px-5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={processing} className="h-11 px-6 rounded-xl bg-amber-500 font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-50">Save Transaction</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && <ConfirmDeleteModal item={itemToDelete} onCancel={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />}
        </AdminLayout>
    );
}
