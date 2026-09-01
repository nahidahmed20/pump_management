import { useState, useEffect, useRef } from "react";
import { Link } from "@inertiajs/react";
import { Search, Loader2, Receipt, Users, ShoppingBag } from "lucide-react";
import axios from "axios";

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`/admin/global-search?q=${query}`);
                setResults(response.data);
                setIsOpen(true);
            } catch (error) {
                console.error("Search failed", error);
            } finally {
                setIsLoading(false);
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [query]);

    const getResultMeta = (item) => {
        switch (item.type) {
            case "invoice":
                return { icon: <Receipt size={16} className="text-blue-500" />, link: `/admin/invoices/${item.id}`, label: "Sale" };
            case "party":
                return { icon: <Users size={16} className="text-amber-500" />, link: `/admin/reports/customer-due?search=${item.title}`, label: "Party" };
            case "purchase":
                return { icon: <ShoppingBag size={16} className="text-emerald-500" />, link: `/admin/purchases`, label: "Purchase" };
            default:
                return { icon: <Search size={16} />, link: "#", label: "Result" };
        }
    };

    return (
        <div className="relative w-full max-w-md" ref={searchRef}>
            <div className="relative flex items-center">
                <Search size={18} className="absolute left-3 text-slate-400" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim() && setIsOpen(true)}
                    placeholder="Search invoices, parties, or phone..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-10 text-sm text-slate-800 outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
                {isLoading && <Loader2 size={16} className="absolute right-3 animate-spin text-amber-500" />}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute left-0 top-12 z-50 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                    {results.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {results.map((item, idx) => {
                                const meta = getResultMeta(item);
                                return (
                                    <Link
                                        key={idx}
                                        href={meta.link}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-slate-50"
                                    >
                                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                            {meta.icon}
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <p className="truncate text-sm font-bold text-slate-800">{item.title}</p>
                                            <p className="truncate text-[11px] font-medium text-slate-500">
                                                {item.subtitle || "No details"}
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            {meta.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-sm text-slate-500">
                            No results found for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
