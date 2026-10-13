import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    BarChart3, Printer, Calendar, Filter, Fuel, Droplets,
    Wallet, CreditCard, ArrowDownRight, ArrowUpRight, Truck, CheckCircle2, AlertTriangle
} from "lucide-react";

export default function DailyPumpSummary({
    date,
    selectedShiftId,
    shifts = [],
    nozzleReadings = [],
    totalMeterSales = 0,
    totalMeterLiters = 0,
    invoiceGrossTotal = 0,
    invoicePaid = 0,
    invoiceDue = 0,
    creditSalesList = [],
    tankSummary = [],
    expenses = [],
    totalExpense = 0,
    dueCollections = 0,
    supplierPayments = 0,
    netCashInHand = 0,
}) {
    const { props } = usePage();
    const settings = props.settings || {};
    const currency = settings.currency_symbol || "৳";

    const [selectedDate, setSelectedDate] = useState(date);
    const [shiftId, setShiftId] = useState(selectedShiftId || "all");

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(
            "/admin/reports/daily-pump-summary",
            { date: selectedDate, shift_id: shiftId },
            { preserveState: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    const formatMoney = (amount) =>
        Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    const formatNumber = (val) =>
        Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2 });

    return (
        <AdminLayout title="Daily Pump Summary (DSR)" icon={BarChart3}>
            <Head title={`DSR Summary - ${selectedDate} | FuelDesk`} />

            {/* Print Styles */}
            <style type="text/css" media="print">
                {`
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-dsr, #printable-dsr * {
                        visibility: visible;
                    }
                    #printable-dsr {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                `}
            </style>

            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Header & Filter Controls */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Fuel className="text-amber-500" size={24} />
                            Daily Sales Report (DSR Sheet)
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">
                            Complete end-of-day audit sheet: meter sales, tank dips, credit slips & cash balance.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                                <Calendar size={16} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="border-none bg-transparent text-sm font-semibold text-slate-800 outline-none p-0 cursor-pointer"
                                />
                            </div>

                            <select
                                value={shiftId}
                                onChange={(e) => setShiftId(e.target.value)}
                                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-500"
                            >
                                <option value="all">All Shifts Today</option>
                                {shifts.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        Shift #{s.id} ({s.user?.name || "User"})
                                    </option>
                                ))}
                            </select>

                            <button
                                type="submit"
                                className="h-10 px-4 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
                            >
                                Filter
                            </button>
                        </form>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            <Printer size={16} /> Print DSR
                        </button>
                    </div>
                </div>

                {/* Printable Report Sheet */}
                <div id="printable-dsr" className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    {/* Print Header */}
                    <div className="border-b-2 border-slate-100 pb-5">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5">
                                {settings.logo_url && (
                                    <div className="flex h-14 min-w-[56px] max-w-[140px] items-center justify-center rounded-xl bg-white border border-slate-200 p-1.5 shrink-0 overflow-hidden">
                                        <img
                                            src={settings.logo_url}
                                            alt={settings.company_name}
                                            className="max-h-full max-w-full object-contain"
                                        />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">
                                        {settings.company_name || "M/S FILLING STATION & SERVICE CENTER"}
                                    </h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {settings.company_address ? `${settings.company_address} | ` : ""}
                                        DAILY PUMP AUDIT & SALES SUMMARY (DSR SHEET)
                                    </p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right shrink-0">
                                <span className="inline-block px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
                                    Date: {selectedDate}
                                </span>
                                <div className="text-xs text-slate-500 mt-1">
                                    Shift: {shiftId === "all" ? "All Combined" : `Shift #${shiftId}`}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KPI Quick Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-200/60">
                            <span className="text-xs font-bold uppercase text-amber-800 flex items-center gap-1.5">
                                <Fuel size={14} className="text-amber-600" /> Total Meter Sales
                            </span>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {currency} {formatMoney(totalMeterSales)}
                            </div>
                            <div className="text-xs font-semibold text-amber-700 mt-0.5">
                                {formatNumber(totalMeterLiters)} Liters
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-200/60">
                            <span className="text-xs font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                                <Wallet size={14} className="text-emerald-600" /> Cash Received
                            </span>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {currency} {formatMoney(invoicePaid)}
                            </div>
                            <div className="text-xs font-semibold text-emerald-700 mt-0.5">
                                Due Recv: {currency} {formatMoney(dueCollections)}
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 to-rose-500/5 border border-rose-200/60">
                            <span className="text-xs font-bold uppercase text-rose-800 flex items-center gap-1.5">
                                <CreditCard size={14} className="text-rose-600" /> Due / Credit Slips
                            </span>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {currency} {formatMoney(invoiceDue)}
                            </div>
                            <div className="text-xs font-semibold text-rose-700 mt-0.5">
                                {creditSalesList.length} Credit Slips
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-200/60">
                            <span className="text-xs font-bold uppercase text-blue-800 flex items-center gap-1.5">
                                <Wallet size={14} className="text-blue-600" /> Net Cash In Drawer
                            </span>
                            <div className="text-xl font-black text-slate-900 mt-1">
                                {currency} {formatMoney(netCashInHand)}
                            </div>
                            <div className="text-xs font-semibold text-blue-700 mt-0.5">
                                Expenses: {currency} {formatMoney(totalExpense)}
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Nozzle Meter Readings */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Fuel size={16} className="text-amber-500" />
                                1. Nozzle Meter Sales Summary
                            </h3>
                            <span className="text-xs font-semibold text-slate-500">
                                Readings count: {nozzleReadings.length}
                            </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2.5">Nozzle</th>
                                        <th className="px-3 py-2.5">Fuel Product</th>
                                        <th className="px-3 py-2.5">Operator</th>
                                        <th className="px-3 py-2.5 text-right">Start Meter</th>
                                        <th className="px-3 py-2.5 text-right">End Meter</th>
                                        <th className="px-3 py-2.5 text-right">Testing (Ltr)</th>
                                        <th className="px-3 py-2.5 text-right font-black text-slate-900">Sold (Ltr)</th>
                                        <th className="px-3 py-2.5 text-right">Rate ({currency})</th>
                                        <th className="px-3 py-2.5 text-right font-black text-slate-900">Total ({currency})</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {nozzleReadings.length > 0 ? (
                                        nozzleReadings.map((nr) => (
                                            <tr key={nr.id} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-2 font-bold text-slate-900">{nr.nozzle_name}</td>
                                                <td className="px-3 py-2">{nr.product_name}</td>
                                                <td className="px-3 py-2 text-slate-500">{nr.shift_user}</td>
                                                <td className="px-3 py-2 text-right">{formatNumber(nr.start_meter)}</td>
                                                <td className="px-3 py-2 text-right">{formatNumber(nr.end_meter)}</td>
                                                <td className="px-3 py-2 text-right text-rose-600">{formatNumber(nr.testing_qty)}</td>
                                                <td className="px-3 py-2 text-right font-bold text-slate-900 bg-amber-50/40">
                                                    {formatNumber(nr.sold_qty)}
                                                </td>
                                                <td className="px-3 py-2 text-right">{formatMoney(nr.unit_price)}</td>
                                                <td className="px-3 py-2 text-right font-black text-slate-900">
                                                    {formatMoney(nr.total_amount)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="px-4 py-6 text-center text-slate-400 italic">
                                                No nozzle meter readings logged for this date/shift.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                {nozzleReadings.length > 0 && (
                                    <tfoot className="bg-slate-100/80 font-bold border-t border-slate-200">
                                        <tr>
                                            <td colSpan="6" className="px-3 py-2 text-right uppercase text-slate-600">
                                                Total Nozzle Sales:
                                            </td>
                                            <td className="px-3 py-2 text-right text-slate-900 font-black">
                                                {formatNumber(totalMeterLiters)} Ltr
                                            </td>
                                            <td></td>
                                            <td className="px-3 py-2 text-right text-slate-900 font-black text-sm">
                                                {currency} {formatMoney(totalMeterSales)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>

                    {/* Section 2: Tank Stock & Evaporation / Dip Analysis */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Droplets size={16} className="text-blue-500" />
                                2. Tank Physical Stock & Variance (Dip vs Software)
                            </h3>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                                    <tr>
                                        <th className="px-3 py-2.5">Tank Name</th>
                                        <th className="px-3 py-2.5">Product</th>
                                        <th className="px-3 py-2.5 text-right">Capacity (Ltr)</th>
                                        <th className="px-3 py-2.5 text-right">Software Stock</th>
                                        <th className="px-3 py-2.5 text-right">Physical Dip Stock</th>
                                        <th className="px-3 py-2.5 text-right">Variance / Loss (Ltr)</th>
                                        <th className="px-3 py-2.5">Dip Note</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {tankSummary.length > 0 ? (
                                        tankSummary.map((t) => {
                                            const hasReading = t.physical_stock !== null;
                                            const isShort = hasReading && t.variance < 0;
                                            return (
                                                <tr key={t.id} className="hover:bg-slate-50/50">
                                                    <td className="px-3 py-2 font-bold text-slate-900">{t.tank_name}</td>
                                                    <td className="px-3 py-2">{t.product_name}</td>
                                                    <td className="px-3 py-2 text-right">{formatNumber(t.capacity)}</td>
                                                    <td className="px-3 py-2 text-right font-medium">{formatNumber(t.software_stock)}</td>
                                                    <td className="px-3 py-2 text-right font-bold text-slate-900">
                                                        {hasReading ? formatNumber(t.physical_stock) : <span className="text-slate-400 italic">No Dip Entry</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-bold">
                                                        {hasReading ? (
                                                            <span
                                                                className={`px-2 py-0.5 rounded-md ${
                                                                    isShort
                                                                        ? "bg-rose-100 text-rose-800"
                                                                        : t.variance > 0
                                                                        ? "bg-emerald-100 text-emerald-800"
                                                                        : "bg-slate-100 text-slate-800"
                                                                }`}
                                                            >
                                                                {t.variance > 0 ? `+${formatNumber(t.variance)}` : formatNumber(t.variance)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-500 text-[11px]">{t.dip_note || "-"}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-6 text-center text-slate-400 italic">
                                                No tanks registered in system.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 3: Credit / Baki Sales List */}
                    {creditSalesList.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                     <Truck size={16} className="text-rose-500" />
                                     3. Credit / Due Sales & Fleet Slips Today
                                 </h3>
                                 <span className="text-xs font-bold text-rose-600">
                                     Total Due: {currency} {formatMoney(invoiceDue)}
                                 </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2">Invoice #</th>
                                            <th className="px-3 py-2">Customer / Client</th>
                                            <th className="px-3 py-2">Vehicle No</th>
                                            <th className="px-3 py-2">Slip / Indent No</th>
                                            <th className="px-3 py-2 text-right">Invoice Total</th>
                                            <th className="px-3 py-2 text-right font-black text-rose-600">Due Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {creditSalesList.map((cs) => (
                                             <tr key={cs.id} className="hover:bg-slate-50/50">
                                                 <td className="px-3 py-2 font-mono font-bold text-slate-900">{cs.invoice_no}</td>
                                                 <td className="px-3 py-2 font-semibold text-slate-800">{cs.customer_name}</td>
                                                 <td className="px-3 py-2">
                                                     {cs.vehicle_no ? (
                                                         <span className="font-bold text-slate-800">{cs.vehicle_no}</span>
                                                     ) : (
                                                         <span className="text-slate-400 italic">-</span>
                                                     )}
                                                 </td>
                                                 <td className="px-3 py-2">{cs.slip_no || "-"}</td>
                                                 <td className="px-3 py-2 text-right">{currency} {formatMoney(cs.grand_total)}</td>
                                                 <td className="px-3 py-2 text-right font-black text-rose-600">
                                                     {currency} {formatMoney(cs.due_amount)}
                                                 </td>
                                             </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Section 4: Daily Expenses */}
                    {expenses.length > 0 && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <ArrowDownRight size={16} className="text-amber-500" />
                                    4. Daily Expenses Incurred
                                </h3>
                                <span className="text-xs font-bold text-amber-700">
                                    Total: {currency} {formatMoney(totalExpense)}
                                </span>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase border-b border-slate-200">
                                        <tr>
                                            <th className="px-3 py-2">Category</th>
                                            <th className="px-3 py-2">Title / Note</th>
                                            <th className="px-3 py-2 text-right font-bold text-slate-900">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {expenses.map((exp) => (
                                            <tr key={exp.id} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-2 font-semibold text-slate-800">{exp.category?.name || "General"}</td>
                                                <td className="px-3 py-2 text-slate-600">{exp.note || exp.title || "Daily Expense"}</td>
                                                <td className="px-3 py-2 text-right font-bold text-slate-900">
                                                    {currency} {formatMoney(exp.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Signatures for Print */}
                    <div className="pt-12 mt-8 border-t border-slate-200 grid grid-cols-3 gap-8 text-center text-xs text-slate-600">
                        <div>
                            <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                            <span className="font-bold">Shift Operator / DSR</span>
                        </div>
                        <div>
                            <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                            <span className="font-bold">Cashier / Accountant</span>
                        </div>
                        <div>
                            <div className="border-b border-slate-400 w-36 mx-auto mb-1"></div>
                            <span className="font-bold">Manager / Owner</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

