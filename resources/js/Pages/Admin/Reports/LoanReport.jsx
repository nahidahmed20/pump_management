import { useState, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    HandCoins, ChevronLeft, ChevronRight, Landmark,
    ArrowDownCircle, ArrowUpCircle, History, Phone,
    DownloadCloud, Printer, UserCheck, Search
} from "lucide-react";

export default function LoanReport({ loans, summary, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/reports/loans", {
                search,
                per_page: perPage
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, perPage]);

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const exportToExcel = () => {
        if (!loans.data || loans.data.length === 0) return;
        const headers = ["Party Name,Phone,Total Received,Total Repaid,Current Due\n"];
        const rows = loans.data.map(l =>
            `"${l.name}","${l.phone || 'N/A'}",${l.total_received},${l.total_repaid},${l.current_due}\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Loan_Borrowing_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const exportToPDF = () => window.print();

    return (
        <AdminLayout title="Loan & Borrowings Report" icon={HandCoins}>
            <Head title="Loan Report | FuelDesk" />

            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Loan & Borrowing Report</h2>
                        <p className="text-sm text-slate-500 mt-1">Track total loans taken, repayments made, and outstanding balance.</p>
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

                    {/* Total Received Card */}
                    <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-blue-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowDownCircle size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Total Loan Received</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.total_received)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl border border-blue-100 shadow-sm">
                            <ArrowDownCircle size={28}/>
                        </div>
                    </div>

                    {/* Total Repaid Card */}
                    <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowUpCircle size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Repaid</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.total_repaid)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl border border-emerald-100 shadow-sm">
                            <ArrowUpCircle size={28}/>
                        </div>
                    </div>

                    {/* Net Due Card */}
                    <div className="bg-white border border-amber-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-amber-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <Landmark size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Net Current Due (Payable)</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.net_due)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-amber-50 text-amber-600 flex items-center justify-center rounded-2xl border border-amber-100 shadow-sm">
                            <Landmark size={28}/>
                        </div>
                    </div>
                </div>

                {/* Filters & Export Bar */}
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

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search party name or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                        />
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {/* Print Header */}
                    <div className="hidden print:block p-6 text-center border-b border-slate-200 bg-slate-50">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">Loan & Borrowing Report</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {search ? `Filtered results for: "${search}"` : 'All Loan Accounts Summary'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Printed on: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Party Details</th>
                                    <th className="px-6 py-4 text-right">Total Received (৳)</th>
                                    <th className="px-6 py-4 text-right">Total Repaid (৳)</th>
                                    <th className="px-6 py-4 text-right">Current Due (৳)</th>
                                    <th className="px-6 py-4 text-center rounded-tr-2xl print:hidden">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loans.data && loans.data.length > 0 ? (
                                    loans.data.map((l) => (
                                        <tr key={l.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold shadow-sm border border-slate-200 uppercase">
                                                        {l.name.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-base">{l.name}</div>
                                                        <div className="flex items-center gap-1.5 font-medium text-slate-500 mt-0.5 text-xs">
                                                            <Phone size={12} className="text-slate-400"/> {l.phone || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-blue-600 text-base">
                                                    {formatMoney(l.total_received)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-emerald-600 text-base">
                                                    {formatMoney(l.total_repaid)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 text-base font-black text-amber-700 bg-amber-50/80 rounded-lg border border-amber-200 print:border-none print:bg-transparent print:p-0 print:text-black">
                                                    {formatMoney(l.current_due)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center print:hidden">
                                                <Link
                                                    href={`/admin/reports/loans/${l.id}/history`}
                                                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-600 shadow-sm transition-all hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 active:scale-95"
                                                >
                                                    <History size={14} className="mr-2" /> View Ledger
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <UserCheck size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">No loan records found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {loans?.links && loans.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{loans.from || 0}</span> to <span className="font-bold text-slate-800">{loans.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{loans.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {loans.links.map((link, idx) => {
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
