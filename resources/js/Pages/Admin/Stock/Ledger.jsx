import { useState, useEffect } from "react";
import { Head, router, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    Boxes, ArrowDownRight, ArrowUpRight, Search, Calendar,
    ChevronLeft, ChevronRight, DownloadCloud, Printer,
    ArrowDownCircle, ArrowUpCircle, PackageSearch
} from "lucide-react";

export default function StockLedgerIndex({ products, selectedProduct, ledgers, summary, filters }) {
    const [productId, setProductId] = useState(selectedProduct || "");
    const [searchTerm, setSearchTerm] = useState(filters?.search || "");
    const [startDate, setStartDate] = useState(filters?.start_date || "");
    const [endDate, setEndDate] = useState(filters?.end_date || "");
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Debounced Search & Filter
    useEffect(() => {
        const timer = setTimeout(() => {
            if (productId) {
                router.get('/admin/stock-ledgers', {
                    product_id: productId,
                    search: searchTerm,
                    start_date: startDate,
                    end_date: endDate,
                    per_page: perPage
                }, { preserveState: true, replace: true });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [productId, searchTerm, startDate, endDate, perPage]);

    // Export to Excel
    const exportToExcel = () => {
        if (!ledgers.data || ledgers.data.length === 0) return;

        const headers = ["Date,Transaction Type,Reference,Stock In,Stock Out\n"];
        const rows = ledgers.data.map(l =>
            `"${l.date}","${l.type}","${l.reference || ''}",${l.in_qty},${l.out_qty}\n`
        );
        const blob = new Blob([...headers, ...rows], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const productName = products.find(p => p.id == productId)?.name || 'Product';
        a.download = `${productName.replace(/\s+/g, '_')}_Stock_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const exportToPDF = () => window.print();

    return (
        <AdminLayout title="Stock Ledger" icon={Boxes}>
            <Head title="Stock Ledger | FuelDesk" />

            <div className="space-y-6 print:space-y-4 animate-in fade-in duration-300">

                {/* Header & Product Selector Section */}
                <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between bg-white p-5 rounded-2xl shadow-sm border border-slate-100 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Product Stock Ledger</h2>
                        <p className="text-sm text-slate-500 mt-1">Track history of stock in and out for specific products.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* Product Selector */}
                        <div className="flex items-center gap-2 w-full sm:w-72 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-slate-500">
                                <PackageSearch size={16} />
                            </div>
                            <select
                                value={productId}
                                onChange={(e) => setProductId(e.target.value)}
                                className="h-9 w-full bg-transparent border-none px-2 text-sm font-bold text-slate-800 outline-none focus:ring-0 cursor-pointer truncate"
                            >
                                <option value="" disabled>-- Select Product --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button onClick={exportToExcel} disabled={!productId} className="flex flex-1 sm:flex-none h-11 items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 text-sm font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-100 active:scale-95 disabled:opacity-50">
                                <DownloadCloud size={18} /> CSV
                            </button>
                            <button onClick={exportToPDF} disabled={!productId} className="flex flex-1 sm:flex-none h-11 items-center justify-center gap-2 rounded-xl bg-white border border-slate-200 px-4 text-sm font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50">
                                <Printer size={18} /> Print
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 print:grid-cols-2">

                    {/* Stock In Card */}
                    <div className="bg-white border border-emerald-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-emerald-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowDownCircle size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-1">Total Stock In (+)</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {Number(summary.total_in).toLocaleString()} <span className="text-lg font-bold text-slate-400">Unit</span>
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl border border-emerald-100 shadow-sm">
                            <ArrowDownCircle size={28}/>
                        </div>
                    </div>

                    {/* Stock Out Card */}
                    <div className="bg-white border border-rose-100 p-6 rounded-2xl shadow-sm flex items-center justify-between relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 text-rose-50 opacity-50 rotate-12 transition-transform group-hover:scale-110 duration-500">
                            <ArrowUpCircle size={120} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-1">Total Stock Out (-)</p>
                            <h3 className="text-3xl font-black text-slate-800">
                                {Number(summary.total_out).toLocaleString()} <span className="text-lg font-bold text-slate-400">Unit</span>
                            </h3>
                        </div>
                        <div className="relative z-10 h-14 w-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl border border-rose-100 shadow-sm">
                            <ArrowUpCircle size={28}/>
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

                    {/* Date Range Filter & Search */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
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

                        <div className="relative w-full sm:w-64">
                            <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search reference..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {/* Print Header */}
                    <div className="hidden print:block p-6 text-center border-b border-slate-200 bg-slate-50">
                        <h2 className="text-2xl font-black uppercase tracking-widest text-slate-800">Stock Ledger</h2>
                        <p className="text-base font-bold text-slate-700 mt-1">Product: {products.find(p => p.id == productId)?.name || 'Not Selected'}</p>
                        <p className="text-xs text-slate-400 mt-1">Printed on: {new Date().toLocaleDateString('en-GB')}</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Date</th>
                                    <th className="px-6 py-4">Transaction Type</th>
                                    <th className="px-6 py-4">Reference / Memo</th>
                                    <th className="px-6 py-4 text-right">Stock In (+)</th>
                                    <th className="px-6 py-4 text-right rounded-tr-2xl">Stock Out (-)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ledgers.data && ledgers.data.length > 0 ? (
                                    ledgers.data.map((item, idx) => {
                                        const isStockIn = item.in_qty > 0;
                                        return (
                                            <tr key={idx} className="transition-colors hover:bg-slate-50/50 group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                                        <Calendar size={14} className="text-slate-400" />
                                                        {item.date}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold uppercase border ${isStockIn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                                                        {isStockIn ? <ArrowDownRight size={14}/> : <ArrowUpRight size={14}/>}
                                                        {item.type.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-600">
                                                        {item.reference || <span className="text-slate-300 italic">No Reference</span>}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {isStockIn ? (
                                                        <span className="inline-flex items-center px-3 py-1 font-black text-emerald-600 bg-emerald-50/50 rounded-lg border border-emerald-100 print:border-none print:bg-transparent print:p-0 print:text-black text-base">
                                                            + {Number(item.in_qty).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {item.out_qty > 0 ? (
                                                        <span className="inline-flex items-center px-3 py-1 font-black text-rose-600 bg-rose-50/50 rounded-lg border border-rose-100 print:border-none print:bg-transparent print:p-0 print:text-black text-base">
                                                            - {Number(item.out_qty).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <Boxes size={40} className="text-slate-200" />
                                                <p className="font-medium text-slate-500">
                                                    {productId ? "No stock history found for this product." : "Please select a product to view its ledger."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {ledgers?.links && ledgers.data.length > 0 && (
                        <div className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 rounded-b-2xl print:hidden">
                            <div>
                                Showing <span className="font-bold text-slate-800">{ledgers.from || 0}</span> to <span className="font-bold text-slate-800">{ledgers.to || 0}</span> of{" "}
                                <span className="font-bold text-slate-800">{ledgers.total}</span> entries
                            </div>
                            <div className="flex items-center gap-1">
                                {ledgers.links.map((link, idx) => {
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
