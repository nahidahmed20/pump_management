import { useState, useEffect } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import {
    Plus, Search, Edit2, Trash2, X, Eye,
    FileSpreadsheet, Printer, Wallet, Building2, CreditCard,
    ChevronLeft, ChevronRight,
} from "lucide-react";

export default function AccountIndex({ accounts, summary, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Delete Modal States
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Inertia Form State
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        id: null,
        name: "",
        type: "cash",
        account_number: "",
        bank_name: "",
        opening_balance: "",
    });

    // Auto trigger search when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/accounts",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = (account = null) => {
        clearErrors();
        if (account) {
            setIsEditMode(true);
            setData({
                id: account.id,
                name: account.name,
                type: account.type,
                account_number: account.account_number || "",
                bank_name: account.bank_name || "",
                opening_balance: account.opening_balance,
            });
        } else {
            setIsEditMode(false);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    // Submit Handler
    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(`/admin/accounts/${data.id}`, {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        closeModal();
                        Swal.fire({ icon: "success", title: "Updated!", text: "Account has been updated.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                }
            });
        } else {
            post("/admin/accounts", {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        closeModal();
                        Swal.fire({ icon: "success", title: "Created!", text: "New account added.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                }
            });
        }
    };

    // Delete Modal Handlers
    const handleDeleteClick = (account) => {
        setItemToDelete(account);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/accounts/${itemToDelete.id}`, {
                onSuccess: (page) => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        Swal.fire({ icon: "success", title: "Deleted!", text: "Account deleted successfully.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
                onError: (errors) => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({ icon: "error", title: "Cannot Delete", text: Object.values(errors)[0], confirmButtonColor: "#ef4444", customClass: { popup: 'rounded-2xl' } });
                }
            });
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    // Export Functions
    const exportToExcel = () => {
        if (accounts.data.length === 0) {
            Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export." });
            return;
        }

        const headers = ["Account Name", "Type", "Bank Name", "A/C Number", "Opening Balance", "Current Balance"];
        const rows = accounts.data.map(a => [
            `"${a.name}"`,
            `"${a.type.toUpperCase()}"`,
            `"${a.bank_name || 'N/A'}"`,
            `"${a.account_number || 'N/A'}"`,
            a.opening_balance,
            a.current_balance
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(e => e.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Accounts_List_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    return (
        <AdminLayout title="Accounts & Balances" icon={Wallet}>
            <Head title="Accounts Management | FuelDesk" />
            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Top Header & Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">System Accounts</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage all cash boxes, banks, and mobile banking accounts.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToExcel} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95">
                            <FileSpreadsheet size={18} /> Excel
                        </button>

                        <button onClick={handlePrint} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print / PDF
                        </button>

                        <button onClick={() => openModal()} className="flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95">
                            <Plus size={18} /> Add New Account
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:grid-cols-3 print:gap-2">
                    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Cash in Hand</p>
                            <h3 className="text-2xl font-black text-slate-800">৳ {formatMoney(summary.totalCash)}</h3>
                        </div>
                        <div className="h-12 w-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl"><Wallet size={22}/></div>
                    </div>

                    <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total Bank Balance</p>
                            <h3 className="text-2xl font-black text-slate-800">৳ {formatMoney(summary.totalBank)}</h3>
                        </div>
                        <div className="h-12 w-12 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl"><Building2 size={22}/></div>
                    </div>

                    <div className="bg-slate-900 p-5 rounded-2xl shadow-lg flex items-center justify-between text-white print:bg-white print:text-black print:border print:border-slate-300">
                        <div>
                            <p className="text-xs font-bold text-amber-400 uppercase mb-1 print:text-slate-600">Grand Total Fund</p>
                            <h3 className="text-2xl font-black text-white print:text-black">৳ {formatMoney(summary.grandTotal)}</h3>
                        </div>
                        <div className="h-12 w-12 bg-slate-800 text-amber-400 flex items-center justify-center rounded-2xl print:hidden"><CreditCard size={22}/></div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden">
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

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[750px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Account Name</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Bank Details</th>
                                <th className="px-6 py-4 text-right">Current Balance</th>
                                <th className="px-6 py-4 text-center rounded-tr-2xl print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {accounts.data.length > 0 ? (
                                accounts.data.map((acc) => (
                                    <tr key={acc.id} className="transition-colors hover:bg-slate-50/50 group">
                                        <td className="px-6 py-4 font-bold text-slate-900">
                                            {acc.name}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700 border border-blue-200 print:border print:text-black">
                                                {acc.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                                            {acc.type !== 'cash' ? (
                                                <div>
                                                    <span className="font-bold text-slate-800 block">{acc.bank_name}</span>
                                                    <span className="text-slate-400">A/C: {acc.account_number}</span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 italic">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                                            <span style={{ fontFamily: 'Arial' }} className="text-slate-400 font-normal mr-1">৳</span>
                                            {formatMoney(acc.current_balance)}
                                        </td>
                                        <td className="px-6 py-4 text-center print:hidden">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* View Ledger / Statement Button */}
                                                <Link href={`/admin/accounts/${acc.id}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600" title="View Statement">
                                                    <Eye size={16} />
                                                </Link>
                                                {/* Edit Button */}
                                                <button onClick={() => openModal(acc)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                {/* Delete Button */}
                                                <button onClick={() => handleDeleteClick(acc)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                                        No accounts found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {accounts.links && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{accounts.from || 0}</span> to <span className="font-bold text-slate-800">{accounts.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{accounts.total}</span> entries
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {accounts.links.map((link, idx) => {
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative w-full max-w-xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Wallet size={20}/>
                                </div>
                                {isEditMode ? "Edit Account Details" : "Create New Account"}
                            </h3>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Account Type <span className="text-rose-500">*</span></label>
                                    <select value={data.type} onChange={e => setData('type', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="cash">Cash Box / Drawer</option>
                                        <option value="bank">Bank Account</option>
                                        <option value="mobile_banking">Mobile Banking (bKash/Nagad)</option>
                                    </select>
                                    {errors.type && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.type}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Account Name <span className="text-rose-500">*</span></label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Main Cash, bKash Agent" required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" />
                                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.name}</p>}
                                </div>

                                {data.type !== 'cash' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">Bank Name</label>
                                            <input type="text" value={data.bank_name} onChange={e => setData('bank_name', e.target.value)} placeholder="e.g. DBBL" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">A/C Number</label>
                                            <input type="text" value={data.account_number} onChange={e => setData('account_number', e.target.value)} placeholder="Account Number" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" />
                                        </div>
                                    </>
                                )}

                                {!isEditMode && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Opening Balance (৳) <span className="text-rose-500">*</span></label>
                                        <input type="number" min="0" step="any" value={data.opening_balance} onChange={e => setData('opening_balance', e.target.value)} required placeholder="0.00" className="h-12 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 text-lg font-black outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 shadow-sm" />
                                        {errors.opening_balance && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.opening_balance}</p>}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                                    {processing ? 'Saving...' : (isEditMode ? "Save Changes" : "Create Account")}
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
