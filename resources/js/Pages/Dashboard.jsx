import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    TrendingUp, ShoppingBag, Wallet, CircleDollarSign,
    AlertTriangle, Clock, Droplets, ChevronRight,
    Users, Truck, FileText, PlusCircle, Receipt, Activity, Database
} from 'lucide-react';

export default function Dashboard({ stats, activeShift, tanks, lowStockProducts, recentSales }) {

    const formatMoney = (amount) => {
        return Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    };

    return (
        <AdminLayout title="Overview & Analytics">
            <Head title="Dashboard" />

            <div className="space-y-4 sm:space-y-6 pb-10">

                {/* Welcome & Shift Status Banner */}
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Welcome back, Admin! 👋</h2>
                        <p className="text-sm text-slate-500 mt-1">Here is a complete overview of your pump's operations today.</p>
                    </div>

                    {activeShift ? (
                        <div className="flex items-center gap-3 sm:gap-4 bg-emerald-50 border border-emerald-100 px-4 sm:px-5 py-3 rounded-xl w-full lg:w-auto justify-between lg:justify-start">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full animate-pulse shrink-0">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-600 uppercase">Active Shift</p>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-700">Started: {new Date(activeShift.start_time).toLocaleTimeString()}</p>
                                </div>
                            </div>
                            <Link href="/admin/shifts" className="text-emerald-600 hover:text-emerald-700 bg-white p-1.5 rounded-lg shadow-sm shrink-0"><ChevronRight size={18}/></Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 sm:gap-4 bg-rose-50 border border-rose-100 px-4 sm:px-5 py-3 rounded-xl w-full lg:w-auto justify-between lg:justify-start">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-rose-100 text-rose-600 flex items-center justify-center rounded-full shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-rose-600 uppercase">No Active Shift</p>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-700">Open a shift to start sales.</p>
                                </div>
                            </div>
                            <Link href="/admin/shifts" className="text-rose-600 hover:text-rose-700 bg-white p-1.5 rounded-lg shadow-sm shrink-0"><ChevronRight size={18}/></Link>
                        </div>
                    )}
                </div>

                {/* Top 4 Summary Cards (Today) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
                    {/* Sales Card */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-blue-50/50 rounded-full transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-blue-500 uppercase mb-1">Today's Sales</p>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-800"><span className="text-slate-400 text-base sm:text-lg">৳</span> {formatMoney(stats.todaySales)}</h3>
                            </div>
                            <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                <TrendingUp size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Purchases Card */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-emerald-50/50 rounded-full transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-emerald-500 uppercase mb-1">Today's Purchases</p>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-800"><span className="text-slate-400 text-base sm:text-lg">৳</span> {formatMoney(stats.todayPurchases)}</h3>
                            </div>
                            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <ShoppingBag size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Expenses Card */}
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-rose-50/50 rounded-full transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-rose-500 uppercase mb-1">Today's Expenses</p>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-800"><span className="text-slate-400 text-base sm:text-lg">৳</span> {formatMoney(stats.todayExpenses)}</h3>
                            </div>
                            <div className="h-10 w-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                <Wallet size={20} />
                            </div>
                        </div>
                    </div>

                    {/* Net Cash Card */}
                    <div className="bg-slate-800 p-4 sm:p-5 rounded-2xl shadow-md relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 h-24 w-24 bg-slate-700/50 rounded-full transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-slate-300 uppercase mb-1">Net Cash in Hand</p>
                                <h3 className="text-xl sm:text-2xl font-black text-white"><span className="text-slate-400 text-base sm:text-lg">৳</span> {formatMoney(stats.netCash)}</h3>
                            </div>
                            <div className="h-10 w-10 bg-slate-700 text-emerald-400 rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                <CircleDollarSign size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* NEW SECTION: Live Tank Fuel Levels */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
                            <Database size={18} className="text-amber-500 shrink-0"/> Live Tank Levels
                        </h3>
                        <Link href="/admin/tanks" className="text-xs font-bold text-amber-600 hover:underline">Manage</Link>
                    </div>

                    {tanks && tanks.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                            {tanks.map((tank) => {
                                const percentage = tank.capacity > 0 ? Math.min((tank.current_stock / tank.capacity) * 100, 100).toFixed(1) : 0;
                                const isLow = percentage < 20;

                                return (
                                    <div key={tank.id} className="border border-slate-100 bg-slate-50 rounded-xl p-4 flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-slate-700 text-sm truncate pr-2">{tank.name}</span>
                                            <span className={`text-xs font-black px-2 py-0.5 rounded shrink-0 ${isLow ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {percentage}%
                                            </span>
                                        </div>

                                        {/* Tank Vertical Gauge */}
                                        <div className="relative h-28 sm:h-32 w-full bg-slate-200/60 rounded-lg overflow-hidden border-2 border-white shadow-inner">
                                            {/* Fluid Fill */}
                                            <div
                                                className={`absolute bottom-0 w-full transition-all duration-1000 ${isLow ? 'bg-rose-500' : 'bg-emerald-400'}`}
                                                style={{ height: `${percentage}%` }}
                                            ></div>
                                            {/* Glass reflection */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent w-1/2"></div>
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase mt-1">
                                            <span className="text-slate-800 truncate pr-1">Now: {formatMoney(tank.current_stock)} L</span>
                                            <span className="shrink-0">Max: {formatMoney(tank.capacity)} L</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-400 flex flex-col items-center">
                            <Database size={32} className="opacity-20 mb-2"/>
                            <p className="text-sm">No tanks found. Please add tanks to monitor fuel levels.</p>
                        </div>
                    )}
                </div>

                {/* Middle Section: Dues & Payables Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <Link href="/admin/reports/customer-due" className="flex items-center justify-between bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-amber-400 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                <Users size={20} className="sm:w-6 sm:h-6"/>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-500 truncate">Market Receivable (Due)</p>
                                <h4 className="text-lg sm:text-xl font-black text-slate-800">৳ {formatMoney(stats.totalCustomerDue)}</h4>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-amber-500 shrink-0"/>
                    </Link>

                    <Link href="/admin/reports/supplier-due" className="flex items-center justify-between bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm hover:border-violet-400 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                <Truck size={20} className="sm:w-6 sm:h-6"/>
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-500 truncate">Total Supplier Payable</p>
                                <h4 className="text-lg sm:text-xl font-black text-slate-800">৳ {formatMoney(stats.totalSupplierPayable)}</h4>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-slate-300 group-hover:text-violet-500 shrink-0"/>
                    </Link>
                </div>

                {/* Bottom Section: Low Stock, Quick Links & Recent Sales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                    {/* Left: Low Stock Alerts */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base"><Droplets size={16} className="text-rose-500"/> Low Stock</h3>
                            <Link href="/admin/products" className="text-xs font-bold text-rose-600 hover:underline">View All</Link>
                        </div>
                        <div className="p-3 sm:p-4 flex-1">
                            {lowStockProducts && lowStockProducts.length > 0 ? (
                                <ul className="space-y-3">
                                    {lowStockProducts.map((product, idx) => (
                                        <li key={idx} className="flex flex-col gap-1.5 p-3 border border-rose-100 bg-rose-50/50 rounded-xl">
                                            <div className="flex justify-between items-center">
                                                <span className="font-semibold text-slate-700 text-sm truncate pr-2">{product.name}</span>
                                                <span className="text-xs font-bold text-rose-600 shrink-0">{Number(product.current_stock).toFixed(0)} {product.unit}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-rose-200/50 rounded-full overflow-hidden">
                                                <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min((product.current_stock / 500) * 100, 100)}%` }}></div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-slate-400 flex flex-col items-center justify-center h-full">
                                    <Droplets size={28} className="opacity-20 mb-2"/>
                                    <p className="text-xs sm:text-sm">Stock is sufficient.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Middle: Recent Sales */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:col-span-1">
                        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base"><Activity size={16} className="text-blue-500"/> Recent Sales</h3>
                            <Link href="/admin/invoices" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
                        </div>
                        <div className="p-0 flex-1">
                            {recentSales && recentSales.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentSales.map((sale, idx) => (
                                        <div key={idx} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors flex justify-between items-center">
                                            <div className="min-w-0 pr-2">
                                                <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{sale.customer_name || 'Walk-in Customer'}</p>
                                                <p className="text-[10px] text-slate-500 font-medium truncate">INV: {sale.invoice_no}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs sm:text-sm font-black text-emerald-600">৳ {formatMoney(sale.grand_total)}</p>
                                                <p className="text-[10px] text-slate-400">{sale.date}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 sm:py-8 text-slate-400 flex flex-col items-center justify-center h-full">
                                    <Receipt size={28} className="opacity-20 mb-2"/>
                                    <p className="text-xs sm:text-sm">No recent sales found.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-3 sm:p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 text-sm sm:text-base">Quick Actions</h3>
                        </div>
                        <div className="p-3 sm:p-4 grid grid-cols-2 gap-2 sm:gap-3 flex-1 content-start">
                            <Link href="/admin/invoices/create" className="flex flex-col items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm transition-all text-center">
                                <PlusCircle size={20} className="sm:w-6 sm:h-6"/>
                                <span className="text-[10px] sm:text-xs font-bold">New Sale</span>
                            </Link>
                            <Link href="/admin/purchases/create" className="flex flex-col items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm transition-all text-center">
                                <ShoppingBag size={20} className="sm:w-6 sm:h-6"/>
                                <span className="text-[10px] sm:text-xs font-bold">Buy Fuel</span>
                            </Link>
                            <Link href="/admin/transactions" className="flex flex-col items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 hover:shadow-sm transition-all text-center">
                                <Wallet size={20} className="sm:w-6 sm:h-6"/>
                                <span className="text-[10px] sm:text-xs font-bold">Add Expense</span>
                            </Link>
                            <Link href="/admin/reports/profit-loss" className="flex flex-col items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 hover:shadow-sm transition-all text-center">
                                <FileText size={20} className="sm:w-6 sm:h-6"/>
                                <span className="text-[10px] sm:text-xs font-bold">View P&L</span>
                            </Link>
                        </div>
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
