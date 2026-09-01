import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Activity, Clock, ArrowLeft, CheckCircle2, User, Gauge, ShoppingCart } from "lucide-react";

export default function ShiftShow({ shift }) {
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    return (
        <AdminLayout title={`Shift Details #SHF-${shift.id}`} icon={Activity}>
            <Head title={`Shift #${shift.id} | FuelDesk`} />

            <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">

                {/* Back Button & Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/shifts" className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Shift #SHF-{shift.id.toString().padStart(4, '0')}</h2>
                            <p className="text-sm text-slate-500 mt-0.5">Detailed breakdown of sales, collections, and meter readings.</p>
                        </div>
                    </div>
                    <div>
                        {shift.status === 'open' ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold uppercase text-emerald-600 border border-emerald-200 shadow-sm">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span> Open (Live)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold uppercase text-slate-600 border border-slate-200">
                                <CheckCircle2 size={14} /> Closed
                            </span>
                        )}
                    </div>
                </div>

                {/* Shift Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                            <User size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Operator / Manager</p>
                            <p className="text-lg font-extrabold text-slate-800 mt-0.5">{shift.user?.name || "N/A"}</p>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timing</p>
                            <p className="text-sm font-bold text-slate-800 mt-0.5">Start: {formatDate(shift.start_time)}</p>
                            <p className="text-xs font-medium text-slate-500 mt-0.5">End: {formatDate(shift.end_time)}</p>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-6 rounded-2xl shadow-md text-white flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
                            <p className="text-2xl font-black text-amber-400 mt-1"><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(shift.total_sales)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collection</p>
                            <p className="text-xl font-bold text-emerald-400 mt-1"><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(shift.total_collection)}</p>
                        </div>
                    </div>
                </div>

                {/* Nozzle Readings Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Gauge size={20} className="text-amber-500" /> Nozzle Readings During This Shift
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700 min-w-[700px]">
                            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-xl">Nozzle</th>
                                    <th className="px-4 py-3 text-center">Start ➔ End Meter</th>
                                    <th className="px-4 py-3 text-right">Testing Qty</th>
                                    <th className="px-4 py-3 text-right">Sold Qty</th>
                                    <th className="px-4 py-3 text-right rounded-r-xl">Amount (৳)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {shift.nozzle_readings?.length > 0 ? (
                                    shift.nozzle_readings.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-bold text-slate-900">{r.nozzle?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 text-center font-medium">{r.start_meter} ➔ {r.end_meter}</td>
                                            <td className="px-4 py-3 text-right text-rose-500 font-semibold">{r.testing_qty} Ltr</td>
                                            <td className="px-4 py-3 text-right font-bold text-slate-700">{r.sold_qty} Ltr</td>
                                            <td className="px-4 py-3 text-right font-black text-slate-900">৳ {formatMoney(r.total_amount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-slate-400 font-medium">No nozzle readings recorded in this shift.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Invoices / POS Sales Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingCart size={20} className="text-amber-500" /> POS Sales / Invoices During This Shift
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700 min-w-[700px]">
                            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-xl">Invoice No</th>
                                    <th className="px-4 py-3">Customer</th>
                                    <th className="px-4 py-3 text-right">Grand Total</th>
                                    <th className="px-4 py-3 text-right">Paid</th>
                                    <th className="px-4 py-3 text-right rounded-r-xl">Due</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {shift.invoices?.length > 0 ? (
                                    shift.invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50/50">
                                            <td className="px-4 py-3 font-bold text-slate-900">{inv.invoice_no}</td>
                                            <td className="px-4 py-3 font-medium text-slate-700">{inv.customer?.name || 'Walk-in Customer'}</td>
                                            <td className="px-4 py-3 text-right font-black text-slate-900">৳ {formatMoney(inv.grand_total)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-600">৳ {formatMoney(inv.paid_amount)}</td>
                                            <td className="px-4 py-3 text-right font-bold text-rose-600">৳ {formatMoney(inv.due_amount)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-6 text-center text-slate-400 font-medium">No direct POS invoices issued in this shift.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
