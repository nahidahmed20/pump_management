import { useState, useEffect } from "react";
import { Head, useForm, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    ShoppingCart, Plus, Trash2, Search, ArrowLeft, Save, Truck, PackageSearch, Store, Database, X
} from "lucide-react";

export default function PurchaseEdit({ purchase, suppliers, products, tanks, accounts }) {
    const [searchProduct, setSearchProduct] = useState("");

    // Inertia Form State
    const { data, setData, put, processing } = useForm({
        reference_no: purchase.reference_no || "",
        supplier_id: purchase.supplier_id || "",
        sub_total: Number(purchase.sub_total) || 0,
        discount: Number(purchase.discount) || 0,
        grand_total: Number(purchase.grand_total) || 0,
        cart: (purchase.details || purchase.items || []).map(item => ({
            id: item.product_id || item.product?.id || item.id,
            name: item.product?.name || item.name,
            unit: item.product?.unit || item.unit || "Pcs",
            quantity: Number(item.quantity) || 1,
            unit_price: Number(item.unit_price) || 0,
            total_price: Number(item.total_price) || (Number(item.quantity) * Number(item.unit_price)),
            tank_id: item.tank_id || ""
        })),
        payments: purchase.payments?.length ? purchase.payments.map(p => ({
            account_id: p.account_id,
            amount: Number(p.amount)
        })) : [ { account_id: purchase.account_id || "", amount: Number(purchase.paid_amount) || "" } ],
    });

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchProduct.toLowerCase())
    );

    const addToCart = (product) => {
        const existingItem = data.cart.find(item => item.id === product.id);
        if (existingItem) {
            Swal.fire({
                icon: 'info', title: 'Already Added', text: 'This product is already in the list. Please update the quantity.',
                toast: true, position: 'top-end', timer: 3000, showConfirmButton: false,
                customClass: { popup: 'rounded-2xl shadow-lg border border-slate-100' }
            });
        } else {
            setData("cart", [
                ...data.cart,
                {
                    id: product.id, name: product.name, unit: product.unit,
                    quantity: 1, unit_price: product.buying_price || 0,
                    total_price: product.buying_price || 0, tank_id: ""
                }
            ]);
        }
    };

    const updateCartItem = (id, field, value) => {
        if ((field === 'quantity' || field === 'unit_price') && value < 0) return;
        const updatedCart = data.cart.map(item => {
            if (item.id === id) {
                const updatedItem = field === 'tank_id' ? { ...item, [field]: value } : { ...item, [field]: Number(value) };
                updatedItem.total_price = (updatedItem.quantity || 0) * (updatedItem.unit_price || 0);
                return updatedItem;
            }
            return item;
        });
        setData("cart", updatedCart);
    };

    const removeFromCart = (id) => setData("cart", data.cart.filter(item => item.id !== id));

    // Dynamic Payment Handlers
    const handlePaymentChange = (index, field, value) => {
        const updatedPayments = [...data.payments];
        updatedPayments[index][field] = value;
        setData('payments', updatedPayments);
    };

    const addPaymentRow = () => setData('payments', [...data.payments, { account_id: "", amount: "" }]);
    const removePaymentRow = (index) => {
        if (data.payments.length > 1) setData('payments', data.payments.filter((_, i) => i !== index));
    };

    useEffect(() => {
        const subTotal = data.cart.reduce((sum, item) => sum + (Number(item.total_price) || 0), 0);
        const discountAmt = Number(data.discount) || 0;
        const grandTotal = subTotal - discountAmt;

        setData(prev => ({
            ...prev,
            sub_total: subTotal,
            grand_total: grandTotal > 0 ? grandTotal : 0,
        }));
    }, [data.cart, data.discount]);

    const totalPaidAmount = data.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const dueAmount = data.grand_total > totalPaidAmount ? (data.grand_total - totalPaidAmount) : 0;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!data.supplier_id) return Swal.fire({ icon: "warning", title: "Missing Info", text: "Please select a supplier.", customClass: { popup: 'rounded-2xl' } });
        if (data.cart.length === 0) return Swal.fire({ icon: "warning", title: "Empty List", text: "Please add at least one product.", customClass: { popup: 'rounded-2xl' } });
        if (data.cart.some(item => Number(item.unit_price) <= 0)) return Swal.fire({ icon: "warning", title: "Invalid Price", text: "Unit price must be greater than 0.", customClass: { popup: 'rounded-2xl' } });

        const hasInvalidPayment = data.payments.some(p => Number(p.amount) > 0 && !p.account_id);
        if (hasInvalidPayment) return Swal.fire({ icon: "warning", title: "Select Account", text: "Please select an account for the entered payment amount.", customClass: { popup: 'rounded-2xl' } });

        put(`/admin/purchases/${purchase.id}`, {
            onSuccess: (page) => {
                if(Object.keys(page.props.errors || {}).length === 0) {
                    Swal.fire({ icon: "success", title: "Purchase Updated!", text: "Stock records updated successfully.", confirmButtonColor: "#10b981", customClass: { popup: 'rounded-2xl' } });
                }
            },
            onError: (errors) => {
                if (!errors.account_id) Swal.fire({ icon: 'error', title: 'Action Failed', text: Object.values(errors)[0], confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-2xl' } });
            }
        });
    };

    return (
        <AdminLayout title={`Edit Purchase #${data.reference_no}`} icon={Truck}>
            <Head title={`Edit Purchase | FuelDesk`} />

            <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Edit Purchase Record</h2>
                        <p className="text-sm text-slate-500 mt-1">Modify items, quantities, and update supplier ledger.</p>
                    </div>
                    <Link href="/admin/purchases" className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">
                        <ArrowLeft size={18} /> Back to List
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT SIDE: Product Selection */}
                    <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-5">
                        <div className="relative">
                            <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search products by name or category..."
                                value={searchProduct}
                                onChange={(e) => setSearchProduct(e.target.value)}
                                className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[65vh] custom-scrollbar pb-4 pr-1">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => {
                                    const catType = product.category?.type || 'general';
                                    const badgeColor = catType === 'fuel' ? 'bg-purple-100 text-purple-700' : catType === 'gas' ? 'bg-teal-100 text-teal-700' : catType === 'lube' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700';

                                    return (
                                        <div key={product.id} onClick={() => addToCart(product)} className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 transition-all active:scale-95 group">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeColor}`}>{product.category?.name || "Gen"}</span>
                                                </div>
                                                <div className="font-bold text-slate-800 text-sm leading-snug group-hover:text-amber-600 transition-colors">{product.name}</div>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                                <div className="text-xs font-bold text-slate-400">Stock: <span className="text-slate-700">{Number(product.current_stock || 0).toFixed(1)} {product.unit}</span></div>
                                                <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0 shadow-sm"><Plus size={16} /></div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 bg-white rounded-2xl border border-slate-200 border-dashed">
                                    <PackageSearch size={48} className="text-slate-300 mb-3" />
                                    <p className="text-sm font-bold">No products found matching your search.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDE: Cart & Billing */}
                    <div className="lg:col-span-6 xl:col-span-5">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col lg:sticky lg:top-24 h-auto lg:h-[calc(100vh-110px)] max-h-[85vh]">
                            <div className="p-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2"><ShoppingCart size={18} className="text-amber-500" /> Purchase Cart</h3>
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-sm">REF: {data.reference_no}</span>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5"><Store size={12}/> Select Supplier <span className="text-rose-500">*</span></label>
                                    <select value={data.supplier_id} onChange={(e) => setData("supplier_id", e.target.value)} className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-sm transition-all cursor-pointer" required>
                                        <option value="">-- Choose Supplier --</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} {s.phone ? `- ${s.phone}` : ''}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50 min-h-[150px]">
                                {data.cart.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.cart.map((item) => (
                                            <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                                                <button type="button" onClick={() => removeFromCart(item.id)} className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm z-10"><X size={12} strokeWidth={3} /></button>
                                                <div className="font-bold text-slate-800 text-sm mb-2.5 pr-4">{item.name} <span className="text-[10px] font-semibold text-amber-600 ml-1 px-1.5 py-0.5 bg-amber-50 rounded-md border border-amber-100">{item.unit}</span></div>
                                                <div className="flex items-center gap-2 mb-2.5">
                                                    <div className="w-20 sm:w-24">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Buy Qty</label>
                                                        <input type="number" min="0" step="any" placeholder="Qty" value={item.quantity} onChange={(e) => updateCartItem(item.id, 'quantity', e.target.value)} className="w-full h-8 px-2 text-sm font-bold text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:border-amber-500 focus:bg-white outline-none" />
                                                    </div>
                                                    <span className="text-slate-300 font-bold text-sm mt-4">×</span>
                                                    <div className="w-24 sm:w-28">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Unit Price (৳)</label>
                                                        <input type="number" min="0" step="any" placeholder="Price" value={item.unit_price} onChange={(e) => updateCartItem(item.id, 'unit_price', e.target.value)} className="w-full h-8 px-2 text-sm font-bold text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:border-amber-500 focus:bg-white outline-none" />
                                                    </div>
                                                    <span className="text-slate-300 font-bold text-sm mt-4">=</span>
                                                    <div className="flex-1 text-right mt-4 font-black text-slate-900 text-sm sm:text-base overflow-hidden text-ellipsis whitespace-nowrap">
                                                        <span className="text-slate-400 font-medium text-[10px] mr-0.5">৳</span>{Number(item.total_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                                    <div className="bg-slate-100 p-1.5 rounded-lg text-slate-400 border border-slate-200"><Database size={14} /></div>
                                                    <select value={item.tank_id || ""} onChange={(e) => updateCartItem(item.id, 'tank_id', e.target.value)} className="flex-1 h-8 px-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg focus:border-amber-500 outline-none cursor-pointer">
                                                        <option value="">-- Unload to Tank --</option>
                                                        {tanks && tanks.map(tank => <option key={tank.id} value={tank.id}>{tank.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-slate-400">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 border border-slate-200"><ShoppingCart size={24} className="text-slate-300" /></div>
                                        <p className="text-sm font-bold text-slate-500">Your cart is empty.</p>
                                    </div>
                                )}
                            </div>

                            {/* Billing Summary & Split Payments */}
                            <div className="p-4 bg-slate-900 rounded-b-2xl shrink-0 text-white flex flex-col gap-3">

                                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                                    <span>Sub Total</span><span>৳ {data.sub_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                                    <span>Discount</span>
                                    <div className="relative w-28">
                                        <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">৳</span>
                                        <input type="number" min="0" value={data.discount} onChange={(e) => setData("discount", e.target.value)} className="w-full h-8 pl-6 pr-2 text-right text-xs font-bold rounded-lg border border-slate-700 bg-slate-800 text-white outline-none focus:border-amber-500" />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-200">Grand Total</span>
                                    <span className="text-xl font-black text-amber-400">৳ {data.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>

                                {/* Multi-Payment Section */}
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                                    <div className="flex justify-between items-center mb-2.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Details</label>
                                        <button type="button" onClick={addPaymentRow} className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-1 rounded hover:bg-amber-500/20 transition-colors border border-amber-500/20">
                                            + Add Method
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                                        {data.payments.map((payment, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <div className="flex-1">
                                                    <select
                                                        value={payment.account_id}
                                                        onChange={(e) => handlePaymentChange(index, "account_id", e.target.value)}
                                                        className="w-full h-9 px-2 text-[11px] font-bold rounded-lg border border-slate-600 bg-slate-700/50 text-white outline-none focus:border-amber-500 cursor-pointer"
                                                    >
                                                        <option value="">Account / Cash</option>
                                                        {accounts && accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="w-24 relative">
                                                    <input
                                                        type="number" min="0" step="any" placeholder="Amount"
                                                        value={payment.amount}
                                                        onChange={(e) => handlePaymentChange(index, "amount", e.target.value)}
                                                        className="w-full h-9 px-2 text-right text-xs font-black rounded-lg border border-slate-600 bg-slate-900 text-emerald-400 outline-none focus:border-emerald-500"
                                                    />
                                                </div>
                                                {data.payments.length > 1 && (
                                                    <button type="button" onClick={() => removePaymentRow(index)} className="w-7 h-9 flex items-center justify-center text-slate-500 hover:text-rose-400 bg-slate-800 rounded-lg shrink-0">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-700">
                                        <span className="text-[11px] font-bold text-slate-400">Total Paid</span>
                                        <span className="text-sm font-black text-emerald-400">৳ {totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                {dueAmount > 0 && (
                                    <div className="flex justify-between items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                                        <span>Current Due</span>
                                        <span>৳ {dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}

                                <button type="submit" disabled={processing || data.cart.length === 0} className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-black text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 active:scale-[0.98]">
                                    <Save size={18} /> Update Purchase Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
