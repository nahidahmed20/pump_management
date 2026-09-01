import { useState, useEffect, useRef } from "react";
import { router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import axios from "axios";
import {
    Plus, Search, Truck, ChevronLeft, ChevronRight, Trash2, Eye, Edit, X, FileSpreadsheet, FileText, Printer, DownloadCloud
} from "lucide-react";

export default function PurchaseIndex({ purchases, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Show Details Modal
    const [isShowModalOpen, setIsShowModalOpen] = useState(false);
    const [purchaseDetails, setPurchaseDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [loadingRowId, setLoadingRowId] = useState(null);

    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timer = setTimeout(() => {
            router.get(
                "/admin/purchases",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // --- Delete Logic ---
    const handleDeleteClick = (purchase) => {
        setItemToDelete(purchase);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/purchases/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({ icon: "success", title: "Deleted!", text: "Purchase deleted successfully.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                }
            });
        }
    };

    // --- Show Details Logic ---
    const handleShowClick = async (id) => {
        setPurchaseDetails(null);
        setIsShowModalOpen(true);
        setIsLoadingDetails(true);
        setLoadingRowId(id);

        try {
            const response = await axios.get(`/admin/purchases/${id}`);
            setPurchaseDetails(response.data);
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Could not fetch details' });
            setIsShowModalOpen(false);
        } finally {
            setLoadingRowId(null);
            setIsLoadingDetails(false);
        }
    };

    const handleCloseShowModal = () => {
        setIsShowModalOpen(false);
        setPurchaseDetails(null);
    };

    // Export to CSV
    const exportToCSV = () => {
        const headers = ["Reference,Supplier,Grand Total,Paid Amount,Due Amount,Date\n"];
        const rows = purchases.data.map(p => {
            const total = Number(p.total_amount || 0);
            const paid = Number(p.paid_amount || 0);
            return `"${p.reference_no}","${p.supplier?.name || 'Unknown'}",${total},${paid},${total - paid},"${p.created_at}"\n`;
        });
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Purchase_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const purchaseList = purchases?.data || [];

    return (
        <AdminLayout title="Purchases" icon={Truck}>
            <Head title="Purchases List | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Purchase History</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage all your stock in and purchase records seamlessly.</p>
                    </div>
                    <div>
                        <Link href="/admin/purchases/create" className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95">
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> Add New Purchase
                        </Link>
                    </div>
                </div>

                {/* Toolbar Section */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value)}
                                className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            <span>entries</span>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                            <button onClick={exportToCSV} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <DownloadCloud size={15} /> CSV
                            </button>
                            <button onClick={exportToCSV} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 transition-colors">
                                <FileSpreadsheet size={15} /> Excel
                            </button>
                            <button onClick={() => window.print()} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                <FileText size={15} /> PDF / Print
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search purchases by ref or supplier..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[950px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Ref & Date</th>
                                <th className="px-6 py-4">Supplier Info</th>
                                <th className="px-6 py-4 text-right">Grand Total</th>
                                <th className="px-6 py-4 text-right">Paid</th>
                                <th className="px-6 py-4 text-right">Due</th>
                                <th className="px-6 py-4 text-right rounded-tr-2xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {purchaseList.length > 0 ? (
                                purchaseList.map((purchase) => {
                                    const total = Number(purchase.total_amount || 0);
                                    const paid = Number(purchase.paid_amount || 0);
                                    const due = total - paid;
                                    return (
                                        <tr key={purchase.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900">{purchase.reference_no}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">{formatDate(purchase.created_at)}</div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                {purchase.supplier?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                                                <span className="font-normal text-slate-400 text-sm mr-1">৳</span>
                                                {total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                <span className="font-normal text-emerald-400 text-sm mr-1">৳</span>
                                                {paid.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-rose-600">
                                                {due > 0 ? (
                                                    <>
                                                        <span className="font-normal text-rose-400 text-sm mr-1">৳</span>
                                                        {due.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                    </>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* View Button */}
                                                    <button
                                                        onClick={() => handleShowClick(purchase.id)}
                                                        disabled={loadingRowId === purchase.id}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-blue-600 disabled:opacity-50"
                                                        title="View Details"
                                                    >
                                                        {loadingRowId === purchase.id ? (
                                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"></span>
                                                        ) : (
                                                            <Eye size={16} />
                                                        )}
                                                    </button>

                                                    {/* Edit Button */}
                                                    <Link
                                                        href={`/admin/purchases/${purchase.id}/edit`}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </Link>

                                                    {/* Delete Button */}
                                                    <button
                                                        onClick={() => handleDeleteClick(purchase)}
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
                                <tr><td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No purchases found.</td></tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {purchases?.links && purchases.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl">
                            <div>
                                Showing <span className="font-bold text-slate-800">{purchases.from || 0}</span> to <span className="font-bold text-slate-800">{purchases.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{purchases.total}</span> entries
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {purchases.links.map((link, idx) => {
                                    let content = <span dangerouslySetInnerHTML={{ __html: link.label }} />;
                                    if (link.label.includes("Previous")) content = <ChevronLeft size={16} />;
                                    else if (link.label.includes("Next")) content = <ChevronRight size={16} />;

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg px-3 font-semibold transition-all ${
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

            {/* --- SHOW DETAILS MODAL --- */}
            {isShowModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={handleCloseShowModal}></div>

                    <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <Truck size={20} className="text-amber-500" /> Purchase Details
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Reference: <span className="font-bold text-slate-700">{purchaseDetails?.reference_no || 'Loading...'}</span></p>
                            </div>
                            <button
                                onClick={handleCloseShowModal}
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            {isLoadingDetails ? (
                                <div className="flex h-40 flex-col items-center justify-center text-slate-400 gap-3">
                                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500"></div>
                                    <p className="text-sm font-medium">Loading details...</p>
                                </div>
                            ) : purchaseDetails ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Supplier Info</p>
                                            <p className="font-bold text-slate-800 text-base">{purchaseDetails.supplier?.name}</p>
                                            <p className="text-sm text-slate-600 mt-0.5">{purchaseDetails.supplier?.phone || 'No phone provided'}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Purchase Date</p>
                                            <p className="font-bold text-slate-800 text-base">{formatDate(purchaseDetails.created_at)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
                                            <div className="mt-1">
                                                {Number(purchaseDetails.total_amount) - Number(purchaseDetails.paid_amount) > 0 ? (
                                                    <span className="inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 border border-rose-200">Due Remaining</span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-200">Paid in Full</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Products Table */}
                                    <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                                <tr>
                                                    <th className="px-5 py-4">Product Details</th>
                                                    <th className="px-5 py-4">Storage / Tank</th>
                                                    <th className="px-5 py-4 text-center">Quantity</th>
                                                    <th className="px-5 py-4 text-right">Unit Price</th>
                                                    <th className="px-5 py-4 text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 text-slate-700">
                                                {purchaseDetails.items?.map(item => (
                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-5 py-4 font-bold text-slate-800">{item.product?.name}</td>
                                                        <td className="px-5 py-4 text-slate-500">
                                                            {item.tank ? (
                                                                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 border border-blue-200">
                                                                    {item.tank.name}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-400 italic font-medium">No Tank</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-center font-bold">{item.quantity}</td>
                                                        <td className="px-5 py-4 text-right font-semibold">৳ {Number(item.unit_price).toLocaleString()}</td>
                                                        <td className="px-5 py-4 text-right font-black text-slate-900">৳ {Number(item.total_price).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start pt-2">
                                        {/* Split Payments Breakdown */}
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3 shadow-sm">
                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Breakdown (Accounts Used)</p>
                                            {purchaseDetails.payments?.length > 0 ? (
                                                <div className="space-y-2">
                                                    {purchaseDetails.payments.map((pay, pIdx) => (
                                                        <div key={pIdx} className="flex justify-between items-center text-xs bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm">
                                                            <span className="font-bold text-slate-700">{pay.account_name}</span>
                                                            <span className="font-black text-emerald-600">৳ {Number(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-slate-400 italic">No direct payment recorded.</p>
                                            )}
                                        </div>

                                        {/* Grand Totals Summary */}
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3 shadow-sm">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-slate-500 font-semibold">Sub Total:</span>
                                                <span className="font-bold text-slate-700">৳ {Number(purchaseDetails.sub_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm border-b border-slate-200 pb-3">
                                                <span className="text-slate-500 font-semibold">Discount:</span>
                                                <span className="font-bold text-slate-700">৳ {Number(purchaseDetails.discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-base font-bold text-slate-800">Grand Total:</span>
                                                <span className="text-lg font-black text-slate-900">৳ {Number(purchaseDetails.total_amount || purchaseDetails.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-sm font-semibold text-slate-500">Total Paid:</span>
                                                <span className="text-base font-bold text-emerald-600">৳ {Number(purchaseDetails.paid_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-sm font-semibold text-slate-500">Due Amount:</span>
                                                <span className="text-base font-bold text-rose-600">
                                                    ৳ {Math.max(0, Number(purchaseDetails.total_amount || purchaseDetails.grand_total || 0) - Number(purchaseDetails.paid_amount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {isDeleteModalOpen && (
                <ConfirmDeleteModal item={itemToDelete} onCancel={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} />
            )}
        </AdminLayout>
    );
}
