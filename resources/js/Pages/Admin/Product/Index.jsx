import { useState, useEffect } from "react";
import { useForm, router, Link, Head } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Plus, Search, Edit, Trash2, X, Boxes, Tag,
    ChevronLeft, ChevronRight, DownloadCloud,
    FileSpreadsheet, FileText, Printer, CheckCircle2, XCircle
} from "lucide-react";
import ConfirmDeleteModal from "@/Components/ConfirmDeleteModal";

export default function ProductIndex({ products, categories, filters }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Inertia Form State
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        category_id: "",
        name: "",
        unit: "Ltr",
        buying_price: "",
        selling_price: "",
        is_active: true,
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(
                "/admin/products",
                { search: searchTerm, per_page: perPage },
                { preserveState: true, replace: true }
            );
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, perPage]);

    const openModal = (product = null) => {
        clearErrors();
        if (product) {
            setEditingProduct(product);
            setData({
                category_id: product.category_id || "",
                name: product.name || "",
                unit: product.unit || "Ltr",
                buying_price: product.buying_price || "",
                selling_price: product.selling_price || "",
                is_active: product.is_active !== undefined ? !!product.is_active : true,
            });
        } else {
            setEditingProduct(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingProduct) {
            put(`/admin/products/${editingProduct.id}`, {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Updated!",
                        text: "Product updated successfully.",
                        timer: 1500,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        } else {
            post("/admin/products", {
                onSuccess: () => {
                    closeModal();
                    Swal.fire({
                        icon: "success",
                        title: "Created!",
                        text: "Product created successfully.",
                        timer: 1500,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        }
    };

    const handleDeleteClick = (product) => {
        setItemToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            router.delete(`/admin/products/${itemToDelete.id}`, {
                onSuccess: () => {
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: "Product deleted successfully.",
                        timer: 1500,
                        timerProgressBar: true,
                        showConfirmButton: false,
                        customClass: { popup: 'rounded-2xl' }
                    });
                },
            });
        }
    };

    // Export Functions
    const exportToCSV = () => {
        const headers = ["Product Name,Category,Unit,Buying Price,Selling Price,Current Stock,Status\n"];
        const rows = products.data.map(p => [
            `"${p.name}"`,
            `"${p.category?.name || 'N/A'}"`,
            `"${p.unit}"`,
            `${p.buying_price}`,
            `${p.selling_price}`,
            `${p.current_stock || 0}`,
            `"${p.is_active ? 'Active' : 'Inactive'}"`
        ]);

        const csvContent = headers.join(",") + rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Products_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    return (
        <AdminLayout title="Product Management" icon={Boxes}>
            <Head title="Products & Inventory | FuelDesk" />

            <div className="space-y-6 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Products Inventory</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage fuels, gas, lubes, and general items inside your station.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToCSV} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95">
                            <DownloadCloud size={18} /> CSV
                        </button>

                        <button onClick={() => window.print()} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print
                        </button>

                        <button onClick={() => openModal()} className="group flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-5 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95">
                            <Plus size={18} className="transition-transform group-hover:rotate-90" /> Add Product
                        </button>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden">
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

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search products..."
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
                                <th className="px-6 py-4 rounded-tl-2xl">Product Info</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4 text-right">Buying Price</th>
                                <th className="px-6 py-4 text-right">Selling Price</th>
                                <th className="px-6 py-4 text-center">Current Stock</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-right rounded-tr-2xl print:hidden">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.data.length > 0 ? (
                                products.data.map((product) => {
                                    // Added a subtle color badge based on product type if available through category
                                    const catType = product.category?.type || 'general';
                                    const typeColor =
                                        catType === 'fuel' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                        catType === 'gas' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                                        catType === 'lube' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-blue-50 text-blue-700 border-blue-200';

                                    return (
                                        <tr key={product.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 text-base">{product.name}</div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">Sold in: <span className="font-bold">{product.unit}</span></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold uppercase border shadow-sm ${typeColor}`}>
                                                    <Tag size={12} /> {product.category?.name || "N/A"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-600">
                                                <span style={{ fontFamily: 'Arial' }} className="text-slate-400 font-normal mr-1">৳</span>
                                                {formatMoney(product.buying_price)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">
                                                <span style={{ fontFamily: 'Arial' }} className="text-emerald-400 font-normal mr-1">৳</span>
                                                {formatMoney(product.selling_price)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center justify-center min-w-[4rem] rounded-full px-3 py-1 font-black border ${
                                                    product.current_stock > 10 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                    {Number(product.current_stock || 0).toFixed(2)} {product.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {product.is_active ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                                                        <CheckCircle2 size={14} /> Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-500">
                                                        <XCircle size={14} /> Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openModal(product)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-amber-600"
                                                        title="Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(product)}
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
                                    <td colSpan="7" className="py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Boxes size={40} className="text-slate-200" />
                                            <p className="font-medium text-slate-500">No products found in inventory.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {products.links && products.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{products.from || 0}</span> to <span className="font-bold text-slate-800">{products.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{products.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {products.links.map((link, idx) => {
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
                            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                                    <Boxes size={20} />
                                </div>
                                {editingProduct ? "Edit Product Details" : "Add New Product"}
                            </h3>
                            <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-100 hover:text-rose-600">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Category <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.category_id}
                                        onChange={(e) => setData("category_id", e.target.value)}
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 cursor-pointer shadow-sm"
                                    >
                                        <option value="">-- Select Category --</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name} ({cat.type.toUpperCase()})</option>
                                        ))}
                                    </select>
                                    {errors.category_id && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.category_id}</p>}
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Product Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData("name", e.target.value)}
                                        placeholder="e.g. Premium Octane"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.name && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.name}</p>}
                                </div>

                                {/* Unit (Added m3 for Gas) */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Selling Unit <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                        {["Ltr", "Kg", "m³", "Pcs", "Ctn"].map((u) => (
                                            <label key={u} className={`flex items-center justify-center h-11 rounded-xl border cursor-pointer font-bold text-sm transition-all ${data.unit === u ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20' : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white'}`}>
                                                <input type="radio" name="unit" value={u} checked={data.unit === u} onChange={(e) => setData('unit', e.target.value)} className="hidden" />
                                                {u}
                                            </label>
                                        ))}
                                    </div>
                                    {errors.unit && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.unit}</p>}
                                </div>

                                {/* Buying Price */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Buying Price (৳) <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.buying_price}
                                        onChange={(e) => setData("buying_price", e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.buying_price && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.buying_price}</p>}
                                </div>

                                {/* Selling Price */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (৳) <span className="text-rose-500">*</span></label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={data.selling_price}
                                        onChange={(e) => setData("selling_price", e.target.value)}
                                        placeholder="0.00"
                                        className="h-12 w-full rounded-xl border border-amber-300 bg-amber-50 px-4 text-lg font-black text-slate-900 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/20 shadow-sm"
                                    />
                                    {errors.selling_price && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.selling_price}</p>}
                                </div>

                                {/* Is Active Toggle */}
                                <div className="md:col-span-2 pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} />
                                            <div className={`block h-7 w-12 rounded-full transition-colors ${data.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                            <div className={`dot absolute left-1 top-1 h-5 w-5 rounded-full bg-white transition-transform ${data.is_active ? 'translate-x-5' : ''}`}></div>
                                        </div>
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
                                            Product is currently Active
                                        </span>
                                    </label>
                                </div>

                            </div>

                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                                <button type="button" onClick={closeModal} className="h-11 px-6 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 active:scale-95">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing} className="h-11 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 active:scale-95 disabled:opacity-50">
                                    {editingProduct ? "Save Changes" : "Add Product"}
                                </button>
                            </div>
                        </form>
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
