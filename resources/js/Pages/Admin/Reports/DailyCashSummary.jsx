import { useEffect } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    Wallet, Calendar, ChevronLeft, ChevronRight,
    ArrowUpCircle, ArrowDownCircle, Landmark, Receipt, HandCoins, Printer
} from "lucide-react";

export default function DailyCashSummary({ summary, prevDate, nextDate, filters }) {
    const { props } = usePage();
    const settings = props.settings || {};
    const currency = settings.currency_symbol || "৳";

    const goToDate = (newDate) => {
        router.get("/admin/reports/daily-cash", { date: newDate }, { preserveState: true, replace: true });
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const cashIn = Number(summary.cash_sales) + Number(summary.collections);
    const cashOut = Number(summary.expenses) + Number(summary.supplier_payments);

    return (
        <AdminLayout title="Daily Cash Summary" icon={Wallet}>
            <Head title="Daily Cash Summary | FuelDesk" />

            {/* id="printable-area" pairs with the @media print rule in app.css:
                that rule hides everything in <body> except this subtree, so the
                AdminLayout sidebar/topbar never shows up on the printed page. */}
            <div id="printable-area" className="mx-auto max-w-5xl space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Daily Cash Summary</h2>
                        <p className="text-sm text-slate-500 mt-1">A quick snapshot of today's cash flow — in, out, and in hand.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => window.print()} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print Report
                        </button>
                    </div>
                </div>

                {/* Smart Date Navigator */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-center print:hidden">
                    <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                        <button onClick={() => goToDate(prevDate)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95 hover:text-amber-600">
                            <ChevronLeft size={20} />
                        </button>

                        <div className="flex items-center gap-2 px-4 h-10 bg-white border border-slate-200 rounded-lg shadow-sm cursor-pointer hover:border-amber-300 transition-colors">
                            <Calendar size={18} className="text-amber-500" />
                            <input
                                type="date"
                                value={summary.date}
                                onChange={e => goToDate(e.target.value)}
                                className="border-none bg-transparent text-sm font-bold text-slate-700 outline-none focus:ring-0 p-0 cursor-pointer"
                            />
                        </div>

                        <button onClick={() => goToDate(nextDate)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm hover:bg-slate-50 transition-all active:scale-95 hover:text-amber-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 print:grid-cols-3">

                    {/* Cash In */}
                    <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowUpCircle size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Cash In</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">{currency}</span>
                                {formatMoney(cashIn)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl border border-emerald-100 shadow-sm">
                            <ArrowUpCircle size={28}/>
                        </div>
                    </div>

                    {/* Cash Out */}
                    <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-rose-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowDownCircle size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Total Cash Out</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">{currency}</span>
                                {formatMoney(cashOut)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl border border-rose-100 shadow-sm">
                            <ArrowDownCircle size={28}/>
                        </div>
                    </div>

                    {/* Net Cash */}
                    <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-blue-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <Landmark size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Net Cash in Hand</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">{currency}</span>
                                {formatMoney(summary.net_cash)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl border border-blue-100 shadow-sm">
                            <Landmark size={28}/>
                        </div>
                    </div>

                </div>

                {/* Breakdown Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {/* Print Header */}
                    <div className="hidden print:block p-6 text-center border-b border-slate-200 bg-slate-50">
                        {settings.logo_url && (
                            <img src={settings.logo_url} alt="Logo" className="h-12 mx-auto mb-2 object-contain" />
                        )}
                        <h1 className="text-2xl font-black text-slate-900">{settings.company_name || 'FuelDesk ERP'}</h1>
                        {settings.company_address && <p className="text-xs text-slate-600">{settings.company_address}</p>}
                        {settings.company_phone && <p className="text-xs text-slate-600">Phone: {settings.company_phone}</p>}
                        <h2 className="text-lg font-black uppercase tracking-widest text-slate-800 mt-3">Daily Cash Summary</h2>
                        <p className="text-sm text-slate-500 mt-0.5 font-medium">For Date: {new Date(summary.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-5 rounded-tl-2xl">Cash Flow Particulars</th>
                                    <th className="px-6 py-5 text-right rounded-tr-2xl">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">

                                {/* Incomes */}
                                <tr className="transition-colors hover:bg-slate-50/50 group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3 font-semibold text-slate-800">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <HandCoins size={16} />
                                            </div>
                                            (+) Cash Sales Collected
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-emerald-600 text-base">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-emerald-500 font-normal mr-1 print:text-black">{currency}</span>
                                        {formatMoney(summary.cash_sales)}
                                    </td>
                                </tr>
                                <tr className="transition-colors hover:bg-slate-50/50 group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3 font-semibold text-slate-800">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                <ArrowUpCircle size={16} />
                                            </div>
                                            (+) Due Collections Received
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-emerald-600 text-base">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-emerald-500 font-normal mr-1 print:text-black">{currency}</span>
                                        {formatMoney(summary.collections)}
                                    </td>
                                </tr>

                                {/* Expenses */}
                                <tr className="transition-colors hover:bg-slate-50/50 group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3 font-semibold text-slate-800">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                                                <Receipt size={16} />
                                            </div>
                                            (-) Operating Expenses Paid
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-rose-600 text-base">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-500 font-normal mr-1 print:text-black">{currency}</span>
                                        {formatMoney(summary.expenses)}
                                    </td>
                                </tr>
                                <tr className="transition-colors hover:bg-slate-50/50 group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3 font-semibold text-slate-800">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                                                <ArrowDownCircle size={16} />
                                            </div>
                                            (-) Supplier Payments Made
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-rose-600 text-base">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-500 font-normal mr-1 print:text-black">{currency}</span>
                                        {formatMoney(summary.supplier_payments)}
                                    </td>
                                </tr>

                                {/* Net Balance Row */}
                                <tr className="bg-blue-50/50 border-t-2 border-blue-100 print:bg-transparent print:border-t-2 print:border-black">
                                    <td className="px-6 py-5 font-black text-slate-900 uppercase tracking-wider text-sm flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse print:hidden"></div>
                                        Total Cash Balance
                                    </td>
                                    <td className="px-6 py-5 text-right text-xl font-black text-blue-700 print:text-black">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-blue-500 font-normal mr-1 print:text-black">{currency}</span>
                                        {formatMoney(summary.net_cash)}
                                    </td>
                                </tr>

                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
