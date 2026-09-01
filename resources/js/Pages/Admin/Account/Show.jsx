import { useMemo, useState } from "react";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import {
    ArrowLeft, Printer, Wallet, Building2, FileText,
    ArrowDownRight, ArrowUpRight, TrendingUp, TrendingDown,
    Clock, Receipt, Search, Filter, Download
} from "lucide-react";

export default function AccountShow({ account, transactions = [] }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all"); // 'all', 'in', 'out'

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    // Transaction Type Classifier
    const isMoneyInType = (type) => ['Sales Collection', 'Deposit', 'Transfer In', 'Opening Balance'].includes(type);

    // Calculate Summary Totals & Running Balances
    const { totalIn, totalOut, processedTransactions } = useMemo(() => {
        let inAmt = 0;
        let outAmt = 0;
        let runningBalance = Number(account.opening_balance || 0);

        const list = (transactions || []).map((txn) => {
            const amount = Number(txn.amount || 0);
            const isIn = isMoneyInType(txn.type);

            if (isIn) {
                inAmt += amount;
                runningBalance += amount;
            } else {
                outAmt += amount;
                runningBalance -= amount;
            }

            return {
                ...txn,
                isIn,
                runningBalance
            };
        });

        return { totalIn: inAmt, totalOut: outAmt, processedTransactions: list };
    }, [transactions, account]);

    // Filtered list based on Search and Type Filter
    const filteredTransactions = useMemo(() => {
        return processedTransactions.filter((txn) => {
            const matchesSearch = (txn.reference || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (txn.id || '').toString().includes(searchTerm);

            if (filterType === 'in') return matchesSearch && txn.isIn;
            if (filterType === 'out') return matchesSearch && !txn.isIn;
            return matchesSearch;
        });
    }, [processedTransactions, searchTerm, filterType]);

    return (
        <AdminLayout title={`${account.name} - Statement`} icon={Wallet}>
            <Head title={`${account.name} Statement | FuelDesk`} />

            <div className="space-y-6 animate-in fade-in duration-300 pb-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/admin/accounts"
                            className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                            title="Back to Accounts"
                        >
                            <ArrowLeft size={18} />
                        </Link>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Account Statement</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Real-time ledger and flow analytics for this account</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
                        >
                            <Printer size={16} /> Print Report
                        </button>
                    </div>
                </div>

                {/* Print Only Title Header */}
                <div className="hidden print:block mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold text-slate-900">{account.name} - Statement</h1>
                    <p className="text-sm text-slate-600">Generated on: {new Date().toLocaleDateString()}</p>
                </div>

                {/* Summary Cards Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 print:grid-cols-3 print:gap-4">

                    {/* Main Account Balance Card */}
                    <div className="lg:col-span-1 bg-slate-900 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden border border-slate-800 print:bg-white print:text-slate-900 print:border-slate-300 print:shadow-none">
                        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl print:hidden"></div>

                        <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 print:bg-slate-100 print:border-none">
                                    {account.type === 'bank' ? (
                                        <Building2 size={24} className="text-sky-400 print:text-sky-600"/>
                                    ) : (
                                        <Wallet size={24} className="text-amber-400 print:text-amber-600"/>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold leading-tight">{account.name}</h3>
                                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-slate-300 px-2.5 py-0.5 rounded-full backdrop-blur-sm print:bg-slate-100 print:text-slate-700">
                                        {account.type.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1 print:text-slate-500">Current Balance</p>
                            <h2 className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight print:text-slate-900 truncate tabular-nums">
                                <span className="mr-1 text-slate-400 text-2xl font-normal">৳</span>
                                {formatMoney(account.current_balance)}
                            </h2>
                            {account.type !== 'cash' && account.account_number && (
                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 print:border-slate-200">
                                    <span>Account No:</span>
                                    <span className="font-mono text-white print:text-slate-800 font-semibold">{account.account_number}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Money Flow Cards */}
                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5 print:grid-cols-2">

                        {/* Money In Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <div className="p-2 bg-emerald-50 rounded-xl">
                                        <TrendingUp size={18} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Money In</p>
                                </div>
                                <span className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-xs font-bold">
                                    +
                                </span>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight tabular-nums">
                                    <span className="text-slate-400 font-normal text-xl mr-1">৳</span>
                                    {formatMoney(totalIn)}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">Total collections & incoming credits</p>
                            </div>
                        </div>

                        {/* Money Out Card */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-rose-500">
                                    <div className="p-2 bg-rose-50 rounded-xl">
                                        <TrendingDown size={18} strokeWidth={2.5} />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Money Out</p>
                                </div>
                                <span className="h-8 w-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-bold">
                                    -
                                </span>
                            </div>

                            <div className="mt-4">
                                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight tabular-nums">
                                    <span className="text-slate-400 font-normal text-xl mr-1">৳</span>
                                    {formatMoney(totalOut)}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1">Total payments & outgoing expenses</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Ledger Transactions Table Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden print:border-slate-300 print:shadow-none">

                    {/* Controls Bar: Search & Filters */}
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                        <div className="flex items-center gap-2">
                            <Receipt size={18} className="text-slate-500" />
                            <h3 className="font-bold text-slate-800 text-base">Transaction Ledger</h3>
                            <span className="text-xs text-slate-400 font-medium bg-slate-200/60 px-2 py-0.5 rounded-full">
                                {filteredTransactions.length}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Search Field */}
                            <div className="relative flex-1 sm:w-64">
                                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search reference or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-colors"
                                />
                            </div>

                            {/* Type Filter Buttons */}
                            <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-3 py-1 rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterType('in')}
                                    className={`px-3 py-1 rounded-lg transition-all ${filterType === 'in' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    In
                                </button>
                                <button
                                    onClick={() => setFilterType('out')}
                                    className={`px-3 py-1 rounded-lg transition-all ${filterType === 'out' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table Data */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-700">
                            <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Reference / Details</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4 text-right text-emerald-600">Credit (+ In)</th>
                                    <th className="px-6 py-4 text-right text-rose-600">Debit (- Out)</th>
                                    <th className="px-6 py-4 text-right text-slate-600">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredTransactions.length > 0 ? (
                                    filteredTransactions.map((txn) => {
                                        // Custom visual badge styling based on transaction type
                                        let badgeStyle = "bg-slate-100 text-slate-600 border-slate-200";
                                        if (txn.type === 'Sales Collection') badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
                                        if (txn.type === 'Purchase Payment') badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
                                        if (txn.type === 'Expense') badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
                                        if (txn.type === 'Fund Transfer') badgeStyle = "bg-sky-50 text-sky-700 border-sky-200";

                                        return (
                                            <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold">
                                                        <Clock size={13} className="text-slate-400 shrink-0" />
                                                        {formatDate(txn.date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 align-middle max-w-[260px]">
                                                    <div className="font-bold text-slate-800 text-sm truncate" title={txn.reference || 'N/A'}>
                                                        {txn.reference || 'N/A'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">#TRX-{txn.id}</div>
                                                </td>
                                                <td className="px-6 py-4 align-middle whitespace-nowrap">
                                                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border shadow-2xs print:border-slate-300 print:text-black ${badgeStyle}`}>
                                                        {txn.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right align-middle whitespace-nowrap tabular-nums">
                                                    {txn.isIn ? (
                                                        <span className="font-extrabold text-emerald-600 text-sm">
                                                            + ৳ {formatMoney(txn.amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 font-normal">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right align-middle whitespace-nowrap tabular-nums">
                                                    {!txn.isIn ? (
                                                        <span className="font-extrabold text-rose-600 text-sm">
                                                            - ৳ {formatMoney(txn.amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 font-normal">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right align-middle whitespace-nowrap font-bold text-slate-800 tabular-nums">
                                                    ৳ {formatMoney(txn.runningBalance)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-16 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div className="h-14 w-14 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 mb-1">
                                                    <FileText size={24} className="text-slate-300" />
                                                </div>
                                                <p className="font-bold text-slate-600 text-sm">No transactions found</p>
                                                <p className="text-xs text-slate-400">Try adjusting your search terms or filter constraints.</p>
                                            </div>
                                        </td>
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
