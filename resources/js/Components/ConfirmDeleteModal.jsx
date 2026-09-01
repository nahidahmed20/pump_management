import React from "react";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDeleteModal({ item, onCancel, onConfirm }) {
    if (!item) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm transition-opacity">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                    <div className="flex items-center gap-2.5 text-red-600">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50">
                            <AlertTriangle size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">
                            Confirm Deletion
                        </h3>
                    </div>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-slate-900">
                            "{item.name || item.title || "this item"}"
                        </span>
                        ? This action is permanent and cannot be undone.
                    </p>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="h-10 px-5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="h-10 px-6 rounded-lg bg-red-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-500"
                    >
                        Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
}