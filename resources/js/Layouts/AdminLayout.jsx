import { useState, useMemo, useRef, useEffect } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import GlobalSearch from "@/Components/GlobalSearch";
import {
    LayoutDashboard, ShoppingCart, PackagePlus, Fuel, Boxes, Wallet,
    BarChart3, ShieldCheck, Settings, ChevronDown, Bell,
    PanelLeftClose, PanelLeftOpen, LogOut, UserCircle, Activity, Menu, X,
} from "lucide-react";

const MENU = [
    {
        id: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view", href: "/"
    },
    {
        id: "master-setup", label: "Master Setup", icon: Settings, permission: "setup.view",
        children: [
            { label: "System Settings", href: "/admin/settings" },
            { label: "Categories", href: "/admin/categories" },
            { label: "Products (Fuel/Lube)", href: "/admin/products", permission: "products.view" },
            { label: "Tanks", href: "/admin/tanks" },
            { label: "Nozzles", href: "/admin/nozzles" },
            { label: "Fuel Price Update", href: "/admin/fuel-prices", permission: "products.view" },
        ],
    },
    {
        id: "finance", label: "Accounts & Finance", icon: Wallet, permission: "accounts.view",
        children: [
            { label: "Parties (Customer/Supplier)", href: "/admin/parties" },
            { label: "Accounts (Bank/Cash)", href: "/admin/accounts" },
            { label: "Payments (Receive/Pay)", href: "/admin/payments" },
            { label: "Daily Expenses", href: "/admin/expenses" },
            { label: "Transactions", href: "/admin/transactions" },
        ],
    },
    {
        id: "purchase", label: "Purchases", icon: PackagePlus, permission: "purchases.view",
        children: [
            { label: "New Purchase", href: "/admin/purchases/create" },
            { label: "Purchase History", href: "/admin/purchases" },
        ],
    },
    {
        id: "inventory", label: "Inventory & Stock", icon: Boxes, permission: "products.view",
        children: [
            { label: "Stock Adjustment", href: "/admin/stock-adjustments" },
        ],
    },
    {
        id: "daily-operations", label: "Daily Operations", icon: Activity, permission: "shifts.view",
        children: [
            { label: "Shift Management", href: "/admin/shifts" },
            { label: "Tank Dip Reading", href: "/admin/tank-readings" },
            { label: "Nozzle Readings", href: "/admin/nozzle-readings" },
        ],
    },
    {
        id: "sales", label: "Sales & POS", icon: ShoppingCart, permission: "invoices.view",
        children: [
            { label: "New Sale / POS", href: "/admin/invoices/create" },
            { label: "All Invoices", href: "/admin/invoices" },
        ],
    },
    {
        id: "reports", label: "Reports", icon: BarChart3, permission: "reports.view",
        children: [
            { label: "Daily Cash Report", href: "/admin/reports/daily-cash" },
            { label: "Sales & Revenue", href: "/admin/reports/sales" },
            { label: "Purchase Report", href: "/admin/reports/purchases" },
            { label: "Stock Ledger", href: "/admin/stock-ledgers" },
            { label: "Profit & Loss (P&L)", href: "/admin/reports/profit-loss" },
            { label: "Customer Due", href: "/admin/reports/customer-due" },
            { label: "Supplier Due", href: "/admin/reports/supplier-due" },
            { label: "Expense Report", href: "/admin/reports/expenses" },
            { label: "Loan Records", href: "/admin/reports/loans" },
        ],
    },
    {
        id: "user-management", label: "User Management", icon: ShieldCheck, permission: "users.view",
        children: [
            { label: "Users", href: "/admin/users" },
            { label: "Roles", href: "/admin/roles" },
            { label: "Permissions", href: "/admin/permissions" },
        ],
    },
];

const HEADER_H = 72;

function cx(...classes) {
    return classes.filter(Boolean).join(" ");
}

export default function AdminLayout({ children, title, icon: TitleIcon }) {
    const { url, props } = usePage();
    const auth = props.auth || {};
    const permissions = auth.permissions || [];
    const isSuperAdmin = (auth.roles || []).includes("Super Admin");

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem("sidebarCollapsed") === "true";
        }
        return false;
    });

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userBoxRef = useRef(null);

    const hasPermission = (perm) => isSuperAdmin || permissions.includes(perm);
    const currentPath = useMemo(() => url.split("?")[0].split("#")[0], [url]);

    const allMenuHrefs = useMemo(() => {
        const hrefs = [];
        MENU.forEach((item) => {
            if (item.href) hrefs.push(item.href);
            if (item.children) item.children.forEach((child) => hrefs.push(child.href));
        });
        return hrefs;
    }, []);

    const isActive = (href) => {
        if (href === "/") return currentPath === "/";
        if (currentPath === href) return true;
        if (allMenuHrefs.includes(currentPath)) return false;
        return currentPath.startsWith(href + "/");
    };

    const visibleMenu = useMemo(() => {
        return MENU.filter((item) => hasPermission(item.permission)).map((item) => {
            if (!item.children) return item;
            return {
                ...item,
                children: item.children.filter((child) => child.permission ? hasPermission(child.permission) : true),
            };
        });
    }, [permissions, isSuperAdmin]);

    const [openMenu, setOpenMenu] = useState(() => {
        const activeParentItem = visibleMenu.find((item) => item.children?.some((child) => isActive(child.href)));
        return activeParentItem ? activeParentItem.id : null;
    });

    useEffect(() => {
        localStorage.setItem("sidebarCollapsed", collapsed);
    }, [collapsed]);

    useEffect(() => {
        const activeParentItem = visibleMenu.find((item) => item.children?.some((child) => isActive(child.href)));
        if (activeParentItem && openMenu !== activeParentItem.id) {
            setOpenMenu(activeParentItem.id);
        }
    }, [url, visibleMenu]);

    useEffect(() => {
        function onClickOutside(e) {
            if (userBoxRef.current && !userBoxRef.current.contains(e.target)) setUserMenuOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    const isSidebarCollapsed = collapsed && !mobileMenuOpen;
    const sidebarWidthClass = collapsed ? "w-[80px]" : "w-[280px]";
    const contentMarginClass = collapsed ? "lg:ml-[80px]" : "lg:ml-[280px]";

    return (
        <div className="min-h-screen bg-[#f1f5f9] text-slate-800 font-sans antialiased selection:bg-amber-500/30">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245, 158, 11, 0.8); }
                    .nav-tooltip { transform: translate(-6px, -50%); }
                    .group:hover .nav-tooltip { transform: translate(0, -50%); }
                `,
                }}
            />

            {/* ---------------- MOBILE BACKDROP ---------------- */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* ---------------- SIDEBAR ---------------- */}
            <aside
                className={cx(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-950 shadow-2xl transition-all duration-300 ease-in-out lg:translate-x-0 border-r border-slate-800",
                    mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
                    sidebarWidthClass
                )}
                aria-label="Primary"
            >
                {/* Brand Header */}
                <div className="flex h-[72px] shrink-0 items-center justify-between px-5 border-b border-white/[0.04] bg-slate-950/50">
                    <Link href="/" className="flex items-center gap-3 min-w-0 rounded-lg focus:outline-none">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
                            <Fuel size={20} className="text-slate-900" strokeWidth={2.5} />
                        </div>
                        {!isSidebarCollapsed && (
                            <div className="min-w-0 flex-1 transition-opacity duration-300">
                                <p className="truncate text-[15px] font-bold tracking-wide text-white">
                                    FuelDesk ERP
                                </p>
                                <p className="truncate text-[12px] font-medium text-slate-400">
                                    Surma Filling Station
                                </p>
                            </div>
                        )}
                    </Link>
                    <button
                        className="lg:hidden text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation List */}
                <nav className="flex-1 overflow-y-auto px-4 py-6 custom-scrollbar">
                    <ul className="flex flex-col gap-1.5">
                        {visibleMenu.map((item) => {
                            const Icon = item.icon;
                            const hasChildren = !!item.children?.length;
                            const isOpen = openMenu === item.id;
                            const activeParent = hasChildren ? item.children.some((c) => isActive(c.href)) : isActive(item.href);

                            const rowClass = cx(
                                "group/row relative flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-all duration-200",
                                activeParent
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                            );

                            return (
                                <li key={item.id} className="group relative">
                                    {activeParent && !isSidebarCollapsed && (
                                        <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 h-6 w-1.5 bg-amber-500 rounded-r-md shadow-[0_0_12px_rgba(245,158,11,0.6)] transition-all duration-300" />
                                    )}

                                    {hasChildren ? (
                                        <button
                                            onClick={() => {
                                                if (collapsed && !mobileMenuOpen) setCollapsed(false);
                                                setOpenMenu(isOpen ? null : item.id);
                                            }}
                                            className={cx(rowClass, "focus:outline-none")}
                                        >
                                            <Icon size={18} className={cx("shrink-0 transition-colors", activeParent ? "text-amber-500" : "text-slate-400 group-hover/row:text-slate-200")} />
                                            {!isSidebarCollapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                                            {!isSidebarCollapsed && (
                                                <ChevronDown size={14} className={cx("shrink-0 transition-transform duration-300", isOpen && "rotate-180")} />
                                            )}
                                        </button>
                                    ) : (
                                        <Link href={item.href} className={cx(rowClass, "focus:outline-none")} onClick={() => setMobileMenuOpen(false)}>
                                            <Icon size={18} className={cx("shrink-0 transition-colors", activeParent ? "text-amber-500" : "text-slate-400 group-hover/row:text-slate-200")} />
                                            {!isSidebarCollapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
                                        </Link>
                                    )}

                                    {/* Desktop Tooltip */}
                                    {isSidebarCollapsed && (
                                        <span className="nav-tooltip pointer-events-none absolute left-full top-1/2 z-50 ml-4 hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-200 group-hover:opacity-100 lg:block">
                                            {item.label}
                                        </span>
                                    )}

                                    {/* Submenu Items */}
                                    {!isSidebarCollapsed && hasChildren && (
                                        <div className={cx(
                                            "overflow-hidden transition-all duration-300 ease-in-out",
                                            isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0"
                                        )}>
                                            <div className="ml-5 flex flex-col gap-0.5 border-l border-white/10 pl-3 py-1">
                                                {item.children.map((child) => {
                                                    const childActive = isActive(child.href);
                                                    return (
                                                        <Link
                                                            key={child.href}
                                                            href={child.href}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                            className={cx(
                                                                "flex h-[34px] items-center gap-3 rounded-lg px-3 text-[13px] transition-all focus:outline-none",
                                                                childActive
                                                                    ? "text-amber-500 font-semibold bg-amber-500/10"
                                                                    : "text-slate-400 font-medium hover:text-slate-200 hover:bg-white/5"
                                                            )}
                                                        >
                                                            <div className={cx("h-1.5 w-1.5 shrink-0 rounded-full transition-all duration-300", childActive ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] scale-125" : "bg-slate-600")} />
                                                            <span className="truncate">{child.label}</span>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Sidebar Collapse Button */}
                <div className="hidden lg:block shrink-0 border-t border-white/[0.04] p-4 bg-slate-950/50">
                    <button
                        onClick={() => setCollapsed((prev) => !prev)}
                        className="flex h-11 w-full items-center justify-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-400 hover:bg-white/10 hover:text-white transition-all focus:outline-none"
                    >
                        {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        {!collapsed && <span>Collapse Sidebar</span>}
                    </button>
                </div>
            </aside>

            {/* ---------------- MAIN CONTENT WRAPPER ---------------- */}
            <div className={cx("flex flex-col min-h-screen transition-all duration-300 ease-in-out", contentMarginClass)}>

                {/* Top Header - Glassmorphism */}
                <header
                    className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/60 bg-white/70 px-4 sm:px-8 backdrop-blur-xl shadow-sm shadow-slate-200/20"
                    style={{ height: HEADER_H }}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 -ml-2 rounded-xl text-slate-500 hover:bg-slate-200/50 lg:hidden shrink-0 transition-colors focus:outline-none"
                        >
                            <Menu size={22} />
                        </button>

                        {TitleIcon && (
                            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 border border-amber-200/60 shrink-0 shadow-sm">
                                <TitleIcon size={20} strokeWidth={2.5} />
                            </div>
                        )}
                        <h1 className="truncate text-xl sm:text-2xl font-bold text-slate-800">
                            {title || "Dashboard"}
                        </h1>
                    </div>

                    {/* Right Actions */}
                    <div className="flex shrink-0 items-center gap-3 sm:gap-5">
                        <div className="hidden md:block w-56 lg:w-80">
                            <GlobalSearch />
                        </div>

                        <button className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all focus:outline-none shadow-sm">
                            <Bell size={18} />
                            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                        </button>

                        {/* User Profile */}
                        <div className="relative" ref={userBoxRef}>
                            <button
                                onClick={() => setUserMenuOpen((v) => !v)}
                                className="flex items-center gap-2.5 rounded-full p-1 pr-3 hover:bg-slate-100 transition-all focus:outline-none border border-transparent hover:border-slate-200"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-bold text-amber-400 text-sm shadow-sm">
                                    {(auth.user?.name || "AD").slice(0, 2).toUpperCase()}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-bold text-slate-700 leading-none">{auth.user?.name || "Admin User"}</p>
                                    <p className="text-[11px] font-semibold text-slate-400 mt-1">{(auth.roles || [])[0] || "Administrator"}</p>
                                </div>
                                <ChevronDown size={14} className={cx("hidden md:block text-slate-400 transition-transform duration-200 ml-1", userMenuOpen && "rotate-180")} />
                            </button>

                            {/* Dropdown Menu */}
                            {userMenuOpen && (
                                <div className="absolute right-0 z-30 mt-3 w-56 rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-xl p-2 shadow-xl ring-1 ring-slate-900/5 origin-top-right">
                                    <div className="md:hidden border-b border-slate-100 px-3 py-2.5 mb-1 bg-slate-50 rounded-xl">
                                        <p className="truncate text-sm font-bold text-slate-900">{auth.user?.name}</p>
                                        <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{(auth.roles || []).join(", ") || "No Role"}</p>
                                    </div>
                                    <Link
                                        href="/profile"
                                        className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-amber-600 transition-colors"
                                    >
                                        <UserCircle size={18} /> My Profile
                                    </Link>
                                    <div className="my-1 border-t border-slate-100" />
                                    <button
                                        onClick={() => router.post("/logout")}
                                        className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut size={18} /> Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
