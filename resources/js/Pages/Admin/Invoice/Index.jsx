import { useState, useEffect } from "react";
import { router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import {
    Plus, Search, FileText, Trash2, Edit, ChevronLeft, ChevronRight, ShoppingCart
} from "lucide-react";

export default function InvoiceIndex({ invoices, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/invoices",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const handleDeleteClick = (invoice) => {
        setItemToDelete(invoice);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/invoices/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({ icon: "success", title: "Deleted!", text: "Invoice deleted and stock reverted.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                },
            });
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const invoiceList = invoices?.data || [];

    return (
        <AdminLayout title="Sales & Invoices" icon={ShoppingCart}>
            <Head title="Sales List | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Sales History</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage all your manual sales, lubes, and due records seamlessly.</p>
                    </div>
                    <div>
                        <Link
                            href="/admin/invoices/create"
                            className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> New Sale (POS)
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                        <span>Show</span>
                        <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500">
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="all">All</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Invoice No or Customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[950px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Invoice Info</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right">Grand Total</th>
                                <th className="px-6 py-4 text-right">Paid</th>
                                <th className="px-6 py-4 text-right">Due</th>
                                <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoiceList.length > 0 ? (
                                invoiceList.map((invoice) => {
                                    let status = "Paid";
                                    let statusClasses = "bg-emerald-50 text-emerald-600 border-emerald-200";
                                    if (Number(invoice.paid_amount) === 0) {
                                        status = "Unpaid";
                                        statusClasses = "bg-rose-50 text-rose-600 border-rose-200";
                                    } else if (Number(invoice.due_amount) > 0) {
                                        status = "Partial";
                                        statusClasses = "bg-amber-50 text-amber-600 border-amber-200";
                                    }

                                    return (
                                        <tr key={invoice.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{invoice.invoice_no}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(invoice.created_at)}</div>
                                                {invoice.shift_id && (
                                                    <div className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md mt-1 inline-block border border-slate-200">Shift #{invoice.shift_id}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                {invoice.customer ? invoice.customer.name : <span className="text-slate-400 italic font-medium">Walk-in Customer</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${statusClasses}`}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                                                <span className="font-normal text-slate-400 text-sm mr-1">৳</span> {formatMoney(invoice.grand_total)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                <span className="font-normal text-emerald-400 text-sm mr-1">৳</span> {formatMoney(invoice.paid_amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-rose-600">
                                                {Number(invoice.due_amount) > 0 ? (
                                                    <>
                                                        <span className="font-normal text-rose-400 text-sm mr-1">৳</span> {formatMoney(invoice.due_amount)}
                                                    </>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/invoices/${invoice.id}`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors" title="View & Print">
                                                        <FileText size={16} />
                                                    </Link>
                                                    <Link href={`/admin/invoices/${invoice.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors" title="Edit">
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button onClick={() => handleDeleteClick(invoice)} className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" className="py-12 text-center text-slate-400 font-medium">No sales recorded yet.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {invoices?.links && invoices.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl">
                            <div>
                                Showing <span className="font-bold text-slate-800">{invoices.from || 0}</span> to <span className="font-bold text-slate-800">{invoices.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{invoices.total}</span> entries
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {invoices.links.map((link, idx) => {
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

            {isDeleteModalOpen && <ConfirmDeleteModal item={itemToDelete} onCancel={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />}
        </AdminLayout>
    );
}
