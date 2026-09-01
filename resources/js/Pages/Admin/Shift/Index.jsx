import { useState, useEffect } from "react";
import { useForm, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Plus, Search, Edit, Trash2, X, Activity, Clock, ShieldCheck,
    ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Printer, DownloadCloud, CheckCircle2, Eye
} from "lucide-react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function ShiftIndex({ shifts, users, filters, errors: serverErrors }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShift, setEditingShift] = useState(null);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        if (serverErrors?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Cannot Open Shift',
                text: serverErrors.error,
                timer: 2000,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            });
        }
    }, [serverErrors]);

    const formatForInput = (dateString) => {
        if (!dateString) return new Date().toISOString().slice(0, 16);
        return new Date(dateString).toISOString().slice(0, 16);
    };

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        user_id: "",
        start_time: formatForInput(null),
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/shifts",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = (shift = null) => {
        clearErrors();
        if (shift) {
            setEditingShift(shift);
            setData({
                user_id: shift.user_id || "",
                start_time: formatForInput(shift.start_time),
            });
        } else {
            setEditingShift(null);
            setData({
                user_id: "",
                start_time: formatForInput(null),
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingShift(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingShift) {
            put(`/admin/shifts/${editingShift.id}`, {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Updated!",
                        text: "Shift updated successfully.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        } else {
            post("/admin/shifts", {
                onSuccess: (page) => {
                    if (!page.props.errors?.error) {
                        closeModal();
                        Swal.fire({
                            icon: "success",
                            title: "Shift Started!",
                            text: "New shift has been opened.",
                            timer: 1500,
                            showConfirmButton: false,
                            customClass: { popup: 'rounded-2xl' }
                        });
                    }
                },
            });
        }
    };

    const handleDeleteClick = (shift) => {
        setItemToDelete(shift);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/shifts/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: "Shift deleted successfully.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        }
    };

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleCloseShift = (shiftId) => {
        Swal.fire({
            title: "Close this Shift?",
            text: "Are you sure you want to close this shift? Total sales will be calculated automatically.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#10b981",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "Yes, Close Shift!",
            customClass: { popup: 'rounded-2xl' }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(`/admin/shifts/${shiftId}/close`, {}, {
                    onSuccess: () => {
                        Swal.fire({
                            icon: "success",
                            title: "Shift Closed!",
                            text: "The shift has been successfully closed.",
                            timer: 1500,
                            showConfirmButton: false,
                            customClass: { popup: 'rounded-2xl' }
                        });
                    }
                });
            }
        });
    };

    // Exports
    const exportToCSV = () => {
        const headers = ["Shift ID,Operator,Start Time,End Time,Total Sales,Status\n"];
        const rows = shifts.data.map(
            (s) => `#SHF-${s.id},"${s.user?.name || 'N/A'}","${s.start_time}","${s.end_time || 'Running'}",${s.total_sales || 0},${s.status}\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Shifts_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    return (
        <AdminLayout title="Shift Management" icon={Activity}>
            <Head title="Daily Shifts | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Daily Operations & Shifts</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage open/close shifts and assign operators.</p>
                    </div>
                    <div>
                        <button onClick={() => openModal()} className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95">
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> Start New Shift
                        </button>
                    </div>
                </div>

                {/* Filter Bar with Exports */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value="all">All</option>
                            </select>
                            <span>entries</span>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                            <button onClick={exportToCSV} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-blue-50 hover:text-blue-600">
                                <DownloadCloud size={15} /> CSV
                            </button>
                            <button onClick={exportToCSV} className="flex h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-bold text-slate-600 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-600">
                                <FileSpreadsheet size={15} /> Excel
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
                            placeholder="Search by Shift ID or Operator..."
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
                                <th className="px-6 py-4 rounded-tl-2xl">Shift ID</th>
                                <th className="px-6 py-4">Operator / Manager</th>
                                <th className="px-6 py-4">Timing (Start - End)</th>
                                <th className="px-6 py-4 text-right">Total Sales (৳)</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right rounded-tr-2xl print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {shifts?.data?.length > 0 ? (
                                shifts.data.map((shift) => (
                                    <tr key={shift.id} className="transition-colors hover:bg-slate-50/50 group">
                                        <td className="px-6 py-4 font-bold text-slate-900 text-base">
                                            #SHF-{shift.id.toString().padStart(4, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 font-bold shadow-sm">
                                                    {shift.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-bold text-slate-800">{shift.user?.name || "Unknown Operator"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                                <Clock size={14} className="text-slate-400" />
                                                {formatDate(shift.start_time)}
                                            </div>
                                            <div className="text-xs font-medium text-slate-500 mt-0.5 ml-5">
                                                to {shift.end_time ? formatDate(shift.end_time) : <span className="text-emerald-600 font-bold animate-pulse">Running...</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-slate-900 text-base">
                                            <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(shift.total_sales)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {shift.status === 'open' ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-600 border border-emerald-200 shadow-sm">
                                                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Open (Live)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-bold uppercase text-slate-500 border border-slate-200">
                                                    <CheckCircle2 size={14} /> Closed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right print:hidden">
                                            <div className="flex items-center justify-end gap-2">
                                                {shift.status === 'open' && (
                                                    <button onClick={() => handleCloseShift(shift.id)} className="flex h-9 items-center justify-center gap-1.5 px-3 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-sm transition-all hover:bg-amber-100 active:scale-95" title="Close Shift">
                                                        <ShieldCheck size={14} /> Close
                                                    </button>
                                                )}
                                                <Link href={`/admin/shifts/${shift.id}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-500 shadow-sm transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 active:scale-95" title="View Details">
                                                    <Eye size={16} />
                                                </Link>
                                                <button
                                                    onClick={() => openModal(shift)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(shift)}
                                                    className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Clock size={40} className="text-slate-200" />
                                            <p className="font-medium text-slate-500">No shifts recorded. Start a new shift to begin!</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {shifts?.links && shifts.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{shifts.from || 0}</span> to <span className="font-bold text-slate-800">{shifts.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{shifts.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {shifts.links.map((link, idx) => {
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

            {/* CREATE/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Activity size={20} />
                                </div>
                                {editingShift ? "Edit Shift Details" : "Start New Shift"}
                            </h3>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Shift Operator / Manager <span className="text-rose-500">*</span></label>
                                <select
                                    value={data.user_id}
                                    onChange={(e) => setData("user_id", e.target.value)}
                                    required
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm"
                                >
                                    <option value="">-- Select Operator --</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                                {errors.user_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.user_id}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Start Date & Time <span className="text-rose-500">*</span></label>
                                <input
                                    type="datetime-local"
                                    value={data.start_time}
                                    onChange={(e) => setData("start_time", e.target.value)}
                                    required
                                    className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm"
                                />
                                {errors.start_time && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.start_time}</p>}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 disabled:opacity-50">
                                    {editingShift ? "Save Changes" : "Start Shift"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
