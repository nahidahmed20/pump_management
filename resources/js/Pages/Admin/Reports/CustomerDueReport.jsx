import { useState, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    Users, FileSpreadsheet, FileText, DownloadCloud, Printer,
    ChevronLeft, ChevronRight, HandCoins, UserRoundCheck, Phone, Search
} from "lucide-react";

export default function CustomerDueReport({ customers, totalDue, filters }) {
    const [search, setSearch] = useState(filters?.search || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    useEffect(() => {
        const timer = setTimeout(() => {
            router.get("/admin/reports/customer-due", {
                search,
                per_page: perPage
            }, { preserveState: true, replace: true });
        }, 300);
        return () => clearTimeout(timer);
    }, [search, perPage]);

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    // Export to Excel
    const exportToExcel = () => {
        const headers = ["Customer Name,Phone,Due Amount\n"];
        const rows = customers.data.map(c =>
            `"${c.name}","${c.phone || 'N/A'}",${c.due_amount}\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Customer_Due_Report_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const exportToPDF = () => window.print();

    return (
        <AdminLayout title="Customer Due Report" icon={Users}>
            <Head title="Customer Due Report | FuelDesk" />

            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header Section */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Customer Due (Receivable)</h2>
                        <p className="text-sm text-slate-500 mt-1">Track which customers owe you money and monitor market receivables.</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 print:grid-cols-2">
                    <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-rose-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <HandCoins size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Total Market Receivable</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-slate-400 font-normal mr-1">৳</span>
                                {formatMoney(totalDue)}
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl border border-rose-100 shadow-sm">
                            <HandCoins size={28}/>
                        </div>
                    </div>

                    <div className="bg-white border border-blue-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-blue-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <UserRoundCheck size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Customers with Due</p>
                            <h3 className="text-3xl font-black text-slate-800">{customers.total} <span className="text-lg font-bold text-slate-400">Persons</span></h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-blue-50 text-blue-600 flex items-center justify-center rounded-2xl border border-blue-100 shadow-sm">
                            <UserRoundCheck size={28}/>
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
                            <option value={100}>100</option>
                            <option value="all">All</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="relative w-full xl:w-80">
                        <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search customer name or phone..."
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
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">Customer Due Report</h2>
                        <p className="text-sm text-slate-500 mt-1 font-medium">
                            {search ? `Filtered results for: "${search}"` : 'All Customers with Outstanding Due'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Printed on: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Customer Details</th>
                                    <th className="px-6 py-4">Contact Number</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Total Due Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {customers.data.length > 0 ? (
                                    customers.data.map((c) => (
                                        <tr key={c.id} className="transition-colors hover:bg-slate-50/50 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold shadow-sm border border-slate-200 uppercase">
                                                        {c.name.substring(0, 2)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 text-base">{c.name}</div>
                                                        <div className="text-xs font-medium text-slate-400 mt-0.5">Customer ID: #{c.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 font-semibold text-slate-700">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {c.phone || <span className="text-slate-300 italic font-normal">N/A</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-4 py-1.5 text-sm font-black text-rose-600 border border-rose-100 shadow-sm print:border-none print:shadow-none print:bg-transparent print:p-0 print:text-black">
                                                    <span style={{ fontFamily: 'Arial, sans-serif' }} className="text-rose-400 font-normal print:text-black">৳</span>
                                                    {formatMoney(c.due_amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <UserRoundCheck size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">No due records found matching your search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {customers?.links && customers.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{customers.from || 0}</span> to <span className="font-bold text-slate-800">{customers.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{customers.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {customers.links.map((link, idx) => {
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
