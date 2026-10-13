import { useState, useRef } from "react";
import { Head, useForm, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    Settings, Upload, Save, Building2, Phone, Mail,
    MapPin, FileText, Receipt, CircleDollarSign, X, ShieldCheck,
    MessageSquare, Send, Key, Sparkles, CheckCircle2, History
} from "lucide-react";

export default function SettingIndex({ setting }) {
    const [logoPreview, setLogoPreview] = useState(setting.logo_url || null);
    const fileInputRef = useRef(null);

    const [showTestModal, setShowTestModal] = useState(false);
    const [testPhone, setTestPhone] = useState("");
    const [testingSms, setTestingSms] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        company_name: setting.company_name || "",
        company_phone: setting.company_phone || "",
        company_email: setting.company_email || "",
        company_address: setting.company_address || "",
        currency_symbol: setting.currency_symbol || "৳",
        invoice_terms: setting.invoice_terms || "",
        receipt_footer: setting.receipt_footer || "",
        sms_enabled: setting.sms_enabled || "0",
        sms_provider: setting.sms_provider || "greenweb",
        sms_api_key: setting.sms_api_key || "",
        sms_sender_id: setting.sms_sender_id || "",
        sms_credit_sale_notify: setting.sms_credit_sale_notify || "1",
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

    const handleSendTestSms = (e) => {
        e.preventDefault();
        if (!testPhone.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Phone Required',
                text: 'Please enter a valid mobile number (e.g. 017XXXXXXXX).',
                customClass: { popup: 'rounded-2xl' }
            });
            return;
        }

        setTestingSms(true);
        router.post("/admin/settings/test-sms", {
            phone: testPhone
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setTestingSms(false);
                setShowTestModal(false);
                setTestPhone("");
                Swal.fire({
                    icon: "success",
                    title: "Test SMS Dispatched!",
                    text: "Test SMS was delivered / logged successfully.",
                    timer: 2000,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-2xl' }
                });
            },
            onError: (err) => {
                setTestingSms(false);
                Swal.fire({
                    icon: "error",
                    title: "SMS Delivery Failed",
                    text: Object.values(err)[0] || "Failed to dispatch SMS. Check API key.",
                    customClass: { popup: 'rounded-2xl' }
                });
            }
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
                        <p className="text-sm text-slate-500 mt-1">Manage your company branding, contact details, SMS gateway, and invoice templates.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/sms-logs"
                            className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 active:scale-95"
                        >
                            <History size={16} /> SMS Logs
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-7 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                            <Save size={18} /> Save All Changes
                        </button>
                    </div>
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
                                    className="relative flex h-28 min-w-[120px] max-w-[220px] shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white p-2 shadow-sm transition-all hover:border-amber-500 hover:bg-amber-50/30 group"
                                >
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Logo"
                                            className="max-h-full max-w-full object-contain"
                                            onError={() => setLogoPreview(null)}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-slate-400 group-hover:text-amber-600 transition-colors py-2 px-4">
                                            <Upload size={24} className="mb-1" />
                                            <span className="text-[11px] font-bold uppercase tracking-wider">Click to Upload</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoChange} className="hidden" />
                                </div>

                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-800">Company Logo</h4>
                                    <p className="text-xs text-slate-500">Appears on sidebar, printouts, DSR reports, and customer bills. Recommended: PNG or SVG with transparent background.</p>
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

                        {/* SMS GATEWAY SETTINGS SECTION */}
                        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                                        <MessageSquare size={16} />
                                    </div>
                                    SMS Gateway & Instant Alerts (এসএমএস গেটওয়ে)
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowTestModal(true)}
                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-200 self-start sm:self-auto"
                                >
                                    <Send size={13} /> Test SMS Gateway
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">SMS Service Status</label>
                                        <select
                                            value={data.sms_enabled}
                                            onChange={e => setData('sms_enabled', e.target.value)}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                                        >
                                            <option value="1">Enabled (সক্রিয়)</option>
                                            <option value="0">Disabled (নিষ্ক্রিয়)</option>
                                        </select>
                                        <p className="text-xs text-slate-400 mt-1.5 font-medium">When disabled, dispatches are logged as simulated.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">SMS Gateway Provider</label>
                                        <select
                                            value={data.sms_provider}
                                            onChange={e => setData('sms_provider', e.target.value)}
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                                        >
                                            <option value="greenweb">Greenweb Bangladesh (api.greenweb.com.bd)</option>
                                            <option value="mimsms">MimSMS (api.mimsms.com)</option>
                                            <option value="generic">Generic BD Gateway (HTTP API)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                                            <Key size={14} className="text-slate-400" /> Gateway API Token / Key
                                        </label>
                                        <input
                                            type="text"
                                            value={data.sms_api_key}
                                            onChange={e => setData('sms_api_key', e.target.value)}
                                            placeholder="Enter your gateway API token"
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-mono text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            Sender ID / Masking (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={data.sms_sender_id}
                                            onChange={e => setData('sms_sender_id', e.target.value)}
                                            placeholder="e.g. 8809612... or Brand Name"
                                            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="sms_credit_sale_notify"
                                        checked={data.sms_credit_sale_notify === "1"}
                                        onChange={e => setData('sms_credit_sale_notify', e.target.checked ? "1" : "0")}
                                        className="h-4 w-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <label htmlFor="sms_credit_sale_notify" className="text-sm cursor-pointer select-none">
                                        <span className="font-bold text-slate-800 block">বাকিতে জ্বালানি বিক্রয় হলে স্বয়ংক্রিয় SMS পাঠান (Credit Sale Auto SMS)</span>
                                        <span className="text-xs text-slate-500 mt-0.5 block">
                                            গাড়ি বা কাস্টমারের বাকিতে সেল ভাউচার তৈরি হওয়া মাত্র গাড়ির মালিকের মোবাইলে স্লিপ নম্বর, টাকার পরিমাণ ও বকেয়ার বিবরণী সহ SMS চলে যাবে।
                                        </span>
                                    </label>
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

                        {/* Quick Tips Box */}
                        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-transparent p-5 space-y-3">
                            <h4 className="text-sm font-bold text-amber-900 flex items-center gap-2">
                                <Sparkles size={16} className="text-amber-600" /> Multi-Branch Awareness
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Settings configured here apply strictly to the currently selected active branch. If operating multiple pump stations, each branch can maintain independent SMS credentials and company branding.
                            </p>
                        </div>
                    </div>

                </div>
            </form>

            {/* Test SMS Modal */}
            {showTestModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                <Send size={16} className="text-emerald-600" /> Test SMS Dispatch
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowTestModal(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSendTestSms} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Recipient Mobile Number (মোবাইল নম্বর)
                                </label>
                                <input
                                    type="text"
                                    value={testPhone}
                                    onChange={e => setTestPhone(e.target.value)}
                                    placeholder="e.g. 01712345678"
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                    required
                                    autoFocus
                                />
                                <p className="text-[11px] text-slate-400 mt-1">
                                    A quick confirmation message will be sent to test gateway connectivity.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTestModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={testingSms}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
                                >
                                    {testingSms ? "Sending..." : "Send Test SMS"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
