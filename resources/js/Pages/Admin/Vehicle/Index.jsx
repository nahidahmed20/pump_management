import { useState, useEffect } from "react";
import { router, Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";
import {
    Truck, Search, Plus, Edit, Trash2, X, Phone, User,
    ChevronLeft, ChevronRight, CheckCircle2, XCircle, CreditCard, Filter
} from "lucide-react";

export default function VehicleIndex({ vehicles, customers = [], filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [customerFilter, setCustomerFilter] = useState(filters?.party_id || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modal States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const { data, setData, post, put, reset, errors, processing, clearErrors } = useForm({
        id: "",
        party_id: "",
        vehicle_no: "",
        vehicle_type: "Truck",
        driver_name: "",
        driver_phone: "",
        monthly_credit_limit: "0",
        is_active: true,
        notes: "",
    });

    // Auto trigger search & filter
    useEffect(() => {
        const timer = setTimeout(() => {
            const query = { search: searchTerm, per_page: perPage };
            if (customerFilter) query.party_id = customerFilter;

            router.get("/admin/vehicles", query, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, customerFilter, perPage]);

    const openAddModal = () => {
        setIsEditMode(false);
        clearErrors();
        setData({
            id: "",
            party_id: customers.length > 0 ? customers[0].id : "",
            vehicle_no: "",
            vehicle_type: "Truck",
            driver_name: "",
            driver_phone: "",
            monthly_credit_limit: "0",
            is_active: true,
            notes: "",
        });
        setIsModalOpen(true);
    };

    const openEditModal = (vehicle) => {
        setIsEditMode(true);
        clearErrors();
        setData({
            id: vehicle.id,
            party_id: vehicle.party_id,
            vehicle_no: vehicle.vehicle_no,
            vehicle_type: vehicle.vehicle_type || "Truck",
            driver_name: vehicle.driver_name || "",
            driver_phone: vehicle.driver_phone || "",
            monthly_credit_limit: vehicle.monthly_credit_limit || "0",
            is_active: Boolean(vehicle.is_active),
            notes: vehicle.notes || "",
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
        clearErrors();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isEditMode) {
            put(`/admin/vehicles/${data.id}`, {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Updated!",
                        text: "Vehicle details updated successfully.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: "rounded-2xl" },
                    });
                },
            });
        } else {
            post("/admin/vehicles", {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Registered!",
                        text: "New vehicle registered successfully.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: "rounded-2xl" },
                    });
                },
            });
        }
    };

    const handleDeleteClick = (vehicle) => {
        setItemToDelete(vehicle);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/vehicles/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: "Vehicle has been removed.",
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: { popup: "rounded-2xl" },
                    });
                },
            });
        }
    };

    const vehicleList = vehicles?.data || [];
    const totalVehicles = vehicles?.total || vehicleList.length;

    const getVehicleBadge = (type) => {
        switch (type?.toLowerCase()) {
            case "truck":
                return "bg-amber-100 text-amber-800 border-amber-200";
            case "bus":
                return "bg-blue-100 text-blue-800 border-blue-200";
            case "pickup":
                return "bg-emerald-100 text-emerald-800 border-emerald-200";
            case "car":
                return "bg-purple-100 text-purple-800 border-purple-200";
            case "motorcycle":
                return "bg-pink-100 text-pink-800 border-pink-200";
            default:
                return "bg-slate-100 text-slate-800 border-slate-200";
        }
    };

    return (
        <AdminLayout title="Fleet & Vehicle Management" icon={Truck}>
            <Head title="Vehicles | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header Banner */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Truck className="text-amber-500" size={24} />
                            Fleet & Vehicles
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Register corporate fleet vehicles, link credit limits, and monitor fuel slips.
                        </p>
                    </div>
                    <div>
                        <button
                            onClick={openAddModal}
                            className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            <Plus size={18} className="transition-transform group-hover:rotate-90" />
                            Add New Vehicle
                        </button>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
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
                                <option value="all">All</option>
                            </select>
                            <span>entries</span>
                        </div>

                        {/* Customer Filter */}
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Filter size={16} className="text-slate-400" />
                            <select
                                value={customerFilter}
                                onChange={(e) => setCustomerFilter(e.target.value)}
                                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10"
                            >
                                <option value="">All Fleet Customers</option>
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by vehicle no, driver, or client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Vehicles Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/75 text-xs font-bold uppercase text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">#</th>
                                    <th className="px-6 py-4">Vehicle Number & Type</th>
                                    <th className="px-6 py-4">Owner / Customer</th>
                                    <th className="px-6 py-4">Driver Info</th>
                                    <th className="px-6 py-4">Monthly Credit Limit</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {vehicleList.length > 0 ? (
                                    vehicleList.map((v, index) => (
                                        <tr key={v.id} className="hover:bg-slate-50/60 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-400">
                                                {(vehicles.current_page - 1) * vehicles.per_page + index + 1}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-slate-800 text-base">
                                                        {v.vehicle_no}
                                                    </span>
                                                    <span
                                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getVehicleBadge(
                                                            v.vehicle_type
                                                        )}`}
                                                    >
                                                        {v.vehicle_type || "Vehicle"}
                                                    </span>
                                                </div>
                                                {v.notes && (
                                                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">
                                                        {v.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">
                                                    {v.customer?.name || "N/A"}
                                                </div>
                                                {v.customer?.phone && (
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                        <Phone size={12} /> {v.customer.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {v.driver_name ? (
                                                    <div>
                                                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                                                            <User size={13} className="text-slate-400" />
                                                            {v.driver_name}
                                                        </div>
                                                        {v.driver_phone && (
                                                            <div className="text-xs text-slate-500 mt-0.5">
                                                                {v.driver_phone}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-xs italic">Not assigned</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">
                                                ৳ {Number(v.monthly_credit_limit || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {v.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <CheckCircle2 size={12} /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                                        <XCircle size={12} /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(v)}
                                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                        title="Edit Vehicle"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(v)}
                                                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                        title="Delete Vehicle"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                            <Truck size={36} className="mx-auto mb-2 text-slate-300" />
                                            <p className="font-semibold text-slate-600">No vehicles found</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Click "Add New Vehicle" above to register fleet vehicles.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {vehicles?.links && vehicles.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                            <span className="text-xs font-medium text-slate-500">
                                Showing {vehicles.from || 0} to {vehicles.to || 0} of {vehicles.total || 0} vehicles
                            </span>
                            <div className="flex items-center gap-1">
                                {vehicles.links.map((link, idx) => {
                                    if (link.label.includes("Previous")) {
                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url || "#"}
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                                                    !link.url
                                                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                                                        : "border-slate-200 text-slate-600 hover:bg-white hover:text-amber-600"
                                                }`}
                                            >
                                                <ChevronLeft size={16} />
                                            </Link>
                                        );
                                    }
                                    if (link.label.includes("Next")) {
                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url || "#"}
                                                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                                                    !link.url
                                                        ? "border-slate-200 text-slate-300 cursor-not-allowed"
                                                        : "border-slate-200 text-slate-600 hover:bg-white hover:text-amber-600"
                                                }`}
                                            >
                                                <ChevronRight size={16} />
                                            </Link>
                                        );
                                    }
                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url || "#"}
                                            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                                                link.active
                                                    ? "bg-amber-500 text-slate-900 shadow-sm"
                                                    : "text-slate-600 hover:bg-white border border-slate-200"
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create / Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-in zoom-in-95">
                        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Truck className="text-amber-500" size={20} />
                                {isEditMode ? "Edit Vehicle Details" : "Register New Vehicle"}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/60 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Customer / Party */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                    Customer / Fleet Owner <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={data.party_id}
                                    onChange={(e) => setData("party_id", e.target.value)}
                                    className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                    required
                                >
                                    <option value="">Select a customer</option>
                                    {customers.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} {c.phone ? `(${c.phone})` : ""}
                                        </option>
                                    ))}
                                </select>
                                {errors.party_id && (
                                    <p className="text-xs text-rose-500 font-semibold mt-1">{errors.party_id}</p>
                                )}
                            </div>

                            {/* Vehicle No & Type */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Vehicle Number <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. DHAKA METRO TA-11-2233"
                                        value={data.vehicle_no}
                                        onChange={(e) => setData("vehicle_no", e.target.value.toUpperCase())}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium uppercase outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                        required
                                    />
                                    {errors.vehicle_no && (
                                        <p className="text-xs text-rose-500 font-semibold mt-1">{errors.vehicle_no}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Vehicle Type
                                    </label>
                                    <select
                                        value={data.vehicle_type}
                                        onChange={(e) => setData("vehicle_type", e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                    >
                                        <option value="Truck">Truck (ট্রাক)</option>
                                        <option value="Bus">Bus (বাস)</option>
                                        <option value="Pickup">Pickup (পিকআপ)</option>
                                        <option value="Car">Private Car (প্রাইভেট কার)</option>
                                        <option value="Motorcycle">Motorcycle (বাইক)</option>
                                        <option value="Tractor">Tractor (ট্রাক্টর)</option>
                                        <option value="Generator">Generator (জেনারেটর)</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Driver Name & Phone */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Driver Name (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Driver's name"
                                        value={data.driver_name}
                                        onChange={(e) => setData("driver_name", e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Driver Phone (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="017XXXXXXXX"
                                        value={data.driver_phone}
                                        onChange={(e) => setData("driver_phone", e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                    />
                                </div>
                            </div>

                            {/* Monthly Credit Limit & Status */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Monthly Credit Limit (৳)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="any"
                                        placeholder="0.00"
                                        value={data.monthly_credit_limit}
                                        onChange={(e) => setData("monthly_credit_limit", e.target.value)}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={data.is_active ? "1" : "0"}
                                        onChange={(e) => setData("is_active", e.target.value === "1")}
                                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                    >
                                        <option value="1">Active</option>
                                        <option value="0">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">
                                    Notes / Remarks
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Any notes about this vehicle or fuel slip rules..."
                                    value={data.notes}
                                    onChange={(e) => setData("notes", e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="h-11 px-5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="h-11 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 font-bold text-slate-900 shadow-md shadow-amber-500/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {processing ? "Saving..." : isEditMode ? "Save Changes" : "Register Vehicle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Vehicle"
                message={`Are you sure you want to remove vehicle "${itemToDelete?.vehicle_no}"?`}
            />
        </AdminLayout>
    );
}

