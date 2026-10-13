import { useState, useEffect } from "react";
import { router, Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    MessageSquare, Search, RefreshCw, Trash2, Calendar, Settings,
    Send, CheckCircle2, AlertTriangle, Info, Eye, X, Phone, Layers
} from "lucide-react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function SmsLogIndex({ logs, stats, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(filters?.status || "");
    const [purposeFilter, setPurposeFilter] = useState(filters?.purpose || "");
    const [dateFilter, setDateFilter] = useState(filters?.date || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 15);

    const [selectedLog, setSelectedLog] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [resendingId, setResendingId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/sms-logs",
                {
                    search: searchTerm,
                    status: statusFilter,
                    purpose: purposeFilter,
                    date: dateFilter,
                    per_page: perPage,
                },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, statusFilter, purposeFilter, dateFilter, perPage]);

    const handleResend = (log) => {
        setResendingId(log.id);
        router.post(`/admin/sms-logs/${log.id}/resend`, {}, {
            preserveScroll: true,
            onFinish: () => setResendingId(null),
            onSuccess: () => {
                Swal.fire({
                    icon: "success",
                    title: "SMS Resent",
                    text: `SMS re-dispatched to ${log.recipient_phone}`,
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: "rounded-2xl" },
                });
            },
            onError: () => {
                Swal.fire({
                    icon: "error",
                    title: "Failed",
                    text: "Could not resend SMS. Check gateway credentials.",
                    customClass: { popup: "rounded-2xl" },
                });
            },
        });
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;
        router.delete(`/admin/sms-logs/${itemToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
                Swal.fire({
                    icon: "success",
                    title: "Deleted",
                    text: "SMS log deleted successfully.",
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: "rounded-2xl" },
                });
            },
        });
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "sent":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={12} /> Sent
                    </span>
                );
            case "failed":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle size={12} /> Failed
                    </span>
                );
            case "simulated":
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Info size={12} /> Simulated
                    </span>
                );
        }
    };

    const getPurposeBadge = (purpose) => {
        switch (purpose) {
            case "credit_sale":
                return (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Credit Sale Alert
                    </span>
                );
            case "test":
                return (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Test SMS
                    </span>
                );
            default:
                return (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        General
                    </span>
                );
        }
    };

    return (
        <AdminLayout title="SMS Gateway History & Logs" icon={MessageSquare}>
            <Head title="SMS History & Logs | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Top Header & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">SMS Gateway History & Logs</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Track automated credit fueling notifications, customer alerts, and gateway dispatches.
                        </p>
                    </div>
                    <Link
                        href="/admin/settings"
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Settings size={17} /> Gateway Configuration
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                            <Layers size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Filtered</p>
                            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.total}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                            <CheckCircle2 size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivered</p>
                            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">{stats.sent}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shrink-0">
                            <AlertTriangle size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Failed</p>
                            <h3 className="text-2xl font-black text-rose-600 mt-0.5">{stats.failed}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
                            <Info size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulated</p>
                            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{stats.simulated}</h3>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3.5 top-3 text-slate-400" size={17} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search phone or text content..."
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                            />
                        </div>

                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-amber-500 focus:bg-white"
                            >
                                <option value="">All Statuses</option>
                                <option value="sent">Delivered (Sent)</option>
                                <option value="failed">Failed</option>
                                <option value="simulated">Simulated</option>
                            </select>
                        </div>

                        <div>
                            <select
                                value={purposeFilter}
                                onChange={(e) => setPurposeFilter(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition-all focus:border-amber-500 focus:bg-white"
                            >
                                <option value="">All Purposes</option>
                                <option value="credit_sale">Credit Sale Alert</option>
                                <option value="test">Test SMS</option>
                                <option value="general">General</option>
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
                                    <th className="px-5 py-4"># ID</th>
                                    <th className="px-5 py-4">Recipient Phone</th>
                                    <th className="px-5 py-4">Purpose</th>
                                    <th className="px-5 py-4">Message Content</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Dispatched At</th>
                                    <th className="px-5 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {logs.data && logs.data.length > 0 ? (
                                    logs.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-5 py-4 font-mono font-bold text-slate-400 text-xs">
                                                #{log.id}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 font-bold">
                                                        <Phone size={13} />
                                                    </div>
                                                    <span className="font-mono font-bold text-slate-800">
                                                        {log.recipient_phone}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                {getPurposeBadge(log.purpose)}
                                            </td>
                                            <td className="px-5 py-4 max-w-xs">
                                                <p className="truncate text-xs font-medium text-slate-600" title={log.message}>
                                                    {log.message}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                {getStatusBadge(log.status)}
                                            </td>
                                            <td className="px-5 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleString("en-GB", {
                                                    dateStyle: "medium",
                                                    timeStyle: "short",
                                                })}
                                            </td>
                                            <td className="px-5 py-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleResend(log)}
                                                        disabled={resendingId === log.id}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors disabled:opacity-50"
                                                        title="Resend SMS"
                                                    >
                                                        <RefreshCw size={14} className={resendingId === log.id ? "animate-spin text-emerald-600" : ""} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setItemToDelete(log);
                                                            setIsDeleteModalOpen(true);
                                                        }}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="py-12 text-center text-slate-400">
                                            <MessageSquare size={44} className="mb-2 mx-auto opacity-20" />
                                            <p className="font-semibold text-slate-600">No SMS records found</p>
                                            <p className="text-xs text-slate-400 mt-1">Dispatches triggered via credit fueling or testing will appear here.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {logs.links && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
                            <div>
                                Showing <span className="font-bold text-slate-800">{logs.from || 0}</span> to{" "}
                                <span className="font-bold text-slate-800">{logs.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{logs.total}</span> entries
                            </div>
                            <div className="flex flex-wrap items-center gap-1">
                                {logs.links.map((link, idx) => (
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

            {/* View Details Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <MessageSquare size={17} className="text-emerald-600" />
                                SMS Dispatch Detail (#{selectedLog.id})
                            </h3>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Recipient</span>
                                    <span className="font-mono font-bold text-slate-800">{selectedLog.recipient_phone}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Status</span>
                                    {getStatusBadge(selectedLog.status)}
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Purpose</span>
                                    <span className="font-semibold text-slate-700 capitalize">{selectedLog.purpose}</span>
                                </div>
                                <div>
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Timestamp</span>
                                    <span className="text-xs text-slate-600">
                                        {new Date(selectedLog.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Message Content</label>
                                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed font-sans whitespace-pre-wrap select-all">
                                    {selectedLog.message}
                                </div>
                            </div>

                            {selectedLog.response_data && (
                                <div>
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 block">Gateway Response / Diagnostics</label>
                                    <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-36">
                                        {selectedLog.response_data}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    handleResend(selectedLog);
                                    setSelectedLog(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                            >
                                <Send size={13} /> Resend Now
                            </button>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Close
                            </button>
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

