import { useState, useEffect, useMemo } from "react";
import { Head, useForm, Link, usePage } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import Swal from "sweetalert2";
import {
    ShoppingCart, Plus, Trash2, Search, ArrowLeft, Save, AlertTriangle, PackageSearch, Users, X,
    Truck, FileText, Gauge, ChevronDown, ChevronUp
} from "lucide-react";

export default function POSCreate({ openShift, customers, vehicles = [], products, accounts, invoice_no }) {
    const { props } = usePage();
    const settings = props.settings || {};
    const currency = settings.currency_symbol || "৳";

    const [searchProduct, setSearchProduct] = useState("");
    const [showVehicleSection, setShowVehicleSection] = useState(false);

    // Inertia Form State with Multiple Payments & Vehicle Support
    const { data, setData, post, processing, errors } = useForm({
        invoice_no: invoice_no,
        customer_id: "",
        vehicle_id: "",
        vehicle_no: "",
        slip_no: "",
        odometer_km: "",
        driver_name: "",
        sub_total: 0,
        discount: 0,
        grand_total: 0,
        cart: [],
        payments: [
            { account_id: "", amount: "" }
        ],
    });

    // Filter products based on search
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        p.category?.name.toLowerCase().includes(searchProduct.toLowerCase())
    );

    // Add item to cart
    const addToCart = (product) => {
        const existingItem = data.cart.find(item => item.id === product.id);

        if (existingItem) {
            const updatedCart = data.cart.map(item => {
                if (item.id === product.id) {
                    const newQty = Number(item.quantity) + 1;
                    return { ...item, quantity: newQty, total_price: newQty * item.unit_price };
                }
                return item;
            });
            setData("cart", updatedCart);
        } else {
            setData("cart", [
                ...data.cart,
                {
                    id: product.id,
                    name: product.name,
                    unit: product.unit,
                    quantity: 1,
                    unit_price: Number(product.selling_price) || 0,
                    total_price: Number(product.selling_price) || 0
                }
            ]);
        }
    };

    // Update quantity in cart
    const updateQuantity = (id, newQty) => {
        if (newQty !== "" && Number(newQty) < 0) return;

        const updatedCart = data.cart.map(item => {
            if (item.id === id) {
                const numericQty = Number(newQty) || 0;
                return {
                    ...item,
                    quantity: newQty,
                    total_price: numericQty * item.unit_price
                };
            }
            return item;
        });
        setData("cart", updatedCart);
    };

    // Remove item from cart
    const removeFromCart = (id) => {
        setData("cart", data.cart.filter(item => item.id !== id));
    };

    // Dynamic Payment Handlers
    const handlePaymentChange = (index, field, value) => {
        const updatedPayments = [...data.payments];
        updatedPayments[index][field] = value;
        setData('payments', updatedPayments);
    };

    const addPaymentRow = () => {
        setData('payments', [...data.payments, { account_id: "", amount: "" }]);
    };

    const removePaymentRow = (index) => {
        if (data.payments.length > 1) {
            setData('payments', data.payments.filter((_, i) => i !== index));
        }
    };

    // Calculate Totals automatically
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

    const customerVehicles = useMemo(() => {
        if (!data.customer_id) return [];
        return vehicles.filter(v => String(v.party_id) === String(data.customer_id));
    }, [vehicles, data.customer_id]);

    useEffect(() => {
        if (data.customer_id && customerVehicles.length > 0) {
            setShowVehicleSection(true);
        }
    }, [data.customer_id, customerVehicles.length]);

    const handleSelectVehicle = (vehicleId) => {
        if (!vehicleId) {
            setData(prev => ({ ...prev, vehicle_id: "", vehicle_no: "" }));
            return;
        }
        const selected = vehicles.find(v => String(v.id) === String(vehicleId));
        if (selected) {
            setData(prev => ({
                ...prev,
                vehicle_id: selected.id,
                vehicle_no: selected.vehicle_no,
                driver_name: selected.driver_name || prev.driver_name,
            }));
        }
    };

    const totalPaidAmount = data.payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);
    const dueAmount = data.grand_total > totalPaidAmount ? (data.grand_total - totalPaidAmount) : 0;

    // Handle Form Submit
    const handleSubmit = (e) => {
        e.preventDefault();

        if (data.cart.length === 0) {
            Swal.fire({ icon: "warning", title: "Empty Cart", text: "Please add at least one product to the cart.", customClass: { popup: 'rounded-2xl' } });
            return;
        }

        // যদি ডিউ থাকে এবং কাস্টমার সিলেক্ট না করা থাকে
        if (dueAmount > 0 && !data.customer_id) {
            Swal.fire({ icon: "warning", title: "Customer Required", text: "Please select a customer for due/baki sales.", customClass: { popup: 'rounded-2xl' } });
            return;
        }

        // যদি কোনো পেমেন্ট রো তে অ্যামাউন্ট থাকে কিন্তু অ্যাকাউন্ট সিলেক্ট করা না থাকে
        const hasInvalidPayment = data.payments.some(p => Number(p.amount) > 0 && !p.account_id);
        if (hasInvalidPayment) {
            Swal.fire({ icon: "warning", title: "Select Account", text: "Please select an account for the entered payment amount.", customClass: { popup: 'rounded-2xl' } });
            return;
        }

        post("/admin/invoices", {
            onSuccess: (page) => {
                if(Object.keys(page.props.errors || {}).length === 0) {
                    Swal.fire({ icon: "success", title: "Sale Completed!", text: "Invoice has been generated successfully.", confirmButtonColor: "#10b981", customClass: { popup: 'rounded-2xl' } });
                }
            },
            onError: (errors) => {
                Swal.fire({ icon: 'error', title: 'Action Failed', text: Object.values(errors)[0], confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-2xl' } });
            }
        });
    };

    return (
        <AdminLayout title="Point of Sale (POS)" icon={ShoppingCart}>
            <Head title="New Sale | FuelDesk" />

            <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">

                {/* Shift Warning Banner */}
                {!openShift && (
                    <div className="mb-6 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-5 py-4 rounded-2xl shadow-sm">
                        <AlertTriangle className="text-rose-600 shrink-0" size={24} />
                        <div>
                            <span className="font-bold text-base">No Active Shift Found! </span>
                            <span className="text-sm block mt-0.5">You are making a sale without an open shift. Cash collections won't be synced with daily shift drawer.</span>
                        </div>
                    </div>
                )}

                {/* Header Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Point of Sale (POS Counter)</h2>
                        <p className="text-sm text-slate-500 mt-1">Generate sales invoices and collect split payments instantly.</p>
                    </div>
                    <Link href="/admin/invoices" className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors">
                        <ArrowLeft size={18} /> Back to Invoices
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ================= LEFT SIDE: Product Selection ================= */}
                    <div className="lg:col-span-6 xl:col-span-7 flex flex-col gap-5">

                        {/* Search Bar */}
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

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[65vh] custom-scrollbar pb-4 pr-1">
                            {filteredProducts.length > 0 ? (
                                filteredProducts.map(product => {
                                    const catType = product.category?.type || 'general';
                                    const badgeColor =
                                        catType === 'fuel' ? 'bg-purple-100 text-purple-700' :
                                        catType === 'gas' ? 'bg-teal-100 text-teal-700' :
                                        catType === 'lube' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-100 text-slate-700';

                                    return (
                                        <div
                                            key={product.id}
                                            onClick={() => addToCart(product)}
                                            className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 transition-all active:scale-95 group"
                                        >
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${badgeColor}`}>
                                                        {product.category?.name || "Gen"}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-slate-800 text-sm leading-snug group-hover:text-amber-600 transition-colors">
                                                    {product.name}
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                                                <div className="text-xs font-black text-slate-900">
                                                    {currency} {Number(product.selling_price).toFixed(2)}
                                                </div>
                                                <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0 shadow-sm">
                                                    <Plus size={16} />
                                                </div>
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

                    {/* ================= RIGHT SIDE: Cart & Billing ================= */}
                    <div className="lg:col-span-6 xl:col-span-5">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col lg:sticky lg:top-24 h-auto lg:h-[calc(100vh-110px)] max-h-[85vh]">

                            {/* Cart Header */}
                            <div className="p-4 border-b border-slate-100 bg-slate-50/80 rounded-t-2xl shrink-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                        <ShoppingCart size={18} className="text-amber-500" />
                                        Current Sale Cart
                                    </h3>
                                    <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-sm">
                                        INV: {data.invoice_no}
                                    </span>
                                </div>

                                {/* Customer Selection */}
                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1.5"><Users size={12}/> Select Customer <span className="text-rose-500">*</span></label>
                                    <select
                                        value={data.customer_id}
                                        onChange={(e) => setData("customer_id", e.target.value)}
                                        className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-sm transition-all cursor-pointer"
                                    >
                                        <option value="">Walk-in Customer (Cash)</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.phone ? `- ${c.phone}` : ''}</option>
                                        ))}
                                    </select>
                                    {dueAmount > 0 && !data.customer_id && (
                                        <p className="text-[11px] text-rose-500 font-bold mt-1">Customer required for due/baki sale.</p>
                                    )}
                                </div>

                                {/* Fleet Vehicle & Slip Details */}
                                <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
                                    <button
                                        type="button"
                                        onClick={() => setShowVehicleSection(!showVehicleSection)}
                                        className="flex items-center justify-between w-full text-[11px] font-bold text-slate-700 hover:text-amber-600 transition-colors py-1"
                                    >
                                        <span className="flex items-center gap-1.5">
                                            <Truck size={13} className="text-amber-500" />
                                            Vehicle & Slip Info (গাড়ির স্লিপ)
                                            {(data.vehicle_no || data.slip_no) && (
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                                            )}
                                        </span>
                                        {showVehicleSection ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                    </button>

                                    {(showVehicleSection || data.vehicle_no || data.slip_no || customerVehicles.length > 0) && (
                                        <div className="mt-2 space-y-2 bg-white/70 p-2.5 rounded-xl border border-slate-200/70 text-xs animate-in fade-in">
                                            {/* Registered Vehicles of this Customer */}
                                            {customerVehicles.length > 0 && (
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                        Select Customer Vehicle
                                                    </label>
                                                    <select
                                                        value={data.vehicle_id}
                                                        onChange={(e) => handleSelectVehicle(e.target.value)}
                                                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold outline-none focus:border-amber-500"
                                                    >
                                                        <option value="">-- Choose fleet vehicle --</option>
                                                        {customerVehicles.map((v) => (
                                                            <option key={v.id} value={v.id}>
                                                                {v.vehicle_no} ({v.vehicle_type || "Vehicle"})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                        Vehicle No
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="DHAKA METRO..."
                                                        value={data.vehicle_no}
                                                        onChange={(e) => setData("vehicle_no", e.target.value.toUpperCase())}
                                                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold uppercase outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                        Slip / Indent No
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Slip #104"
                                                        value={data.slip_no}
                                                        onChange={(e) => setData("slip_no", e.target.value)}
                                                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                        Driver Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Driver name"
                                                        value={data.driver_name}
                                                        onChange={(e) => setData("driver_name", e.target.value)}
                                                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                                        Odometer (KM)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        placeholder="KM reading"
                                                        value={data.odometer_km}
                                                        onChange={(e) => setData("odometer_km", e.target.value)}
                                                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cart Items List */}
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar bg-slate-50/50 min-h-[150px]">
                                {data.cart.length > 0 ? (
                                    <div className="space-y-3">
                                        {data.cart.map((item) => (
                                            <div key={item.id} className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm relative group">

                                                {/* Delete Button */}
                                                <button
                                                    type="button"
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm z-10"
                                                    title="Remove Item"
                                                >
                                                    <X size={12} strokeWidth={3} />
                                                </button>

                                                {/* Item Name */}
                                                <div className="font-bold text-slate-800 text-sm mb-2.5 pr-4">
                                                    {item.name} <span className="text-[10px] font-semibold text-amber-600 ml-1 px-1.5 py-0.5 bg-amber-50 rounded-md border border-amber-100">{item.unit}</span>
                                                </div>

                                                {/* Qty & Price Grid */}
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 sm:w-24">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Quantity</label>
                                                        <input
                                                            type="number"
                                                            min="0" step="any"
                                                            placeholder="Qty"
                                                            value={item.quantity}
                                                            onChange={(e) => updateQuantity(item.id, e.target.value)}
                                                            className="w-full h-8 px-2 text-sm font-bold text-center text-slate-800 bg-slate-50 border border-slate-200 rounded-lg focus:border-amber-500 focus:bg-white outline-none transition-colors"
                                                        />
                                                    </div>
                                                    <span className="text-slate-300 font-bold text-sm mt-4">×</span>
                                                    <div className="w-24 sm:w-28 text-center">
                                                        <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Unit Price</label>
                                                        <div className="h-8 flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-100 rounded-lg">
                                                            {currency} {item.unit_price}
                                                        </div>
                                                    </div>
                                                    <span className="text-slate-300 font-bold text-sm mt-4">×</span>
                                                    <div className="flex-1 text-right mt-4">
                                                        <div className="font-black text-slate-900 text-sm sm:text-base overflow-hidden text-ellipsis whitespace-nowrap">
                                                            <span className="text-slate-400 font-medium text-[10px] mr-0.5">{currency}</span>
                                                            {item.total_price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-slate-400">
                                        <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-3 border border-slate-200">
                                            <ShoppingCart size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-500">Your cart is empty.</p>
                                        <p className="text-[11px] font-medium text-slate-400 mt-1">Click on products to add them.</p>
                                    </div>
                                )}
                            </div>

                            {/* Billing Summary & Split Payments */}
                            <div className="p-4 bg-slate-900 rounded-b-2xl shrink-0 text-white space-y-3">

                                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-300">
                                    <span>Sub Total</span>
                                    <span className="text-white">{currency} {data.sub_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold text-slate-300">
                                    <span>Discount</span>
                                    <div className="relative w-28">
                                        <span className="absolute left-2.5 top-1.5 text-slate-400 text-xs">{currency}</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={data.discount}
                                            onChange={(e) => setData("discount", e.target.value)}
                                            className="w-full h-8 pl-6 pr-2 text-right text-xs font-bold rounded-lg border border-slate-700 bg-slate-800 text-white outline-none focus:border-amber-500 transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-700/50 flex justify-between items-center">
                                    <span className="text-sm font-bold text-slate-200">Grand Total</span>
                                    <span className="text-xl font-black text-amber-400">{currency} {data.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>

                                {/* Multi-Payment Section (Cash + Card + Mobile Banking) */}
                                <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/80">
                                    <div className="flex justify-between items-center mb-2.5">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Details (Split)</label>
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
                                                        <option value="">Select Account / Cash</option>
                                                        {accounts && accounts.map(a => (
                                                            <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                                                        ))}
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
                                        <span className="text-sm font-black text-emerald-400">{currency} {totalPaidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                {dueAmount > 0 && (
                                    <div className="flex justify-between items-center text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">
                                        <span>Current Due (Baki)</span>
                                        <span>{currency} {dueAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={processing || data.cart.length === 0}
                                    className="w-full h-11 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-black text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 active:scale-[0.98]"
                                >
                                    <Save size={18} /> {dueAmount > 0 ? 'Save Due Sale' : 'Complete Sale'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </AdminLayout>
    );
}
