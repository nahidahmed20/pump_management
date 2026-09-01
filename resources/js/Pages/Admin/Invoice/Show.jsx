import React from "react";
import { Head, Link } from "@inertiajs/react";
import AdminLayout from "@/Layouts/AdminLayout";
import { Printer, ArrowLeft, Fuel } from "lucide-react";

export default function InvoiceShow({ invoice }) {

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const formatMoney = (amount) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

    return (
        <AdminLayout title={`Invoice - ${invoice.invoice_no}`} icon={Printer}>
            <Head title={`Print Invoice ${invoice.invoice_no}`} />

            <style type="text/css" media="print">
                {`
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                    body * {
                        visibility: hidden;
                    }
                    #printable-invoice, #printable-invoice * {
                        visibility: visible;
                    }
                    #printable-invoice {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                    }
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    tr {
                        page-break-inside: avoid;
                    }
                `}
            </style>

            <div className="mb-6 flex items-center justify-between print:hidden">
                <Link href="/admin/invoices" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors">
                    <ArrowLeft size={16} /> Back to Sales
                </Link>
                <button
                    onClick={handlePrint}
                    className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-6 text-sm font-bold text-slate-900 shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    <Printer size={18} /> Print Invoice
                </button>
            </div>

            <div id="printable-invoice" className="mx-auto w-full max-w-3xl bg-white p-10 text-slate-800 shadow-xl border border-slate-200 rounded-3xl">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-100 pb-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-slate-900 shadow-sm">
                            <Fuel size={36} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900">M/S ABC FILLING STATION</h1>
                            <p className="text-sm text-slate-500">123 Highway Road, Dhaka, Bangladesh</p>
                            <p className="text-sm text-slate-500">Phone: +880 1700-000000</p>
                        </div>
                    </div>
                    <div className="mt-4 sm:mt-0 text-right">
                        <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest">Invoice</h2>
                        <div className="text-sm font-bold mt-1 text-slate-700">{invoice.invoice_no}</div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="flex justify-between mb-8">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400 mb-1">Billed To:</p>
                        {invoice.customer ? (
                            <>
                                <h3 className="text-base font-bold text-slate-800">{invoice.customer.name}</h3>
                                <p className="text-sm text-slate-600">{invoice.customer.phone}</p>
                                <p className="text-sm text-slate-600 w-48">{invoice.customer.address || "N/A"}</p>
                            </>
                        ) : (
                            <h3 className="text-base font-bold text-slate-800">Walk-in Customer (Cash)</h3>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="mb-3">
                            <p className="text-xs font-bold uppercase text-slate-400">Date & Time:</p>
                            <p className="text-sm font-semibold text-slate-800">{formatDate(invoice.created_at)}</p>
                        </div>
                        <div className="mb-3">
                            <p className="text-xs font-bold uppercase text-slate-400">Served By:</p>
                            <p className="text-sm font-semibold text-slate-800">{invoice.shift?.user?.name || "Admin"}</p>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-5 py-4 w-12 text-center">#</th>
                                <th className="px-5 py-4">Description</th>
                                <th className="px-5 py-4 text-center">Qty</th>
                                <th className="px-5 py-4 text-right">Unit Price</th>
                                <th className="px-5 py-4 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-700">
                            {invoice.items && invoice.items.map((item, index) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4 text-center text-slate-400">{index + 1}</td>
                                    <td className="px-5 py-4 font-bold text-slate-800">
                                        {item.product?.name}
                                        <span className="text-xs text-slate-400 font-normal ml-1.5">({item.product?.category?.name || "General"})</span>
                                    </td>
                                    <td className="px-5 py-4 text-center font-bold text-slate-700">
                                        {Number(item.quantity).toFixed(2)} {item.product?.unit}
                                    </td>
                                    <td className="px-5 py-4 text-right text-slate-600 font-semibold">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(item.unit_price)}
                                    </td>
                                    <td className="px-5 py-4 text-right font-black text-slate-900">
                                        <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(item.total_price)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Calculation Summary */}
                <div className="flex justify-end mb-10">
                    <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-2.5 shadow-sm">
                        <div className="flex justify-between text-sm text-slate-600">
                            <span className="font-semibold">Subtotal:</span>
                            <span className="font-bold text-slate-700"><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(invoice.sub_total)}</span>
                        </div>
                        {Number(invoice.discount) > 0 && (
                            <div className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-2.5">
                                <span className="font-semibold">Discount:</span>
                                <span className="font-bold text-rose-500">- <span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(invoice.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-1 text-base font-bold text-slate-800">
                            <span>Grand Total:</span>
                            <span className="text-lg font-black text-slate-900"><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(invoice.grand_total)}</span>
                        </div>

                        <div className="flex justify-between text-sm font-bold text-emerald-600 pt-1">
                            <span>Paid Amount:</span>
                            <span><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(invoice.paid_amount)}</span>
                        </div>
                        {Number(invoice.due_amount) > 0 && (
                            <div className="flex justify-between text-sm font-bold text-rose-600 pt-1">
                                <span>Due Amount:</span>
                                <span><span style={{ fontFamily: 'Arial, sans-serif' }}>৳</span> {formatMoney(invoice.due_amount)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="border-t border-slate-200 pt-6 text-center">
                    <p className="font-bold text-slate-800 text-base mb-1">Thank You For Your Business!</p>
                    <p className="text-xs text-slate-400">Goods once sold cannot be returned. If you have any questions concerning this invoice, please contact our support.</p>
                </div>

                {/* Signature Section */}
                <div className="mt-16 flex justify-between px-6">
                    <div className="border-t border-slate-400 w-44 text-center text-xs font-semibold text-slate-600 pt-2">Customer Signature</div>
                    <div className="border-t border-slate-400 w-44 text-center text-xs font-semibold text-slate-600 pt-2">Authorized Seal & Sign</div>
                </div>

            </div>
        </AdminLayout>
    );
}
