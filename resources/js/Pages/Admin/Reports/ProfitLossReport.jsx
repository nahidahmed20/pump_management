import { useState, useEffect } from "react";
import { Head, router } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    PieChart, Calendar, FileText, TrendingUp, TrendingDown,
    ArrowDownRight, ArrowUpRight, Receipt, Printer, Scale, PackageMinus, HandCoins, Activity
} from "lucide-react";

export default function ProfitLossReport({ summary, filters }) {
    const [startDate, setStartDate] = useState(filters?.start_date || "");
    const [endDate, setEndDate] = useState(filters?.end_date || "");

    // Filter Trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/reports/profit-loss", {
                start_date: startDate,
                end_date: endDate
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [startDate, endDate]);

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const exportToPDF = () => window.print();

    const isProfit = summary.net_profit >= 0;

    return (
        <AdminLayout title="Profit & Loss Report" icon={PieChart}>
            <Head title="Profit & Loss Report | FuelDesk" />

            {/* id="printable-area" pairs with the @media print rule in app.css */}
            <div id="printable-area" className="mx-auto max-w-5xl space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Profit & Loss (P&L) Statement</h2>
                        <p className="text-sm text-slate-500 mt-1">Analyze your revenues, costs, and overall net profitability.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToPDF} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-5 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print Statement
                        </button>
                    </div>
                </div>

                {/* Date Filter Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between print:hidden">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Activity size={18} className="text-amber-500" />
                        Report Period
                    </div>

                    <div className="flex items-center w-full sm:w-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                        <div className="flex items-center px-2">
                            <Calendar size={18} className="text-slate-400 mr-2" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="h-9 rounded-lg border-none bg-transparent px-2 text-sm font-semibold text-slate-700 outline-none focus:ring-0 cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-center px-2 border-x border-slate-200">
                            <span className="text-xs font-bold text-slate-400 uppercase">To</span>
                        </div>
                        <div className="flex items-center px-2">
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="h-9 rounded-lg border-none bg-transparent px-2 text-sm font-semibold text-slate-700 outline-none focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                {/* Print Header (Hidden on screen) */}
                <div className="hidden print:block text-center mb-6 pb-4 border-b border-slate-200">
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-widest">Profit & Loss Statement</h1>
                    <p className="text-sm font-semibold text-slate-600 mt-2">
                        Period: {startDate ? new Date(startDate).toLocaleDateString('en-GB') : 'Start'} to {endDate ? new Date(endDate).toLocaleDateString('en-GB') : 'Today'}
                    </p>
                </div>

                {/* Net Profit / Loss Highlight Card */}
                <div className={`overflow-hidden rounded-3xl border ${isProfit ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'} p-8 sm:p-10 shadow-sm relative group`}>
                    {/* Decorative Background Icon */}
                    <div className={`absolute -right-8 -top-8 opacity-20 transition-transform group-hover:scale-110 duration-700 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isProfit ? <TrendingUp size={200} /> : <TrendingDown size={200} />}
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black uppercase tracking-widest shadow-sm border ${isProfit ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                            {isProfit ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                            {isProfit ? 'Overall Net Profit' : 'Overall Net Loss'}
                        </span>

                        <h2 className={`mt-4 text-5xl sm:text-6xl font-black tracking-tight ${isProfit ? 'text-emerald-700' : 'text-rose-700'}`}>
                            <span style={{ fontFamily: 'Arial, sans-serif' }} className={`font-medium mr-2 ${isProfit ? 'text-emerald-500' : 'text-rose-500'}`}>৳</span>
                            {formatMoney(Math.abs(summary.net_profit))}
                        </h2>

                        <p className={`mt-3 text-sm font-bold ${isProfit ? 'text-emerald-600/80' : 'text-rose-600/80'}`}>
                            Total earnings after deducting all purchases, operating expenses, and stock adjustments.
                        </p>
                    </div>
                </div>

                {/* Breakdown Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2">

                    {/* Incomes & Gains Box */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col h-full">
                        <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-5 flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600">
                                <ArrowDownRight size={18} strokeWidth={3} />
                            </div>
                            Incomes & Gains
                        </h3>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <HandCoins size={14} className="text-emerald-500"/> Total Sales Revenue
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5 ml-5">Income from pos invoices</p>
                                </div>
                                <span className="text-lg font-black text-emerald-600">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-emerald-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_sales)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Scale size={14} className="text-emerald-500"/> Stock Surplus Gain
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5 ml-5">Positive inventory adjustments</p>
                                </div>
                                <span className="text-lg font-black text-emerald-600">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-emerald-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_surplus)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Costs & Losses Box */}
                    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm flex flex-col h-full">
                        <h3 className="text-lg font-black text-slate-800 border-b border-slate-100 pb-4 mb-5 flex items-center gap-2">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 text-rose-600">
                                <ArrowUpRight size={18} strokeWidth={3} />
                            </div>
                            Costs & Losses
                        </h3>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <Receipt size={14} className="text-rose-500"/> Cost of Goods Sold
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5 ml-5">Cost of acquiring inventory</p>
                                </div>
                                <span className="text-lg font-black text-rose-600">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_cogs)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <FileText size={14} className="text-rose-500"/> Operating Expenses
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5 ml-5">Rent, salary, utilities, etc.</p>
                                </div>
                                <span className="text-lg font-black text-rose-600">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_expenses)}
                                </span>
                            </div>

                            <div className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        <PackageMinus size={14} className="text-rose-500"/> Stock Shortage Loss
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 mt-0.5 ml-5">Evaporation or inventory loss</p>
                                </div>
                                <span className="text-lg font-black text-rose-600">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_shortage)}
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Final Ledger Table */}
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-bold tracking-widest">
                            <tr>
                                <th className="px-6 py-5">Ledger Particulars</th>
                                <th className="px-6 py-5 text-right">Calculated Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800">Gross Profit (Sales - Purchases)</td>
                                <td className="px-6 py-4 text-right font-black text-slate-800 text-base">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.gross_profit)}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-emerald-500 text-lg leading-none">+</span> Add: Surplus Gain
                                </td>
                                <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-emerald-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_surplus)}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-rose-500 text-lg leading-none">-</span> Less: Shortage Loss
                                </td>
                                <td className="px-6 py-4 text-right font-black text-rose-600 text-base">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_shortage)}
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                    <span className="text-rose-500 text-lg leading-none">-</span> Less: Operating Expenses
                                </td>
                                <td className="px-6 py-4 text-right font-black text-rose-600 text-base">
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-400 font-normal mr-1">৳</span>
                                    {formatMoney(summary.total_expenses)}
                                </td>
                            </tr>
                            <tr className={isProfit ? 'bg-emerald-50/50 border-t-2 border-emerald-100 print:bg-transparent print:border-black print:border-t-2' : 'bg-rose-50/50 border-t-2 border-rose-100 print:bg-transparent print:border-black print:border-t-2'}>
                                <td className={`px-6 py-5 text-base font-black uppercase tracking-wider ${isProfit ? 'text-emerald-800 print:text-black' : 'text-rose-800 print:text-black'}`}>
                                    Net Profit / Loss
                                </td>
                                <td className={`px-6 py-5 text-right text-xl font-black ${isProfit ? 'text-emerald-700 print:text-black' : 'text-rose-700 print:text-black'}`}>
                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className={`font-normal mr-1 ${isProfit ? 'text-emerald-500 print:text-black' : 'text-rose-500 print:text-black'}`}>৳</span>
                                    {formatMoney(summary.net_profit)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </AdminLayout>
    );
}
