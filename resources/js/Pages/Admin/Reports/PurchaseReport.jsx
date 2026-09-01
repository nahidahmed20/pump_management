import { useState, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    ShoppingCart, Calendar, ChevronLeft, ChevronRight,
    Wallet, AlertCircle, DownloadCloud, Printer, Store
} from "lucide-react";

export default function PurchaseReport({ purchases, summary, filters }) {
    const [startDate, setStartDate] = useState(filters?.start_date || "");
    const [endDate, setEndDate] = useState(filters?.end_date || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Filter Trigger
    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/reports/purchases", {
                start_date: startDate,
                end_date: endDate,
                per_page: perPage
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [startDate, endDate, perPage]);

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    // Export to Excel
    const exportToExcel = () => {
        const headers = ["Date,Reference No,Supplier,Sub Total,Total Amount,Paid Amount,Due Amount\n"];
        const rows = purchases.data.map(i =>
            `"${i.date}","${i.reference_no || 'N/A'}","${i.supplier_name || 'Walk-in Supplier'}",${i.sub_total},${i.total_amount},${i.paid_amount},${i.due_amount}\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Purchase_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const exportToPDF = () => window.print();

    return (
        <AdminLayout title="Purchase Report" icon={ShoppingCart}>
            <Head title="Purchase Report | FuelDesk" />

            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Purchase Report</h2>
                        <p className="text-sm text-slate-500 mt-1">Track your fuel purchases, payments, and outstanding supplier dues.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToExcel} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95">
                            <DownloadCloud size={18} /> Export CSV
                        </button>

                        <button onClick={exportToPDF} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print Report
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 print:grid-cols-3">

                    {/* Total Purchases Card */}
                    <div className="bg-white border border-violet-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-violet-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ShoppingCart size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-violet-500 uppercase tracking-wider mb-1">Total Purchases</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.total_purchase)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-violet-50 text-violet-600 flex items-center justify-center rounded-2xl border border-violet-100 shadow-sm">
                            <ShoppingCart size={28}/>
                        </div>
                    </div>

                    {/* Total Paid Card */}
                    <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <Wallet size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Paid to Suppliers</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.total_paid)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl border border-emerald-100 shadow-sm">
                            <Wallet size={28}/>
                        </div>
                    </div>

                    {/* Total Due Card */}
                    <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-rose-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <AlertCircle size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Total Payable Due</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.total_due)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl border border-rose-100 shadow-sm">
                            <AlertCircle size={28}/>
                        </div>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                            <span>Show</span>
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(e.target.value)}
                                className="h-8 w-16 cursor-pointer rounded-lg border-none bg-white px-2 py-1 text-sm shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-amber-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value="all">All</option>
                            </select>
                            <span>entries</span>
                        </div>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center w-full xl:w-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
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

                {/* Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {/* Print Header */}
                    <div className="hidden print:block p-6 text-center border-b border-slate-200 bg-slate-50">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">Purchase Report</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {startDate && endDate ? `Showing purchases from ${new Date(startDate).toLocaleDateString('en-GB')} to ${new Date(endDate).toLocaleDateString('en-GB')}` : 'All Time Purchase History'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Printed on: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Date & Ref No</th>
                                    <th className="px-6 py-4">Supplier Name</th>
                                    <th className="px-6 py-4 text-right">Sub Total</th>
                                    <th className="px-6 py-4 text-right">Total Bill</th>
                                    <th className="px-6 py-4 text-right">Paid Amount</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Due / Payable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {purchases.data.length > 0 ? (
                                    purchases.data.map((item) => (
                                        <tr key={item.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-900 text-base">
                                                    {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="text-xs font-medium text-slate-500 mt-0.5">REF: {item.reference_no || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-bold text-slate-800">
                                                    <Store size={16} className="text-slate-400" />
                                                    {item.supplier_name || 'Walk-in Supplier'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-slate-600">
                                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                                {formatMoney(item.sub_total)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-sm font-black text-violet-700 bg-violet-50 rounded-lg border border-violet-100 print:border-none print:bg-transparent print:p-0 print:text-black">
                                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-violet-400 font-normal print:text-black">৳</span>
                                                    {formatMoney(item.total_amount)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-emerald-600 text-base">
                                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-emerald-400 font-normal mr-1 print:text-black">৳</span>
                                                {formatMoney(item.paid_amount)}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-rose-600 text-base">
                                                {item.due_amount > 0 ? (
                                                    <>
                                                        <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-400 font-normal mr-1 print:text-black">৳</span>
                                                        {formatMoney(item.due_amount)}
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <ShoppingCart size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">No purchase records found for the selected dates.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {purchases?.links && purchases.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{purchases.from || 0}</span> to <span className="font-bold text-slate-800">{purchases.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{purchases.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {purchases.links.map((link, idx) => {
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
        </AdminLayout>
    );
}
