import { useState, useRef } from "react";
import { Head, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Settings, Upload, Save, Building2, Phone, Mail,
    MapPin, FileText, Receipt, CircleDollarSign, X, ShieldCheck
} from "lucide-react";

export default function SettingIndex({ setting }) {
    const [logoPreview, setLogoPreview] = useState(setting.logo_url || null);
    const fileInputRef = useRef(null);

    const { data, setData, post, processing, errors } = useForm({
        company_name: setting.company_name || "",
        company_phone: setting.company_phone || "",
        company_email: setting.company_email || "",
        company_address: setting.company_address || "",
        currency_symbol: setting.currency_symbol || "৳",
        invoice_terms: setting.invoice_terms || "",
        receipt_footer: setting.receipt_footer || "",
        logo: null,
        remove_logo: false,
        _method: "put",
    });

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData((prev) => ({ ...prev, logo: file, remove_logo: false }));
            setLogoPreview((prevUrl) => {
                if (prevUrl && prevUrl.startsWith("blob:")) URL.revokeObjectURL(prevUrl);
                return URL.createObjectURL(file);
            });
        }
    };

    const handleRemoveLogo = () => {
        if (fileInputRef.current) fileInputRef.current.value = "";
        setLogoPreview((prevUrl) => {
            if (prevUrl && prevUrl.startsWith("blob:")) URL.revokeObjectURL(prevUrl);
            return null;
        });
        setData((prev) => ({ ...prev, logo: null, remove_logo: true }));
    };

    const submit = (e) => {
        e.preventDefault();

        post("/admin/settings", {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => Swal.fire({
                icon: "success",
                title: "Settings Saved!",
                text: "System configurations updated successfully.",
                timer: 1500,
                showConfirmButton: false,
                customClass: { popup: 'rounded-2xl' }
            }),
        });
    };

    return (
        <AdminLayout title="System Settings" icon={Settings}>
            <Head title="System Settings | FuelDesk" />

            <form onSubmit={submit} className="mx-auto max-w-5xl space-y-6 pb-12 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">System Configuration</h2>
                        <p className="text-sm text-slate-500 mt-1">Manage your company branding, contact details, and invoice footer texts.</p>
                    </div>
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-7 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        <Save size={18} /> Save All Changes
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN: General Information (Spans 2 cols) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                    <Building2 size={16} />
                                </div>
                                General Information & Branding
                            </h3>

                            {/* Logo Upload Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-4 rounded-xl bg-slate-50 border border-slate-100">
                                <div
                                    onClick={() => fileInputRef.current.click()}
                                    className="relative flex h-24 w-24 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white shadow-sm transition-all hover:border-amber-500 hover:bg-amber-50/30 group"
                                >
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo" className="h-full w-full object-contain p-2" />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400 group-hover:text-amber-600 transition-colors">
                                            <Upload size={20} className="mb-1" />
                                            <span className="text-[10px] font-bold uppercase">Upload</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoChange} className="hidden" />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-800">Company Logo</h4>
                                    <p className="text-xs text-slate-500">Appears on printouts, reports, and PDF invoices. Recommended size: 250x100px.</p>
                                    {errors.logo && <p className="text-xs font-semibold text-rose-500">{errors.logo}</p>}
                                    {logoPreview && (
                                        <button
                                            type="button"
                                            onClick={handleRemoveLogo}
                                            className="inline-flex items-center gap-1.5 pt-1 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors"
                                        >
                                            <X size={14} /> Remove existing logo
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Company Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        value={data.company_name}
                                        onChange={e => setData('company_name', e.target.value)}
                                        required
                                        placeholder="e.g. Surma Filling Station"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.company_name && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.company_name}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Phone size={14} className="text-slate-400"/> Phone Number</label>
                                        <input
                                            type="text"
                                            value={data.company_phone}
                                            onChange={e => setData('company_phone', e.target.value)}
                                            placeholder="e.g. 017..."
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                        />
                                        {errors.company_phone && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.company_phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Mail size={14} className="text-slate-400"/> Email Address</label>
                                        <input
                                            type="email"
                                            value={data.company_email}
                                            onChange={e => setData('company_email', e.target.value)}
                                            placeholder="e.g. info@company.com"
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                        />
                                        {errors.company_email && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.company_email}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> Complete Address</label>
                                    <textarea
                                        rows="2"
                                        value={data.company_address}
                                        onChange={e => setData('company_address', e.target.value)}
                                        placeholder="Enter station physical address..."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    ></textarea>
                                    {errors.company_address && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.company_address}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Invoice & POS Settings */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
                            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5 pb-3 border-b border-slate-100">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                                    <FileText size={16} />
                                </div>
                                Invoice & POS Setup
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                        <CircleDollarSign size={14} className="text-slate-400"/> Currency Symbol
                                    </label>
                                    <input
                                        type="text"
                                        value={data.currency_symbol}
                                        onChange={e => setData('currency_symbol', e.target.value)}
                                        placeholder="e.g. ৳"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    {errors.currency_symbol && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.currency_symbol}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                        <FileText size={14} className="text-slate-400"/> Invoice Terms & Conditions
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={data.invoice_terms}
                                        onChange={e => setData('invoice_terms', e.target.value)}
                                        placeholder="e.g. Goods once sold will not be taken back."
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    ></textarea>
                                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Appears at the bottom of standard A4 invoices.</p>
                                    {errors.invoice_terms && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.invoice_terms}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                        <Receipt size={14} className="text-slate-400"/> POS Receipt Footer Message
                                    </label>
                                    <input
                                        type="text"
                                        value={data.receipt_footer}
                                        onChange={e => setData('receipt_footer', e.target.value)}
                                        placeholder="e.g. Thank you for your business!"
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                                    />
                                    <p className="text-xs text-slate-400 mt-1.5 font-medium">Appears at the bottom of small thermal POS receipts.</p>
                                    {errors.receipt_footer && <p className="mt-1.5 text-xs font-semibold text-rose-500">{errors.receipt_footer}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </form>
        </AdminLayout>
    );
}
