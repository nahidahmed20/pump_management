import { useState, useEffect } from "react";
import { router, Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import {
    Users, Search, Plus, Edit, Trash2, X, MapPin, Phone,
    Printer, ChevronLeft, ChevronRight, Mail, DownloadCloud
} from "lucide-react";

export default function PartyIndex({ parties, accounts = [], filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [activeTab, setActiveTab] = useState(filters?.type || "all");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data, setData, post, put, reset, errors, processing, clearErrors } = useForm({
        id: "",
        name: "",
        type: "customer",
        phone: "",
        email: "",
        address: "",
        account_id: "",
    });

    // Auto trigger search when filters change
    useEffect(() => {
        const timer = setTimeout(() => {
            const query = { search: searchTerm, per_page: perPage };
            if (activeTab !== "all") query.type = activeTab;

            router.get("/admin/parties", query, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, activeTab, perPage]);

    const openAddModal = () => {
        setIsEditMode(false);
        clearErrors();
        setData({
            id: "",
            name: "",
            type: "customer",
            phone: "",
            email: "",
            address: "",
            account_id: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (party) => {
        setIsEditMode(true);
        clearErrors();
        setData({
            id: party.id,
            name: party.name,
            type: party.type,
            phone: party.phone || "",
            email: party.email || "",
            address: party.address || "",
            account_id: party.account_id || "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(`/admin/parties/${data.id}`, {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        setIsModalOpen(false);
                        Swal.fire({ icon: "success", title: "Updated!", text: "Party has been updated.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
            });
        } else {
            post("/admin/parties", {
                onSuccess: (page) => {
                    if (Object.keys(page.props.errors || {}).length === 0) {
                        setIsModalOpen(false);
                        Swal.fire({ icon: "success", title: "Saved!", text: "New party has been added.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
            });
        }
    };

    const handleDeleteClick = (party) => {
        setItemToDelete(party);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/parties/${itemToDelete.id}`, {
                onSuccess: (page) => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    if(Object.keys(page.props.errors || {}).length === 0) {
                        Swal.fire({ icon: "success", title: "Deleted!", text: "Party has been deleted.", timer: 1500, showConfirmButton: false, customClass: { popup: 'rounded-2xl' } });
                    }
                },
                onError: (errors) => {
                    setIsDeleteModalOpen(false);
                    Swal.fire({ icon: 'error', title: 'Cannot Delete', text: Object.values(errors)[0], customClass: { popup: 'rounded-2xl' } });
                }
            });
        }
    };

    // Export to Excel (CSV format)
    const exportToExcel = () => {
        if (parties.data.length === 0) {
            Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export." });
            return;
        }

        const headers = ["Name", "Type", "Phone", "Email", "Address\n"];
        const rows = parties.data.map(p =>
            `"${p.name}","${p.type.toUpperCase()}","${p.phone || 'N/A'}","${p.email || 'N/A'}","${(p.address || 'N/A').replace(/"/g, '""')}"\n`
        );

        const blob = new Blob([...headers, ...rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Parties_List_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getTypeDetails = (type) => {
        switch(type) {
            case 'customer': return { color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
            case 'supplier': return { color: 'text-blue-700 bg-blue-50 border-blue-200' };
            case 'borrower': return { color: 'text-amber-700 bg-amber-50 border-amber-200' };
            case 'staff': return { color: 'text-purple-700 bg-purple-50 border-purple-200' };
            default: return { color: 'text-slate-700 bg-slate-50 border-slate-200' };
        }
    };

    return (
        <AdminLayout title="Customers & Suppliers" icon={Users}>
            <Head title="Party Directory | FuelDesk" />

            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Party Directory</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage all your customers, suppliers, borrowers, and staff.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToExcel} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95">
                            <DownloadCloud size={18} /> Excel
                        </button>

                        <button onClick={() => window.print()} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print
                        </button>

                        <button onClick={openAddModal} className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95">
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> Add New Party
                        </button>
                    </div>
                </div>

                {/* Tabs & Filters */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden">

                    {/* Modern Tabs */}
                    <div className="flex flex-wrap bg-slate-50 p-1.5 rounded-xl gap-1 border border-slate-100">
                        {['all', 'customer', 'supplier', 'borrower', 'staff'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                                    activeTab === tab
                                    ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                }`}
                            >
                                {tab === 'all' ? 'All Parties' : tab + 's'}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span>Show</span>
                            <select value={perPage} onChange={(e) => setPerPage(e.target.value)} className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500">
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value="all">All</option>
                            </select>
                        </div>

                        <div className="relative w-full xl:w-72">
                            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search name or phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <table className="w-full min-w-[850px] text-left text-sm text-slate-700">
                        <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-2xl">Name & Details</th>
                                <th className="px-6 py-4">Party Type</th>
                                <th className="px-6 py-4">Contact Info</th>
                                <th className="px-6 py-4 text-center rounded-tr-2xl print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {parties.data.length > 0 ? (
                                parties.data.map((party) => {
                                    const typeColors = getTypeDetails(party.type);
                                    return (
                                        <tr key={party.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold shadow-sm border border-slate-200 uppercase">
                                                        {party.name.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-base">{party.name}</div>
                                                        {party.address && <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1"><MapPin size={12}/> {party.address}</div>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase border ${typeColors.color} print:border print:text-black`}>
                                                    {party.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                    <Phone size={14} className="text-slate-400"/> {party.phone || <span className="text-slate-300 italic font-normal">N/A</span>}
                                                </div>
                                                {party.email && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                        <Mail size={13} className="text-slate-400"/> {party.email}
                                                    </div>
                                                )}
                                            </td>
                                            {/* Action Buttons Updated Here */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(party)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(party)}
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
                                <tr>
                                    <td colSpan="4" className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Users size={40} className="text-slate-200" />
                                            <p className="font-medium text-slate-500">No parties found matching your criteria.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {parties.links && parties.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{parties.from || 0}</span> to <span className="font-bold text-slate-800">{parties.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{parties.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {parties.links.map((link, idx) => {
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

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Users size={20} />
                                </div>
                                {isEditMode ? "Edit Party Details" : "Register New Party"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Party Name <span className="text-rose-500">*</span></label>
                                    <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" placeholder="e.g. Padma Oil Co. or John Doe" />
                                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Party Type <span className="text-rose-500">*</span></label>
                                    <select value={data.type} onChange={e => setData('type', e.target.value)} required className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="customer">Customer</option>
                                        <option value="supplier">Supplier</option>
                                        <option value="borrower">Borrower</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Contact Number</label>
                                    <input type="text" value={data.phone} onChange={e => setData('phone', e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" placeholder="e.g. 017..." />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Default Account (Optional)</label>
                                    <select value={data.account_id} onChange={e => setData('account_id', e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm">
                                        <option value="">-- No Default Account / Select Later --</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.type.replace('_', ' ')})</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Selecting an account here helps autocomplete during transactions.</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Address</label>
                                    <textarea value={data.address} onChange={e => setData('address', e.target.value)} rows="2" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm" placeholder="Enter physical address..."></textarea>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95">Cancel</button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 disabled:opacity-50">
                                    {processing ? 'Saving...' : 'Save Party'}
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
