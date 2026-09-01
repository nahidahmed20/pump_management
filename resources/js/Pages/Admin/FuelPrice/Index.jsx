import { useEffect } from "react";
import { Head, useForm } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import { DollarSign, Save, TrendingUp, Info } from "lucide-react";

export default function FuelPriceIndex({ fuelProducts }) {
    // Initialize form data with the fetched fuel products
    const { data, setData, post, processing, errors } = useForm({
        prices: fuelProducts.map(product => ({
            id: product.id,
            name: product.name,
            unit: product.unit,
            buying_price: product.buying_price || 0,
            selling_price: product.selling_price || 0,
        }))
    });

    // Sync form if fuelProducts changes from backend
    useEffect(() => {
        setData("prices", fuelProducts.map(product => ({
            id: product.id,
            name: product.name,
            unit: product.unit,
            buying_price: product.buying_price || 0,
            selling_price: product.selling_price || 0,
        })));
    }, [fuelProducts]);

    const handlePriceChange = (index, field, value) => {
        const updatedPrices = [...data.prices];
        updatedPrices[index][field] = value;
        setData("prices", updatedPrices);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/admin/fuel-prices", {
            onSuccess: () => {
                Swal.fire({
                    icon: "success",
                    title: "Prices Updated!",
                    text: "All fuel prices have been updated successfully.",
                    confirmButtonColor: "#f59e0b",
                    customClass: { popup: 'rounded-2xl' }
                });
            },
        });
    };

    return (
        <AdminLayout title="Fuel Price Board" icon={DollarSign}>
            <Head title="Fuel Prices Update | FuelDesk" />

            <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">

                {/* Modern Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                    {/* Decorative Background Icon */}
                    <DollarSign className="absolute -right-6 -top-6 text-slate-50 opacity-50 rotate-12" size={150} strokeWidth={1} />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
                                <TrendingUp size={20} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Fuel Price Board</h2>
                        </div>
                        <p className="text-sm text-slate-500 font-medium pl-14">
                            Instantly update buying and selling prices for all your active fuel products.
                        </p>
                    </div>
                </div>

                {/* Info Alert */}
                <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-2xl shadow-sm">
                    <Info size={20} className="text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm font-medium">
                        Changes made here will instantly reflect on the POS (Sales) screen and new purchase invoices. Previous transactions will not be affected.
                    </p>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
                    <form onSubmit={handleSubmit}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-700">
                                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-5">Fuel Type & Unit</th>
                                        <th className="px-6 py-5 w-64">Buying Price (Per Unit)</th>
                                        <th className="px-6 py-5 w-64">Selling Price (Per Unit)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {data.prices.length > 0 ? (
                                        data.prices.map((item, index) => (
                                            <tr key={item.id} className="transition-colors hover:bg-slate-50/50 group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold uppercase text-xs">
                                                            {item.name.substring(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-slate-900 text-base">{item.name}</div>
                                                            <div className="text-xs font-medium text-slate-500 mt-0.5 bg-slate-100 px-2 py-0.5 rounded-md inline-block">Sold in: {item.unit}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="relative group-hover:scale-[1.02] transition-transform">
                                                        <span className="absolute left-4 top-3 text-slate-400 font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>৳</span>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={item.buying_price}
                                                            onChange={(e) => handlePriceChange(index, 'buying_price', e.target.value)}
                                                            className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-base font-semibold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="relative group-hover:scale-[1.02] transition-transform">
                                                        <span className="absolute left-4 top-3 text-emerald-500 font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>৳</span>
                                                        <input
                                                            type="number"
                                                            step="any"
                                                            value={item.selling_price}
                                                            onChange={(e) => handlePriceChange(index, 'selling_price', e.target.value)}
                                                            className="w-full h-12 rounded-xl border border-emerald-200 bg-emerald-50 pl-9 pr-4 text-lg font-black text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/20 shadow-sm"
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="p-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <DollarSign size={40} className="text-slate-200" />
                                                    <p className="font-medium text-slate-500">No active fuel products found. Please add fuel items in the products section first.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Action */}
                        <div className="flex items-center justify-end gap-3 bg-slate-50/80 px-6 py-5 border-t border-slate-100">
                            <button
                                type="submit"
                                disabled={processing || data.prices.length === 0}
                                className="flex items-center gap-2 h-12 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <Save size={18} /> Update All Fuel Prices
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
