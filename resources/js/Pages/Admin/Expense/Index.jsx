import { useState, useEffect } from "react";
import { router, Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Wallet, Search, Plus, Trash2, Edit2, X, Calendar, Printer,
    ChevronLeft, ChevronRight, FileSpreadsheet, ReceiptText
} from "lucide-react";

export default function ExpenseIndex({ expenses, categories, accounts, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [searchDate, setSearchDate] = useState(filters?.date || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modal & Edit State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const { data, setData, post, put, reset, processing, errors, clearErrors } = useForm({
        id: null,
        account_id: "",
        expense_category_id: "", // Updated for new Schema
        amount: "",
        date: new Date().toISOString().split('T')[0],
        note: "",
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/expenses",
                { search: searchTerm, date: searchDate, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, searchDate, perPage]);

    // Open Add Modal
    const openAddModal = () => {
        setIsEditMode(false);
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    // Open Edit Modal
    const openEditModal = (expense) => {
        setIsEditMode(true);
        clearErrors();
        setData({
            id: expense.id,
            account_id: expense.account_id || "",
            expense_category_id: expense.expense_category_id || "", // Updated
            amount: expense.amount,
            date: expense.date,
            note: expense.note || "",
        });
        setIsModalOpen(true);
    };

    // Handle Form Submit
    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEditMode) {
            put(`/admin/expenses/${data.id}`, {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        setIsModalOpen(false);
                        reset();
                        Swal.fire({ icon: "success", title: "Updated!", text: "Expense has been updated.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
            });
        } else {
            post("/admin/expenses", {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        setIsModalOpen(false);
                        reset();
                        Swal.fire({ icon: "success", title: "Saved!", text: "Expense has been recorded.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
            });
        }
    };

    // Handle Delete
    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this expense record!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#94a3b8",
            confirmButtonText: "Yes, delete it!",
            customClass: { popup: 'rounded-2xl' }
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/admin/expenses/${id}`, {
                    onSuccess: () => Swal.fire({ icon: "success", title: "Deleted!", text: "Expense record deleted.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } })
                });
            }
        });
    };

    const exportToExcel = () => {
        if (expenses.data.length === 0) {
            Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export." });
            return;
        }

        const headers = ["Date", "Expense Category", "Account", "Note/Details", "Amount (TK)"];
        const rows = expenses.data.map(exp => [
            formatDate(exp.date),
            `"${exp.category?.name || 'N/A'}"`,
            `"${exp.account?.name || 'N/A'}"`,
            `"${(exp.note || 'N/A').replace(/"/g, '""')}"`,
            exp.amount
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Expense_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <AdminLayout title="Daily Expenses" icon={Wallet}>
            <Head title="Expenses | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Expense Management</h2>
                        <p className="text-sm text-slate-500 mt-1">Track all daily pump expenses and maintenance costs.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Excel Export Button */}
                        <button onClick={exportToExcel} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 hover:scale-105 active:scale-95">
                            <FileSpreadsheet size={18} /> Excel
                        </button>

                        {/* Print / PDF Button */}
                        <button onClick={handlePrint} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:scale-105 active:scale-95">
                            <Printer size={18} /> Print
                        </button>

                        <button onClick={openAddModal} className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95">
                            <Plus size={18} /> Add New Expense
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <span>Show</span>
                        <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 transition-all hover:bg-slate-50 focus:ring-2 focus:ring-amber-500">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value="all">All</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        {/* Date Filter */}
                        <div className="relative w-full sm:w-48">
                            <Calendar size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="date"
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm transition-all"
                            />
                        </div>
                        {/* Search Box */}
                        <div className="relative w-full sm:w-72">
                            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by note or category..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[800px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Date</th>
                                <th className="px-6 py-4">Expense Head</th>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4">Note / Details</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-right rounded-tr-2xl print:hidden">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {expenses.data.length > 0 ? (
                                expenses.data.map((expense) => (
                                    <tr key={expense.id} className="transition-colors hover:bg-slate-50/50 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Calendar size={14} className="text-amber-500"/>
                                                <span className="font-semibold">{formatDate(expense.date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                <ReceiptText size={12} />
                                                {expense.category?.name || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-600">
                                                {expense.account?.name || "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                                            {expense.note || <span className="italic text-slate-300">No details</span>}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-rose-600 text-base tracking-tight">
                                                <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {Number(expense.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right print:hidden">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button onClick={() => openEditModal(expense)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm transition-all hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 hover:scale-105 active:scale-95" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(expense.id)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm transition-all hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:scale-105 active:scale-95" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <Wallet size={48} className="mb-3 opacity-20" />
                                            <p className="text-base font-semibold text-slate-600">No expenses found</p>
                                            <p className="text-sm mt-1">Try adjusting your search criteria or add a new expense.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {expenses.links && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{expenses.from || 0}</span> to <span className="font-bold text-slate-800">{expenses.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{expenses.total}</span> entries
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {expenses.links.map((link, idx) => {
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

            {/* Add / Edit Expense Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => {setIsModalOpen(false); reset();}}></div>

                    <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 sm:px-6 py-4 sm:py-5">
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Wallet size={20}/>
                                </div>
                                {isEditMode ? "Edit Expense Record" : "Add New Expense"}
                            </h3>
                            <button onClick={() => {setIsModalOpen(false); reset();}} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600"><X size={18} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Date */}
                                <div className="col-span-1">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Date <span className="text-rose-500">*</span></label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm" />
                                    {errors.date && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.date}</p>}
                                </div>

                                {/* Amount */}
                                <div className="col-span-1">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Amount (৳) <span className="text-rose-500">*</span></label>
                                    <input type="number" min="1" step="any" value={data.amount} onChange={e => setData('amount', e.target.value)} required className="h-11 w-full font-black text-base sm:text-lg text-slate-800 rounded-xl border border-amber-300 bg-amber-50 px-4 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 shadow-sm placeholder:font-normal placeholder:text-slate-400" placeholder="0.00" />
                                    {errors.amount && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.amount}</p>}
                                </div>

                                {/* Payment Account */}
                                <div className="col-span-1">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Payment Account <span className="text-rose-500">*</span></label>
                                    <select value={data.account_id} onChange={e => setData('account_id', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="">-- Select Cash/Bank --</option>
                                        {accounts && accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type.replace('_', ' ')})</option>
                                        ))}
                                    </select>
                                    {errors.account_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.account_id}</p>}
                                </div>

                                {/* Expense Category */}
                                <div className="col-span-1">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Expense Category <span className="text-rose-500">*</span></label>
                                    <select value={data.expense_category_id} onChange={e => setData('expense_category_id', e.target.value)} required className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="">-- Select Head --</option>
                                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                    {errors.expense_category_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.expense_category_id}</p>}
                                </div>

                                {/* Note / Description */}
                                <div className="col-span-1 sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-slate-700">Note / Description</label>
                                    <textarea value={data.note} onChange={e => setData('note', e.target.value)} rows="2" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" placeholder="Reason for expense..."></textarea>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                                <button type="button" onClick={() => {setIsModalOpen(false); reset();}} className="h-11 w-full sm:w-auto px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95">Cancel</button>
                                <button type="submit" disabled={processing} className="h-11 w-full sm:w-auto px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none">
                                    {processing ? 'Saving...' : (isEditMode ? 'Update Expense' : 'Save Expense')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
