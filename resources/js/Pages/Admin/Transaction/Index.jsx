import { useState, useEffect } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Plus, Search, Trash2, X, FileSpreadsheet, FileText,
    ArrowDownLeft, ArrowUpRight, ArrowRightLeft, BriefcaseBusiness,
    ChevronLeft, ChevronRight, Eye, Printer, Wallet
} from "lucide-react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function TransactionIndex({ transactions, accounts, parties, users, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);

    // Show Details / Receipt Modal
    const [isShowModalOpen, setIsShowModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        date: new Date().toISOString().split('T')[0],
        type: "payment_in",
        account_id: "",
        amount: "",
        party_id: "",
        user_id: "",
        to_account_id: "",
        payment_method: "Cash",
        note: "",
    });

    // Server-side search and pagination trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/transactions",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = () => {
        clearErrors();
        reset();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/admin/transactions", {
            onSuccess: (page) => {
                if (Object.keys(page.props.errors || {}).length === 0) {
                    closeModal();
                    Swal.fire({
                        icon: "success", title: "Success!", text: "Transaction saved successfully.", confirmButtonColor: "#f59e0b", customClass: { popup: 'rounded-2xl' }
                    });
                }
            }
        });
    };

    const handleDeleteClick = (trx) => {
        if (trx.source !== 'manual') {
            Swal.fire({ icon: "info", title: "Cannot Delete", text: "Auto-generated transactions (POS/Purchase/Expense) can only be deleted from their original modules.", confirmButtonColor: "#f59e0b", customClass: { popup: 'rounded-2xl' } });
            return;
        }
        setTransactionToDelete(trx);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (transactionToDelete) {
            router.delete(`/admin/transactions/${transactionToDelete.id}`, {
                onSuccess: (page) => {
                    setIsDeleteModalOpen(false);
                    setTransactionToDelete(null);
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        Swal.fire({ icon: "success", title: "Reversed!", text: "Transaction deleted and balance reversed.", confirmButtonColor: "#f59e0b", customClass: { popup: 'rounded-2xl' } });
                    }
                },
                onError: (errors) => {
                    setIsDeleteModalOpen(false);
                    Swal.fire({ icon: "error", title: "Failed", text: Object.values(errors)[0], confirmButtonColor: "#ef4444", customClass: { popup: 'rounded-2xl' } });
                }
            });
        }
    };

    const openShowModal = (trx) => {
        setSelectedTransaction(trx);
        setIsShowModalOpen(true);
    };

    const exportToCSV = () => {
        const headers = ["Reference,Date,Type,Account,Amount,Details\n"];
        const rows = transactions.data.map(t =>
            `"${t.reference}","${t.date}","${t.type}","${t.account_name || 'N/A'}",${t.amount},"${t.note || ''}"\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const getTypeDetails = (type) => {
        switch(type) {
            case 'payment_in': return { label: 'Money Receipt (In)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: ArrowDownLeft };
            case 'payment_out': return { label: 'Payment (Out)', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: ArrowUpRight };
            case 'transfer': return { label: 'Bank Transfer', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: ArrowRightLeft };
            case 'salary': return { label: 'Payroll / Salary', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: BriefcaseBusiness };
            case 'loan_received': return { label: 'Loan Received', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: ArrowDownLeft };
            case 'loan_repayment': return { label: 'Loan Repayment', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: ArrowUpRight };
            default: return { label: type, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: BriefcaseBusiness };
        }
    };

    return (
        <AdminLayout title="Transactions & Ledger" icon={ArrowRightLeft}>
            <Head title="Transactions | FuelDesk" />

            <div className="space-y-6 print:hidden animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Ledger & Transactions</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage all money receipts, payments, sales, purchases, and expenses in one place.</p>
                    </div>
                    <div>
                        <button onClick={openModal} className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95">
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> New Transaction
                        </button>
                    </div>
                </div>

                {/* Filter & Export Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span>Show</span>
                            <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                                <option value="all">All</option>
                            </select>
                            <span>entries</span>
                        </div>

                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                            <button onClick={exportToCSV} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600">
                                <FileSpreadsheet size={15} /> CSV / Excel
                            </button>
                            <button onClick={() => window.print()} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-rose-50 hover:text-rose-600">
                                <FileText size={15} /> Print
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by reference, party, account..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[900px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Date & Reference</th>
                                <th className="px-6 py-4">Transaction Type</th>
                                <th className="px-6 py-4">Account & Party Details</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {transactions.data.length > 0 ? (
                                transactions.data.map((trx) => {
                                    const typeInfo = getTypeDetails(trx.type);
                                    const TypeIcon = typeInfo.icon;
                                    const isPosOrPurchase = trx.source !== 'manual';

                                    return (
                                        <tr key={`${trx.source}-${trx.id}`} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{trx.reference}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{trx.date}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${typeInfo.bg} ${typeInfo.color}`}>
                                                    <TypeIcon size={13}/> {typeInfo.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs">
                                                <span className="font-bold text-slate-800 block text-sm">A/C: {trx.account_name || 'N/A'}</span>
                                                {trx.party_name && <span className="text-slate-600 font-medium">Party: {trx.party_name}</span>}
                                                {trx.user_name && <span className="text-slate-600 font-medium ml-2">Staff: {trx.user_name}</span>}
                                                {trx.note && <span className="block text-slate-400 font-normal italic mt-0.5">{trx.note}</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-base">
                                                <span className={trx.type === 'payment_in' || trx.type === 'loan_received' ? 'text-emerald-600' : 'text-rose-600'}>
                                                    {trx.type === 'payment_in' || trx.type === 'loan_received' ? '+' : '-'} <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(trx.amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => openShowModal(trx)}
                                                        title="View Receipt"
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm transition-all hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 active:scale-95"
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            openShowModal(trx);
                                                            setTimeout(() => { window.print(); }, 150);
                                                        }}
                                                        title="Print Receipt"
                                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500 shadow-sm transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 active:scale-95"
                                                    >
                                                        <Printer size={16} />
                                                    </button>

                                                    <button
                                                        onClick={() => handleDeleteClick(trx)}
                                                        title={isPosOrPurchase ? "Managed in original module" : "Reverse Transaction"}
                                                        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm transition-all active:scale-95 ${
                                                            isPosOrPurchase ? 'opacity-40 cursor-not-allowed text-slate-300' : 'text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                                                        }`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="5" className="py-12 text-center text-slate-400 font-medium">No transactions found.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {transactions?.links && transactions.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl">
                            <div>
                                Showing <span className="font-bold text-slate-800">{transactions.from || 0}</span> to <span className="font-bold text-slate-800">{transactions.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{transactions.total}</span> entries
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {transactions.links.map((link, idx) => {
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

            {/* CREATE TRANSACTION MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <ArrowRightLeft size={20} />
                                </div>
                                Create Transaction
                            </h3>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Date <span className="text-rose-500">*</span></label>
                                    <input type="date" value={data.date} onChange={e => setData('date', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Transaction Type <span className="text-rose-500">*</span></label>
                                    <select value={data.type} onChange={e => setData('type', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="payment_in">Payment In (Receive Money)</option>
                                        <option value="payment_out">Payment Out (Pay Supplier/Expense)</option>
                                        <option value="transfer">Bank Transfer / Deposit</option>
                                        <option value="salary">Staff Salary / Advance</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Select Account <span className="text-rose-500">*</span></label>
                                    <select value={data.account_id} onChange={e => setData('account_id', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="">-- Choose Account --</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} (Bal: ৳{formatMoney(acc.current_balance)})</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Amount (৳) <span className="text-rose-500">*</span></label>
                                    <input type="number" min="1" step="any" value={data.amount} onChange={e => setData('amount', e.target.value)} required placeholder="0.00" className="h-12 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 text-base font-black outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 shadow-sm" />
                                </div>

                                {(data.type === 'payment_in' || data.type === 'payment_out') && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            {data.type === 'payment_in' ? 'Select Customer' : 'Select Supplier'} (Optional)
                                        </label>
                                        <select value={data.party_id} onChange={e => setData('party_id', e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                            <option value="">-- Select {data.type === 'payment_in' ? 'Customer' : 'Supplier'} --</option>
                                            {parties.filter(p => data.type === 'payment_in' ? p.type?.toLowerCase() === 'customer' : p.type?.toLowerCase() === 'supplier').map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {data.type === 'salary' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Select Employee / Staff <span className="text-rose-500">*</span></label>
                                        <select value={data.user_id} onChange={e => setData('user_id', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                            <option value="">-- Select Staff --</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                {data.type === 'transfer' && (
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Transfer TO Account <span className="text-rose-500">*</span></label>
                                        <select value={data.to_account_id} onChange={e => setData('to_account_id', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                            <option value="">-- Select Destination Account --</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Note / Description</label>
                                    <textarea value={data.note} onChange={e => setData('note', e.target.value)} rows="2" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"></textarea>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95">Cancel</button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50">
                                    {processing ? 'Saving...' : 'Save Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SHOW DETAILS & RECEIPT MODAL */}
            {isShowModalOpen && selectedTransaction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity print:hidden" onClick={() => setIsShowModalOpen(false)}></div>

                    <div className="relative w-full max-w-lg max-h-[95vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:max-w-none print:rounded-none">

                        <div className="flex-shrink-0 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 print:hidden">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Printer size={20} />
                                </div>
                                Print Receipt
                            </h3>
                            <button onClick={() => setIsShowModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-8 print:p-6 bg-white space-y-6">
                            <div className="text-center">
                                <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">M/S SURMA FILLING STATION</h1>
                                <p className="text-xs text-slate-500 mt-0.5">Sylhet-Dhaka Highway, Bangladesh</p>
                                <p className="text-xs text-slate-500">Phone: +880 1700-000000</p>
                            </div>

                            <div className="flex justify-between items-center border-y border-slate-200 py-3">
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Voucher / Ref</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedTransaction.reference}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase text-slate-400">Date</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedTransaction.date}</p>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-bold text-slate-500">Type:</span>
                                    <span className="font-semibold text-slate-800">{getTypeDetails(selectedTransaction.type).label}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="font-bold text-slate-500">Account:</span>
                                    <span className="font-semibold text-slate-800">{selectedTransaction.account_name}</span>
                                </div>
                                {selectedTransaction.party_name && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="font-bold text-slate-500">Party:</span>
                                        <span className="font-semibold text-slate-800">{selectedTransaction.party_name}</span>
                                    </div>
                                )}
                                {selectedTransaction.user_name && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="font-bold text-slate-500">Staff:</span>
                                        <span className="font-semibold text-slate-800">{selectedTransaction.user_name}</span>
                                    </div>
                                )}
                                {selectedTransaction.note && (
                                    <div className="flex justify-between border-b border-slate-100 pb-2">
                                        <span className="font-bold text-slate-500">Note:</span>
                                        <span className="italic text-slate-600">{selectedTransaction.note}</span>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 flex justify-between items-center">
                                <span className="text-sm font-bold text-emerald-800 uppercase">Total Amount</span>
                                <span className="text-2xl font-black text-emerald-700"><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(selectedTransaction.amount)}</span>
                            </div>

                            <div className="mt-16 flex justify-between pt-6 text-xs font-semibold text-slate-600">
                                <div className="border-t border-slate-400 w-36 text-center pt-2">Customer Signature</div>
                                <div className="border-t border-slate-400 w-36 text-center pt-2">Authorized Seal</div>
                            </div>
                        </div>

                        <div className="flex-shrink-0 flex items-center justify-end gap-3 bg-slate-50 px-6 py-4 print:hidden border-t border-slate-100">
                            <button onClick={() => setIsShowModalOpen(false)} className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50">
                                Close
                            </button>
                            <button onClick={() => window.print()} className="flex h-10 items-center gap-2 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]">
                                <Printer size={16} /> Print Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirm Delete Modal */}
            {isDeleteModalOpen && (
                <ConfirmDeleteModal item={transactionToDelete} onCancel={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />
            )}
        </AdminLayout>
    );
}
