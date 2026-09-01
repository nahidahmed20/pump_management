import { useState, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    History, ArrowLeft, ArrowDownRight, ArrowUpRight,
    FileSpreadsheet, Printer, ChevronLeft, ChevronRight,
    Calendar, DownloadCloud, User, ArrowDownCircle, ArrowUpCircle, Wallet, Tag
} from "lucide-react";

export default function LoanHistory({ party, history, summary, filters }) {
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get(`/admin/reports/loans/${party.id}/history`, {
                per_page: perPage
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [perPage]);

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    const exportToExcel = () => {
        if (!history.data || history.data.length === 0) return;
        const headers = ["Date,Transaction Type,Note/Memo,Amount\n"];
        const rows = history.data.map(h => {
            const typeText = h.type === 'loan_received' ? 'Loan Received (+)' : 'Loan Repaid (-)';
            return `"${h.date}","${typeText}","${(h.note || '').replace(/"/g, '""')}",${h.amount}\n`;
        });
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${party.name.replace(/\s+/g, '_')}_Loan_History_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const exportToPDF = () => window.print();

    return (
        <AdminLayout title={`${party.name} - Loan History`} icon={History}>
            <Head title={`Loan History: ${party.name} | FuelDesk`} />

            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <Link href="/admin/reports/loans" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-600 transition-colors uppercase tracking-wider mb-2">
                            <ArrowLeft size={14} /> Back to Loan Report
                        </Link>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            Loan Ledger: <span className="text-amber-600">{party.name}</span>
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={exportToExcel} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95">
                            <DownloadCloud size={18} /> Export CSV
                        </button>
                        <button onClick={exportToPDF} className="hidden sm:flex h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95">
                            <Printer size={18} /> Print Ledger
                        </button>
                    </div>
                </div>

                {/* Party Info & Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 print:grid-cols-4">
                    {/* Party Info */}
                    <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-sm flex flex-col justify-center relative overflow-hidden group print:border-slate-200 print:bg-white print:text-slate-800">
                        <div className="absolute -right-4 -top-4 text-slate-700 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500 print:hidden">
                            <User size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-slate-500">Party Details</p>
                            <h3 className="text-xl font-black text-white print:text-slate-800 truncate">{party.name}</h3>
                            <p className="text-sm font-medium text-slate-300 mt-1 print:text-slate-500">{party.phone || 'No Phone Number'}</p>
                        </div>
                    </div>

                    {/* Total Taken */}
                    <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-blue-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowDownCircle size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Total Taken (+)</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.total_received)}
                            </h3>
                        </div>
                    </div>

                    {/* Total Repaid */}
                    <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowUpCircle size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Repaid (-)</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.total_repaid)}
                            </h3>
                        </div>
                    </div>

                    {/* Current Due */}
                    <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-rose-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <Wallet size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Current Due (=)</p>
                            <h3 className="text-2xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(summary.current_due)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters & Export Bar */}
                <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between print:hidden">
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
                            <option value="all">All</option>
                        </select>
                        <span>entries</span>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {/* Print Header */}
                    <div className="hidden print:block p-6 text-center border-b border-slate-200 bg-slate-50">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">{party.name} - Loan Ledger</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">Contact: {party.phone || 'N/A'}</p>
                        <p className="text-xs text-slate-400 mt-1">Printed on: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl w-40">Date</th>
                                    <th className="px-6 py-4">Transaction Type</th>
                                    <th className="px-6 py-4">Note / Details</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {history.data && history.data.length > 0 ? (
                                    history.data.map((item) => {
                                        const isReceived = item.type === 'loan_received';
                                        return (
                                            <tr key={item.id} className="transition-colors hover:bg-slate-50/50 group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 border border-slate-200">
                                                            <Calendar size={14} />
                                                        </div>
                                                        {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold border ${isReceived ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                        {isReceived ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                                                        {isReceived ? 'Loan Received (+)' : 'Loan Repaid (-)'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2 text-slate-600 font-medium">
                                                        {item.note ? (
                                                            <>
                                                                <Tag size={16} className="text-slate-400 mt-0.5 shrink-0" />
                                                                <span>{item.note}</span>
                                                            </>
                                                        ) : (
                                                            <span className="italic text-slate-300">No details</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-base font-black rounded-lg border print:border-none print:bg-transparent print:p-0 print:text-black ${isReceived ? 'text-blue-700 bg-blue-50/50 border-blue-100' : 'text-emerald-700 bg-emerald-50/50 border-emerald-100'}`}>
                                                        <span style={{ fontFamily: 'Arial, sans-serif' }} className={`font-normal print:text-black ${isReceived ? 'text-blue-400' : 'text-emerald-400'}`}>৳</span>
                                                        {formatMoney(item.amount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <History size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">No transaction history found for this party.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {history.links && history.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{history.from || 0}</span> to <span className="font-bold text-slate-800">{history.to || 0}</span> of <span className="font-bold text-slate-800">{history.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {history.links.map((link, idx) => {
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
