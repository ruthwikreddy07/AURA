/**
 * OffPay — Offline Digital Payment System
 * Production-ready React + Tailwind SaaS UI
 *
 * FIXES & 10/10 UPGRADES APPLIED:
 * #1 — True System Theme (prefers-color-scheme + localStorage + smooth transitions)
 * #2 — iOS Glassmorphism Depth (backdrop-blur, layered shadows, subtle borders)
 * #3 — Framer Motion Page Transitions (AnimatePresence iOS-style navigation)
 * #4 — iOS Tactile Buttons (active:scale-95, shadow-inner, ease-out)
 * #5 — Soft Ambient Gradient Background (layered background depth)
 * #6 — Lucide Icons used globally (replaces old text emojis)
 * #7 — Smooth Scrollbar Styling (injected dynamically via theme)
 * #8 — Subtle Hover Lift to Cards (Y-axis translation + shadow expansion)
 * #9 — Apple-grade Typography Hierarchy (tighter letter spacing, medium weights)
 * #10 — Micro-Loading Animation (tied to component mounts)
 * #Advanced — White/40 and White/10 borders for macOS panel effect
 */
import usePageLoad from "./hooks/usePageLoad";
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Wallet, Disc, ArrowRightLeft, RefreshCw, BarChart3, Settings,
  User, Mail, Lock, PlusCircle, ArrowDown, ArrowUp, AlertTriangle, CheckCircle,
  Search, Bell, Menu, X, Smartphone, ShieldCheck
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// THEME CONTEXT — UPGRADE #1: System Theme & Transitions
// ─────────────────────────────────────────────────────────────
const ThemeCtx = createContext({ dark: false, toggle: () => {} });
const useTheme = () => useContext(ThemeCtx);

const tv = (dark, light, darkVal) => dark ? darkVal : light;

const T = {
  nav:        d => tv(d, "bg-white/70 backdrop-blur-xl border-white/40",  "bg-slate-900/60 backdrop-blur-xl border-white/10"),
  text:       d => tv(d, "text-slate-900",        "text-slate-100"),
  muted:      d => tv(d, "text-slate-500",        "text-slate-400"),
  subtle:     d => tv(d, "text-slate-400",        "text-slate-500"),
  divider:    d => tv(d, "bg-slate-200/60",       "bg-slate-700/50"),
  inputBg:    d => tv(d, "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400", 
                         "bg-slate-800/60 border-slate-700 text-slate-100 placeholder-slate-500"),
  softBg:     d => tv(d, "bg-slate-50/80",        "bg-slate-800/40"),
  navActive:  d => tv(d, "bg-indigo-50 text-indigo-700",  "bg-indigo-500/15 text-indigo-300"),
  navHover:   d => tv(d, "text-slate-500 hover:bg-slate-50 hover:text-slate-800", 
                         "text-slate-400 hover:bg-slate-700/50 hover:text-slate-100"),
  kpiBg: {
    indigo: d => tv(d, "bg-indigo-50 text-indigo-600",     "bg-indigo-500/15 text-indigo-300"),
    emerald:d => tv(d, "bg-emerald-50 text-emerald-600",   "bg-emerald-500/15 text-emerald-300"),
    amber:  d => tv(d, "bg-amber-50 text-amber-600",       "bg-amber-500/15 text-amber-300"),
    slate:  d => tv(d, "bg-slate-100 text-slate-600",      "bg-slate-700/50 text-slate-300"),
  },
  glow:       d => tv(d, "ring-1 ring-indigo-100 shadow-indigo-50/80 shadow-md", 
                         "ring-1 ring-indigo-500/20 shadow-indigo-900/40 shadow-lg"),
};

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────
const cls = (...a) => a.filter(Boolean).join(" ");

const normalizeVariant = (v = "") => {
  const m = {
    success:"success", succeeded:"success", completed:"success", active:"success", approved:"success",
    pending:"pending",  queued:"pending",    processing:"pending", waiting:"pending",
    failed:"failed",    error:"failed",      rejected:"failed",    expired:"failed",
    indigo:"indigo",
  };
  return m[String(v).toLowerCase().trim()] ?? "default";
};

// ─────────────────────────────────────────────────────────────
// SKELETON SHIMMER (UPGRADE #10 — Micro-loading)
// ─────────────────────────────────────────────────────────────
const shimmerStyle = {
  background: "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 50%, transparent 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 1.6s infinite",
};

function Skeleton({ className = "" }) {
  const { dark } = useTheme();
  return (
    <div
      className={cls("rounded-xl", dark ? "bg-slate-700/40" : "bg-slate-200/70", className)}
      style={shimmerStyle}
      role="status" aria-busy="true" aria-label="Loading..."
    />
  );
}

function KPICardSkeleton() {
  const { dark } = useTheme();
  return (
    <div className={cls("rounded-2xl border p-5 space-y-3 backdrop-blur-xl", dark ? "bg-slate-900/60 border-white/10" : "bg-white/70 border-white/40")}>
      <div className="flex justify-between items-start">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-12 h-4 rounded-full" />
      </div>
      <Skeleton className="w-28 h-8 mt-1 rounded-lg" />
      <Skeleton className="w-36 h-3 rounded-full" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// BADGE
// ─────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border border-amber-200",
  failed:  "bg-red-50 text-red-600 border border-red-200",
  indigo:  "bg-indigo-50 text-indigo-700 border border-indigo-200",
  default: "bg-slate-100 text-slate-600 border border-slate-200",
};
const BADGE_DOT = {
  success: "bg-emerald-500 animate-pulse",
  pending: "bg-amber-400",
  failed:  "bg-red-500",
};

function Badge({ variant = "default", children }) {
  const v = normalizeVariant(variant);
  const style = BADGE_STYLES[v] ?? BADGE_STYLES.default;
  return (
    <span className={cls("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", style)}>
      {BADGE_DOT[v] && <span className={cls("w-1.5 h-1.5 rounded-full flex-shrink-0", BADGE_DOT[v])} aria-hidden="true" />}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// BUTTON — UPGRADE #4: iOS Press Effects
// ─────────────────────────────────────────────────────────────
const BTN_VARIANTS = {
  primary:     "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200/60 focus-visible:ring-indigo-500 active:scale-95 active:shadow-inner",
  secondary:   "bg-white/80 backdrop-blur-md hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus-visible:ring-slate-300 active:scale-95 active:shadow-inner",
  ghost:       "bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-200 active:scale-95 active:bg-slate-200/50",
  destructive: "bg-red-500 hover:bg-red-600 text-white shadow-sm focus-visible:ring-red-400 active:scale-95 active:shadow-inner",
  emerald:     "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200/60 focus-visible:ring-emerald-400 active:scale-95 active:shadow-inner",
  darkGhost:   "bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 focus-visible:ring-slate-500 active:scale-95 active:bg-slate-600/50",
};
const BTN_SIZES = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };

function Button({ variant = "primary", children, onClick, className = "", size = "md", disabled = false, ariaLabel, type = "button" }) {
  return (
    <button
      type={type} disabled={disabled} onClick={onClick} aria-label={ariaLabel}
      className={cls(
        "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        BTN_SIZES[size], BTN_VARIANTS[variant] ?? BTN_VARIANTS.primary, className
      )}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// CARD — UPGRADE #2 & #8 & Advanced Optional Move
// ─────────────────────────────────────────────────────────────
function Card({ children, className = "", glow = false }) {
  const { dark } = useTheme();
  return (
    <div className={cls(
      "border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
      "hover:-translate-y-[2px] hover:shadow-lg transition-all duration-200",
      dark ? "backdrop-blur-xl bg-slate-900/60 border-white/10" : "backdrop-blur-xl bg-white/70 border-white/40",
      glow && T.glow(dark), className
    )}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// INPUT
// ─────────────────────────────────────────────────────────────
function Input({ label, placeholder, type = "text", icon, value, onChange, name }) {
  const { dark } = useTheme();
  const id = name ?? label?.toLowerCase().replace(/\s+/g, "-") ?? Math.random().toString(36).slice(2);
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className={cls("text-sm font-medium", T.muted(dark))}>{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden="true">{icon}</span>}
        <input
          id={id} name={name} type={type} placeholder={placeholder} value={value} onChange={onChange}
          className={cls(
            "w-full border rounded-xl py-2.5 text-sm transition-all duration-200 ease-out",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:border-transparent",
            T.inputBg(dark), icon ? "pl-10 pr-4" : "px-4"
          )}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// KPI CARD — UPGRADE #9: Typography Hierarchy
// ─────────────────────────────────────────────────────────────
function KPICard({ label, value, sub, icon, trend, color = "indigo" }) {
  const { dark } = useTheme();
  const colorCls = T.kpiBg[color]?.(dark) ?? T.kpiBg.indigo(dark);
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colorCls)} aria-hidden="true">
          {icon}
        </div>
        {trend !== undefined && (
          <span className={cls("text-xs font-semibold flex items-center gap-0.5", trend > 0 ? "text-emerald-600" : "text-red-500")}
            aria-label={`${trend > 0 ? "Up" : "Down"} ${Math.abs(trend)} percent`}>
            {trend > 0 ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className={cls("text-[22px] font-semibold tracking-tight", T.text(dark))}>{value}</p>
      <p className={cls("text-xs mt-0.5", T.muted(dark))}>{label}</p>
      {sub && <p className={cls("text-xs mt-1", T.subtle(dark))}>{sub}</p>}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────
// TOGGLE
// ─────────────────────────────────────────────────────────────
function Toggle({ enabled, onChange, label, id }) {
  const { dark } = useTheme();
  const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={toggleId} className={cls("text-sm font-medium cursor-pointer select-none", T.text(dark))}>{label}</label>
      <button
        id={toggleId} role="switch" aria-checked={enabled} onClick={() => onChange(!enabled)}
        className={cls(
          "w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 flex-shrink-0",
          enabled ? "bg-indigo-600" : (dark ? "bg-slate-700" : "bg-slate-200")
        )}
      >
        <span className={cls("block w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 mx-1", enabled ? "translate-x-5" : "translate-x-0")} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MINI SVG LINE CHART
// ─────────────────────────────────────────────────────────────
function MiniLineChart({ data, color = "#4F46E5", gradId = "chartFill" }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const W = 300, H = 80;
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((v - min) / range) * (H - 16) - 8 }));
  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = linePath + ` L ${W} ${H} L 0 ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" role="img" aria-label="Line chart">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// NAV ITEMS — UPGRADE #6: Lucide Icons
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview",     icon: <LayoutGrid className="w-[18px] h-[18px]" />,     label: "Overview"       },
  { id: "wallet",       icon: <Wallet className="w-[18px] h-[18px]" />,         label: "Wallet"         },
  { id: "tokens",       icon: <Disc className="w-[18px] h-[18px]" />,           label: "Offline Tokens" },
  { id: "transactions", icon: <ArrowRightLeft className="w-[18px] h-[18px]" />, label: "Transactions"   },
  { id: "sync",         icon: <RefreshCw className="w-[18px] h-[18px]" />,      label: "Sync Status"    },
  { id: "analytics",    icon: <BarChart3 className="w-[18px] h-[18px]" />,      label: "Analytics"      },
  { id: "settings",     icon: <Settings className="w-[18px] h-[18px]" />,       label: "Settings"       },
];

// ─────────────────────────────────────────────────────────────
// SIDEBAR CONTENT
// ─────────────────────────────────────────────────────────────
function SidebarContent({ active, onNav, collapsed = false }) {
  const { dark } = useTheme();
  return (
    <div className="flex flex-col h-full">
      <div className={cls("flex items-center gap-3 px-4 py-5 border-b", T.divider(dark))}>
        <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-inner" aria-hidden="true">
          <span className="text-white text-sm font-black">Ω</span>
        </div>
        {!collapsed && (
          <div>
            <p className={cls("font-bold text-sm leading-none", T.text(dark))}>OffPay</p>
            <p className={cls("text-xs mt-0.5 font-medium", T.subtle(dark))}>Offline Payments</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            aria-current={active === item.id ? "page" : undefined}
            className={cls(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
              active === item.id ? T.navActive(dark) : T.navHover(dark),
              active === item.id ? "shadow-sm" : ""
            )}
          >
            <span className="flex-shrink-0" aria-hidden="true">{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && active === item.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" aria-hidden="true" />}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className={cls("p-4 border-t", T.divider(dark))}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-inner">
              <span className="text-white text-xs font-bold">AK</span>
            </div>
            <div className="min-w-0">
              <p className={cls("text-xs font-semibold tracking-tight truncate", T.text(dark))}>Arjun Kumar</p>
              <p className={cls("text-xs truncate", T.subtle(dark))}>Pro Plan</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Sidebar({ active, onNav, collapsed, onToggle }) {
  const { dark } = useTheme();
  return (
    <aside className={cls("hidden md:flex flex-col h-screen border-r sticky top-0 transition-all duration-300 z-20", T.nav(dark), collapsed ? "w-16" : "w-64")} aria-label="Sidebar">
      <SidebarContent active={active} onNav={onNav} collapsed={collapsed} />
      <div className={cls("p-3 border-t", T.divider(dark))}>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cls("w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-150 ease-out text-sm", T.navHover(dark), "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95")}
        >
          {collapsed ? <ArrowRightLeft className="w-4 h-4"/> : <><ArrowRightLeft className="w-4 h-4"/><span className="text-xs font-semibold">Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}

function MobileSheet({ open, onClose, active, onNav }) {
  const { dark } = useTheme();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        className={cls("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden", open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
        onClick={onClose} aria-hidden="true"
      />
      <div
        role="dialog" aria-modal="true" aria-label="Navigation menu"
        className={cls("fixed inset-y-0 left-0 z-50 w-64 border-r shadow-2xl transition-transform duration-300 ease-out md:hidden", T.nav(dark), open ? "translate-x-0" : "-translate-x-full")}
      >
        <button
          onClick={onClose} aria-label="Close menu"
          className={cls("absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95", "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", T.navHover(dark))}
        >
          <X className="w-5 h-5" />
        </button>
        <SidebarContent active={active} onNav={(id) => { onNav(id); onClose(); }} collapsed={false} />
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// TOP NAV
// ─────────────────────────────────────────────────────────────
const NOTIFICATIONS = [
  { title: "Token sync completed", time: "2 min ago" },
  { title: "3 tokens expiring in 2 hours", time: "14 min ago" },
  { title: "Security check passed", time: "1 hour ago" },
];

function TopNav({ page, onMenuOpen }) {
  const { dark, toggle } = useTheme();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
  const PAGE_LABELS = { overview:"Overview", wallet:"Wallet", tokens:"Offline Tokens", transactions:"Transactions", sync:"Sync Status", analytics:"Analytics", settings:"Settings" };

  useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showNotif]);

  useEffect(() => {
    if (!showNotif) return;
    const handler = (e) => { if (e.key === "Escape") setShowNotif(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showNotif]);

  return (
    <header className={cls("h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 border-b transition-colors duration-500", T.nav(dark))}>
      <div className="flex items-center gap-3">
        <button
          className={cls("md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-colors active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", T.navHover(dark))}
          onClick={onMenuOpen} aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5 text-slate-500" />
        </button>
        <h1 className={cls("font-semibold text-lg tracking-tight", T.text(dark))}>{PAGE_LABELS[page]}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
          <input
            placeholder="Search…" aria-label="Search"
            className={cls("border rounded-xl pl-9 pr-4 py-2 text-sm w-56 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:border-transparent transition-all", T.inputBg(dark))}
          />
        </div>

        <button
          onClick={toggle} aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
          className={cls("w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-150 ease-out active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", T.nav(dark))}
        >
          <span className="text-sm">{dark ? "☀️" : "🌙"}</span>
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            aria-label={`Notifications, ${NOTIFICATIONS.length} unread`} aria-expanded={showNotif} aria-haspopup="true"
            className={cls("w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-150 ease-out active:scale-95 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", T.nav(dark))}
          >
            <Bell className="w-4 h-4 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-900" aria-hidden="true" />
          </button>
          
          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.15 }}
                role="menu"
                className={cls("absolute right-0 top-12 w-80 border rounded-2xl shadow-xl z-50 overflow-hidden", T.nav(dark))}
              >
                <div className={cls("px-4 py-3 border-b", T.divider(dark))}>
                  <p className={cls("font-semibold text-sm", T.text(dark))}>Notifications</p>
                </div>
                {NOTIFICATIONS.map((n, i) => (
                  <div key={i} role="menuitem" tabIndex={0} className={cls("px-4 py-3 cursor-pointer transition-colors border-b focus:outline-none focus-visible:bg-indigo-50", T.divider(dark), dark ? "hover:bg-slate-800/60" : "hover:bg-slate-50")}>
                    <p className={cls("text-sm font-medium", T.text(dark))}>{n.title}</p>
                    <p className={cls("text-xs mt-0.5", T.subtle(dark))}>{n.time}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────
// UPGRADE #10 — MICRO-LOADING HOOK (tied to fast fade)
// ─────────────────────────────────────────────────────────────
function usePageLoad() {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 250); // Fast micro-loading
    return () => clearTimeout(t);
  }, []);
  return loading;
}

// ─────────────────────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────────────────────
const CHART_DATA = [4200,3800,5100,4700,6300,5800,7200,6900,8100,7600,9200,8800];

function OverviewPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();

  const timeline = [
    { time:"2m ago",  desc:"Token sync completed",             type:"success" },
    { time:"14m ago", desc:"₹2,400 received offline",          type:"success" },
    { time:"31m ago", desc:"Token expiry warning",             type:"warning"  },
    { time:"1h ago",  desc:"₹800 payment dispatched",          type:"default"  },
    { time:"2h ago",  desc:"Device authorized: Samsung S24",   type:"default"  },
  ];
  const dotCls = { success:"bg-emerald-400", warning:"bg-amber-400", default: dark ? "bg-slate-500" : "bg-slate-300" };

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0,1,2,3].map(i => <KPICardSkeleton key={i}/>)}</div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className={cls("lg:col-span-2 rounded-2xl border p-5", dark?"bg-slate-900/60 border-white/10":"bg-white/70 border-white/40")}><Skeleton className="h-48"/></div>
        <div className={cls("rounded-2xl border p-5", dark?"bg-slate-900/60 border-white/10":"bg-white/70 border-white/40")}><Skeleton className="h-48"/></div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Balance"      value="₹1,24,850" sub="Across 3 wallets"       icon={<Wallet className="w-5 h-5"/>} color="indigo"  trend={8.2}  />
        <KPICard label="Token Allocation"   value="₹32,000"   sub="68% utilized"             icon={<Disc className="w-5 h-5"/>} color="emerald" trend={3.1}  />
        <KPICard label="Pending Sync"       value="7 txns"    sub="Last sync 4min ago"       icon={<RefreshCw className="w-5 h-5"/>} color="amber"   trend={-2}   />
        <KPICard label="Monthly Volume"     value="₹8,90,400" sub="Vs ₹7.2L last month"    icon={<BarChart3 className="w-5 h-5"/>} color="slate"   trend={23.6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={cls("font-semibold text-[15px]", T.text(dark))}>Transaction Volume</p>
              <p className={cls("text-xs mt-0.5", T.muted(dark))}>Last 12 months</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success"><ArrowUp className="w-3 h-3"/> 23.6%</Badge>
              <Button variant="ghost" size="sm">Export</Button>
            </div>
          </div>
          <MiniLineChart data={CHART_DATA} color="#4F46E5" gradId="ovChart" />
          <div className="flex justify-between mt-3 px-1">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
              <span key={m} className={cls("text-[10px] font-medium uppercase tracking-wider", T.subtle(dark))}>{m}</span>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className={cls("font-semibold text-[15px] mb-5", T.text(dark))}>Activity Feed</p>
          <ol className="space-y-4">
            {timeline.map((t2, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className={cls("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm", T.softBg(dark))}>
                  <span className={cls("w-2.5 h-2.5 rounded-full", dotCls[t2.type])} aria-hidden="true" />
                </div>
                <div>
                  <p className={cls("text-sm font-medium", T.text(dark))}>{t2.desc}</p>
                  <p className={cls("text-xs mt-1", T.subtle(dark))}>{t2.time}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-4", T.text(dark))}>Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary"  size="sm"><PlusCircle className="w-4 h-4"/> Issue Tokens</Button>
          <Button variant="emerald"  size="sm"><ArrowDown className="w-4 h-4"/> Receive Payment</Button>
          <Button variant="secondary" size="sm"><ArrowUp className="w-4 h-4"/> Send Payment</Button>
          <Button variant="secondary" size="sm"><RefreshCw className="w-4 h-4"/> Force Sync</Button>
          <Button variant="ghost"    size="sm"><LayoutGrid className="w-4 h-4"/> All Transactions</Button>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: WALLET
// ─────────────────────────────────────────────────────────────
function WalletPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [allocation, setAllocation] = useState(40);
  const LIMIT = 50000;
  const allocated = Math.round((allocation / 100) * LIMIT);

  const wallets = [
    { name:"Primary UPI Wallet", bal:"₹1,24,850", tag:"active",  badge:"success" },
    { name:"Offline Reserve",     bal:"₹32,000",   tag:"active",  badge:"success" },
    { name:"Merchant Wallet",     bal:"₹18,500",   tag:"pending", badge:"pending" },
  ];
  const walletIconCls = ["bg-indigo-50 text-indigo-600", "bg-emerald-50 text-emerald-600", "bg-amber-50 text-amber-600"];

  if (loading) return (
    <div className="p-6 grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2"><Skeleton className="h-96 rounded-2xl"/></div>
      <div className="space-y-4"><Skeleton className="h-28 rounded-2xl"/><Skeleton className="h-28 rounded-2xl"/><Skeleton className="h-28 rounded-2xl"/></div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-7" glow>
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className={cls("text-sm font-medium", T.muted(dark))}>Primary Wallet Balance</p>
              <p className={cls("text-[40px] font-bold mt-1 tracking-tight", T.text(dark))}>₹1,24,850</p>
              <p className={cls("text-sm mt-1", T.subtle(dark))}>Available for allocation</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className={cls("text-[15px] font-semibold", T.text(dark))}>Offline Token Allocation</p>
              <p className="text-[15px] font-bold text-indigo-600 dark:text-indigo-400">₹{allocated.toLocaleString("en-IN")}</p>
            </div>
            <input
              type="range" min="0" max="100" value={allocation}
              onChange={e => setAllocation(Number(e.target.value))}
              aria-label="Token allocation percentage"
              className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-indigo-600 bg-slate-200 dark:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            />
            <div className="flex justify-between text-xs font-medium">
              <span className={T.subtle(dark)}>₹0</span>
              <span className={cls(T.muted(dark))}>{allocation}% allocated</span>
              <span className={T.subtle(dark)}>₹{LIMIT.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className={cls("mt-8 p-4 border rounded-xl flex items-start gap-3 backdrop-blur-sm", dark ? "bg-amber-900/20 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
            <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className={cls("text-sm font-semibold", dark ? "text-amber-400" : "text-amber-800")}>Security Notice</p>
              <p className={cls("text-xs mt-1 leading-relaxed", dark ? "text-amber-200/80" : "text-amber-700")}>Offline tokens exceeding ₹50,000 require biometric re-authorization on your registered device.</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="primary" size="lg">Apply Allocation</Button>
            <Button variant="secondary" size="lg">Reset to Default</Button>
          </div>
        </Card>

        <div className="space-y-4">
          {wallets.map((w, i) => (
            <Card key={i} className="p-5 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0 shadow-inner", walletIconCls[i])} aria-hidden="true"><Wallet className="w-5 h-5"/></div>
                  <div>
                    <p className={cls("text-[15px] font-semibold", T.text(dark))}>{w.name}</p>
                    <p className={cls("text-sm font-medium mt-0.5", T.muted(dark))}>{w.bal}</p>
                  </div>
                </div>
                <Badge variant={w.badge}>{w.tag.charAt(0).toUpperCase()+w.tag.slice(1)}</Badge>
              </div>
            </Card>
          ))}
          <Button variant="secondary" className="w-full shadow-none border-dashed"><PlusCircle className="w-4 h-4"/> Add Wallet</Button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: OFFLINE TOKENS
// ─────────────────────────────────────────────────────────────
function TokensPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const tokens = [
    { id:"TKN-7821", amount:"₹5,000",  used:60,  expiry:"2h 14m",  status:"active"  },
    { id:"TKN-7820", amount:"₹10,000", used:30,  expiry:"23h",     status:"active"  },
    { id:"TKN-7819", amount:"₹2,500",  used:95,  expiry:"45m",     status:"pending" },
    { id:"TKN-7818", amount:"₹8,000",  used:100, expiry:"Expired", status:"failed"  },
  ];
  const barCls = (s, u) => s === "failed" ? (dark?"bg-slate-600":"bg-slate-300") : u > 90 ? "bg-amber-400" : "bg-indigo-500";

  if (loading) return <div className="p-6 space-y-4">{[0,1,2,3].map(i=><Skeleton key={i} className="h-24 rounded-2xl"/>)}</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid sm:grid-cols-3 gap-5">
        {[{ label:"Active Tokens",  val:12, max:20, bar:"bg-indigo-500" },
          { label:"Expiring Soon",  val:3,  max:12, bar:"bg-amber-400"  },
          { label:"Exhausted",      val:5,  max:12, bar: dark ? "bg-slate-600" : "bg-slate-300" }
        ].map((s, i) => (
          <Card key={i} className="p-6">
            <p className={cls("text-sm font-medium", T.muted(dark))}>{s.label}</p>
            <p className={cls("text-[32px] font-bold mt-1 tracking-tight", T.text(dark))}>{s.val}</p>
            <div className={cls("mt-4 rounded-full h-1.5", dark?"bg-slate-800":"bg-slate-100")}>
              <div className={cls("h-1.5 rounded-full transition-all duration-1000", s.bar)} style={{ width:`${(s.val/s.max)*100}%` }} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className={cls("px-6 py-5 border-b flex items-center justify-between", T.divider(dark))}>
          <p className={cls("font-semibold text-[15px]", T.text(dark))}>Token Registry</p>
          <Button variant="primary" size="sm"><PlusCircle className="w-4 h-4"/> Issue New Token</Button>
        </div>
        <div className="divide-y" style={{ borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
          {tokens.map((tk, i) => (
            <div key={i} className={cls("px-6 py-5 flex items-center gap-5 transition-colors cursor-pointer", dark?"hover:bg-slate-800/40":"hover:bg-slate-50")}>
              <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner", dark?"bg-indigo-500/20":"bg-indigo-50")}>
                <Disc className="text-indigo-500 w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className={cls("text-[15px] font-semibold font-mono tracking-tight", T.text(dark))}>{tk.id}</p>
                  <Badge variant={tk.status}>{tk.status === "active" ? "Active" : tk.status === "pending" ? "Expiring" : "Expired"}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <div className={cls("flex-1 rounded-full h-1.5", dark?"bg-slate-800":"bg-slate-100")}>
                    <div className={cls("h-1.5 rounded-full transition-all duration-500", barCls(tk.status, tk.used))} style={{ width:`${tk.used}%` }} />
                  </div>
                  <span className={cls("text-xs font-medium whitespace-nowrap", T.subtle(dark))}>{tk.used}% used</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={cls("text-[17px] font-bold tracking-tight", T.text(dark))}>{tk.amount}</p>
                <p className={cls("text-xs mt-1 font-medium", T.subtle(dark))}>Expires {tk.expiry}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: TRANSACTIONS
// ─────────────────────────────────────────────────────────────
const TX_DATA = [
  { id:"TX9821", merchant:"Chai Sutta Bar",  type:"Offline", amount:"-₹340",    status:"success", date:"Today 9:14 AM",  mode:"NFC"   },
  { id:"TX9820", merchant:"BookMyShow",       type:"Online",  amount:"-₹1,200",  status:"success", date:"Today 8:02 AM",  mode:"UPI"   },
  { id:"TX9819", merchant:"Salary Credit",    type:"Credit",  amount:"+₹85,000", status:"Success", date:"Yesterday",      mode:"NEFT"  },
  { id:"TX9818", merchant:"Amazon Pay",       type:"Offline", amount:"-₹2,450",  status:"Pending", date:"Yesterday",      mode:"Token" },
  { id:"TX9817", merchant:"IRCTC",            type:"Online",  amount:"-₹3,890",  status:"Failed",  date:"Mar 28",         mode:"UPI"   },
  { id:"TX9816", merchant:"Swiggy",           type:"Offline", amount:"-₹620",    status:"success", date:"Mar 28",         mode:"NFC"   },
  { id:"TX9815", merchant:"Reliance Fresh",   type:"Offline", amount:"-₹1,140",  status:"success", date:"Mar 27",         mode:"Token" },
];

function TransactionsPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = TX_DATA.filter(tx =>
    (filter === "All" || normalizeVariant(tx.status) === filter.toLowerCase()) &&
    (tx.merchant.toLowerCase().includes(search.toLowerCase()) || tx.id.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return (
    <div className="p-6 space-y-5">
      <div className="flex gap-2">{[0,1,2,3].map(i=><Skeleton key={i} className="h-9 w-24 rounded-xl"/>)}</div>
      <Skeleton className="h-96 rounded-2xl"/>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter transactions">
          {["All","Success","Pending","Failed"].map(f => (
            <button
              key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
              className={cls(
                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95",
                filter === f ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50" : cls("border backdrop-blur-md", dark?"bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-700/60":"bg-white/70 border-white/40 text-slate-600 hover:bg-white")
              )}
            >{f}</button>
          ))}
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." aria-label="Search transactions"
              className={cls("border rounded-xl pl-10 pr-4 py-2 text-sm w-48 sm:w-64 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:border-transparent transition-all backdrop-blur-md", T.inputBg(dark))}
            />
          </div>
          <Button variant="secondary" size="md" ariaLabel="Export transactions"><ArrowDown className="w-4 h-4"/> Export</Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Transactions table">
            <thead>
              <tr className={cls("border-b", T.divider(dark), dark ? "bg-slate-900/40" : "bg-slate-50/50")}>
                {["Transaction ID","Merchant","Type","Amount","Mode","Status","Date"].map(h => (
                  <th key={h} scope="col" className={cls("px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap", T.muted(dark))}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr key={tx.id} className={cls("border-b transition-colors cursor-pointer", dark?"border-white/5 hover:bg-slate-800/40":"border-black/5 hover:bg-slate-50")}>
                  <td className="px-5 py-4"><span className="text-[13px] font-mono text-indigo-500 font-bold">{tx.id}</span></td>
                  <td className="px-5 py-4"><span className={cls("text-[15px] font-semibold tracking-tight", T.text(dark))}>{tx.merchant}</span></td>
                  <td className="px-5 py-4"><span className={cls("text-[13px] font-medium", T.muted(dark))}>{tx.type}</span></td>
                  <td className="px-5 py-4">
                    <span className={cls("text-[15px] font-bold tracking-tight", tx.amount.startsWith("+") ? "text-emerald-500" : T.text(dark))}>{tx.amount}</span>
                  </td>
                  <td className="px-5 py-4"><Badge variant="default">{tx.mode}</Badge></td>
                  <td className="px-5 py-4"><Badge variant={tx.status}>{tx.status.charAt(0).toUpperCase()+tx.status.slice(1).toLowerCase()}</Badge></td>
                  <td className="px-5 py-4"><span className={cls("text-[13px] font-medium", T.subtle(dark))}>{tx.date}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center" role="status">
            <p className={cls("text-[15px] font-medium", T.muted(dark))}>No transactions found.</p>
          </div>
        )}
        <div className={cls("px-5 py-4 border-t flex items-center justify-between", T.divider(dark), dark ? "bg-slate-900/40" : "bg-slate-50/50")}>
          <p className={cls("text-sm font-medium", T.subtle(dark))}>{filtered.length} transactions</p>
          <div className="flex gap-2" role="navigation" aria-label="Pagination">
            {[1,2,3].map(p => (
              <button key={p} aria-label={`Page ${p}`} aria-current={p===1?"page":undefined}
                className={cls("w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                  p===1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50" : cls(dark?"text-slate-300 hover:bg-slate-700/60 bg-slate-800/40":"text-slate-600 hover:bg-white bg-slate-100/50"))}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: SYNC STATUS
// ─────────────────────────────────────────────────────────────
function SyncPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [syncing, setSyncing] = useState(false);
  const progress = 87;

  const handleSync = useCallback(() => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 2200);
  }, []);

  if (loading) return (
    <div className="p-6 grid lg:grid-cols-2 gap-6">
      <Skeleton className="h-96 rounded-2xl"/>
      <div className="space-y-6"><Skeleton className="h-44 rounded-2xl"/><Skeleton className="h-44 rounded-2xl"/></div>
    </div>
  );

  const circumference = 2 * Math.PI * 50;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-7" glow>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className={cls("text-[17px] font-bold", T.text(dark))}>Sync Health Monitor</p>
              <p className={cls("text-sm font-medium mt-1", T.muted(dark))}>Real-time offline data sync status</p>
            </div>
            <Badge variant="success">Healthy</Badge>
          </div>

          <div className="flex items-center justify-center my-8" role="meter" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Sync progress: ${progress}%`}>
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r="50" fill="none" stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="10" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#4F46E5" strokeWidth="10"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress / 100)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className={cls("text-[32px] font-black tracking-tight", T.text(dark))}>{progress}%</p>
                <p className={cls("text-sm font-medium mt-1", T.muted(dark))}>Synced</p>
              </div>
            </div>
          </div>

          <dl className="space-y-4">
            {[
              { label:"Last successful sync", val:"4 min ago",     cls:T.text(dark) },
              { label:"Pending transactions",  val:"7",             cls:"text-amber-500 font-bold" },
              { label:"Sync interval",         val:"Every 5 min", cls:T.text(dark) },
            ].map((row, i) => (
              <div key={i} className="flex justify-between items-center">
                <dt className={cls("text-[15px] font-medium", T.muted(dark))}>{row.label}</dt>
                <dd className={cls("text-[15px] font-semibold", row.cls)}>{row.val}</dd>
              </div>
            ))}
          </dl>

          <Button variant="primary" size="lg" className="w-full mt-8" onClick={handleSync} disabled={syncing} ariaLabel={syncing ? "Syncing in progress" : "Force sync now"}>
            {syncing ? <><RefreshCw className="w-5 h-5 animate-spin"/> Syncing…</> : <><RefreshCw className="w-5 h-5"/> Force Sync Now</>}
          </Button>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <p className={cls("font-semibold text-[15px] mb-4", T.text(dark))}>Sync Queue</p>
            <div className="space-y-3">
              {[
                { id:"TX9818", merchant:"Amazon Pay",       amount:"₹2,450" },
                { id:"TX9814", merchant:"Metro Station",    amount:"₹40"    },
                { id:"TX9811", merchant:"Reliance Digital", amount:"₹8,999" },
              ].map((item, i) => (
                <div key={i} className={cls("flex items-center gap-4 p-4 rounded-2xl shadow-sm", dark?"bg-slate-800/40":"bg-slate-50")}>
                  <RefreshCw className="text-amber-500 w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className={cls("text-[15px] font-semibold tracking-tight", T.text(dark))}>{item.merchant} · {item.amount}</p>
                    <p className={cls("text-xs font-mono font-medium mt-0.5", T.subtle(dark))}>{item.id}</p>
                  </div>
                  <Badge variant="pending">Queued</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className={cls("font-semibold text-[15px] mb-4", T.text(dark))}>System Alerts</p>
            <div className="space-y-3" role="list">
              <div role="listitem" className={cls("p-4 border rounded-2xl flex items-start gap-3 backdrop-blur-sm", dark?"bg-red-900/20 border-red-500/20":"bg-red-50 border-red-200")}>
                <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className={cls("text-sm font-semibold", dark?"text-red-400":"text-red-800")}>Token Expiry Warning</p>
                  <p className={cls("text-[13px] mt-1 font-medium leading-relaxed", dark?"text-red-300/80":"text-red-700")}>3 offline tokens expire in 2 hours. A sync is highly recommended.</p>
                </div>
              </div>
              <div role="listitem" className={cls("p-4 border rounded-2xl flex items-start gap-3 backdrop-blur-sm", dark?"bg-emerald-900/20 border-emerald-500/20":"bg-emerald-50 border-emerald-200")}>
                <ShieldCheck className="text-emerald-500 w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className={cls("text-sm font-semibold", dark?"text-emerald-400":"text-emerald-800")}>Device Integrity Verified</p>
                  <p className={cls("text-[13px] mt-1 font-medium leading-relaxed", dark?"text-emerald-300/80":"text-emerald-700")}>All registered hardware enclaves passed security assertions.</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: ANALYTICS
// ─────────────────────────────────────────────────────────────
const WEEK_DATA    = [12400,18200,9800,22100,15600,28900,19400];
const MONTHLY_OFF  = [55,68,43,72,61,78,65];

function AnalyticsPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();

  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid lg:grid-cols-2 gap-6"><Skeleton className="h-56 rounded-2xl"/><Skeleton className="h-56 rounded-2xl"/></div>
      <div className="grid sm:grid-cols-3 gap-5">{[0,1,2].map(i=><Skeleton key={i} className="h-32 rounded-2xl"/>)}</div>
      <Skeleton className="h-64 rounded-2xl"/>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className={cls("font-semibold text-[15px]", T.text(dark))}>Weekly Transaction Volume</p>
            <Badge variant="indigo">This Week</Badge>
          </div>
          <MiniLineChart data={WEEK_DATA} color="#10B981" gradId="wkChart" />
          <div className="flex justify-between mt-3 px-1">
            {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
              <span key={d} className={cls("text-[11px] font-semibold uppercase tracking-wider", T.subtle(dark))}>{d}</span>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <p className={cls("font-semibold text-[15px]", T.text(dark))}>Offline Payment Ratio (%)</p>
            <Badge variant="success">Monthly</Badge>
          </div>
          <MiniLineChart data={MONTHLY_OFF} color="#4F46E5" gradId="mthChart" />
          <div className="flex justify-between mt-3 px-1">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul"].map(m => (
              <span key={m} className={cls("text-[11px] font-semibold uppercase tracking-wider", T.subtle(dark))}>{m}</span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid sm:grid-cols-3 gap-5">
        {[
          { label:"Avg Transaction Size", val:"₹1,240", change:"+12%"   },
          { label:"Offline Success Rate",  val:"99.2%",  change:"+0.4%"  },
          { label:"Avg Sync Delay",        val:"4.3 min",change:"-1.1m"  },
        ].map((s, i) => (
          <Card key={i} className="p-6 text-center">
            <p className={cls("text-[32px] font-bold tracking-tight", T.text(dark))}>{s.val}</p>
            <p className={cls("text-sm font-medium mt-1", T.muted(dark))}>{s.label}</p>
            <p className="text-xs font-bold text-emerald-500 mt-2 tracking-wide">{s.change} vs last month</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-6", T.text(dark))}>Spending by Category</p>
        <div className="space-y-4" role="list">
          {[
            { cat:"Food & Beverages", pct:34, amount:"₹29,400" },
            { cat:"Transportation",   pct:22, amount:"₹19,100" },
            { cat:"Shopping",         pct:28, amount:"₹24,300" },
            { cat:"Entertainment",    pct:16, amount:"₹13,800" },
          ].map((c, i) => (
            <div key={i} className="flex items-center gap-5" role="listitem">
              <span className={cls("text-[13px] font-semibold w-36 flex-shrink-0", T.muted(dark))}>{c.cat}</span>
              <div className={cls("flex-1 rounded-full h-2.5", dark?"bg-slate-800":"bg-slate-100")} role="meter" aria-valuenow={c.pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-2.5 rounded-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width:`${c.pct}%`, opacity: 0.5 + i * 0.1 }} />
              </div>
              <span className={cls("text-[15px] font-bold w-20 text-right tracking-tight", T.text(dark))}>{c.amount}</span>
              <span className={cls("text-[13px] font-medium w-8 flex-shrink-0", T.subtle(dark))}>{c.pct}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PAGE: SETTINGS
// ─────────────────────────────────────────────────────────────
function SettingsPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [toggles, setToggles] = useState({ biometric:true, autoSync:true, offlineMode:true, notifications:false, twoFA:true });
  const toggle = key => setToggles(p => ({ ...p, [key]: !p[key] }));

  if (loading) return (
    <div className="p-6 space-y-6 max-w-2xl">
      {[0,1,2,3].map(i=><Skeleton key={i} className="h-44 rounded-2xl"/>)}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto md:mx-0">
      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-5", T.text(dark))}>Profile</p>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-inner" aria-label="Profile avatar">
            <span className="text-white text-2xl font-bold" aria-hidden="true">AK</span>
          </div>
          <div>
            <p className={cls("text-[17px] font-bold tracking-tight", T.text(dark))}>Arjun Kumar</p>
            <p className={cls("text-[15px] font-medium mt-0.5", T.muted(dark))}>arjun@offpay.in · Pro Plan</p>
          </div>
          <Button variant="secondary" size="md" className="ml-auto">Edit</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Input label="Full Name"  placeholder="Arjun Kumar"       name="full-name"   />
          <Input label="Email"      placeholder="arjun@offpay.in"   name="email" type="email" />
        </div>
      </Card>

      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-5", T.text(dark))}>Security Controls</p>
        <div className="space-y-5">
          <Toggle enabled={toggles.biometric}     onChange={() => toggle("biometric")}     label="Biometric Authentication"      id="tog-bio"   />
          <div className={cls("h-px", T.divider(dark))} />
          <Toggle enabled={toggles.twoFA}          onChange={() => toggle("twoFA")}          label="Two-Factor Authentication (TOTP)" id="tog-2fa"   />
          <div className={cls("h-px", T.divider(dark))} />
          <Toggle enabled={toggles.notifications}  onChange={() => toggle("notifications")}  label="Security Alerts via Email"      id="tog-notif" />
        </div>
        <Button variant="destructive" size="md" className="mt-6">Change Password</Button>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <p className={cls("font-semibold text-[15px]", T.text(dark))}>Registered Devices</p>
          <Button variant="secondary" size="sm"><PlusCircle className="w-4 h-4"/> Add Device</Button>
        </div>
        <div className="space-y-3" role="list">
          {[
            { name:"Samsung Galaxy S24", id:"DEV-001", badge:"success", time:"Active now"  },
            { name:"iPhone 15 Pro",       id:"DEV-002", badge:"success", time:"2h ago"     },
            { name:"OnePlus 12",           id:"DEV-003", badge:"default", time:"3 days ago" },
          ].map((d, i) => (
            <div key={i} role="listitem" className={cls("flex items-center justify-between p-4 rounded-2xl shadow-sm", dark?"bg-slate-800/40":"bg-slate-50")}>
              <div className="flex items-center gap-4">
                <Smartphone className="text-indigo-500 w-6 h-6" aria-hidden="true" />
                <div>
                  <p className={cls("text-[15px] font-semibold tracking-tight", T.text(dark))}>{d.name}</p>
                  <p className={cls("text-[13px] font-medium mt-0.5", T.subtle(dark))}>{d.id} · {d.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={d.badge}>{d.badge==="success"?"Active":"Inactive"}</Badge>
                <Button variant="ghost" size="sm" ariaLabel={`Remove ${d.name}`}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-5", T.text(dark))}>Token Preferences</p>
        <div className="space-y-5">
          <Toggle enabled={toggles.autoSync}    onChange={() => toggle("autoSync")}    label="Auto-sync when online"  id="tog-sync"    />
          <div className={cls("h-px", T.divider(dark))} />
          <Toggle enabled={toggles.offlineMode} onChange={() => toggle("offlineMode")} label="Enable Offline Mode"    id="tog-offline" />
          <div className={cls("h-px", T.divider(dark))} />
          <div className="flex items-center justify-between">
            <span className={cls("text-[15px] font-medium select-none", T.text(dark))}>Max Token Limit</span>
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-bold tracking-tight text-indigo-500">₹50,000</span>
              <Button variant="secondary" size="sm">Edit</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon:<Disc className="w-5 h-5"/>, title:"Offline Token System",  desc:"Cryptographically signed tokens that work without internet, powered by secure hardware enclaves."        },
  { icon:<RefreshCw className="w-5 h-5"/>, title:"Secure Sync Engine",      desc:"Intelligent background sync resolves conflicts and settles transactions the moment connectivity returns."  },
  { icon:<Smartphone className="w-5 h-5"/>, title:"NFC / HCE Support",       desc:"Tap-to-pay via Host Card Emulation. Works with all NFC-enabled Android devices out of the box."            },
  { icon:<ShieldCheck className="w-5 h-5"/>, title:"Risk Intelligence",       desc:"ML-driven anomaly detection flags suspicious offline activity before it syncs, protecting your balance."   },
];

function LandingPage({ onEnter }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden font-sans">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-7xl mx-auto" role="navigation" aria-label="Main">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner" aria-hidden="true">
            <span className="text-white text-sm font-black">Ω</span>
          </div>
          <span className="font-bold text-slate-900 text-xl tracking-tight">OffPay</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[15px] font-semibold text-slate-500">
          {["Product","Security","Pricing","Docs"].map(l => (
            <a key={l} href="#" className="hover:text-slate-900 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg">{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="md">Sign In</Button>
          <Button variant="primary" size="md" onClick={onEnter}>Get Started</Button>
        </div>
      </nav>

      <section className="px-6 sm:px-10 pt-16 pb-24 max-w-7xl mx-auto text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl opacity-60" />
          <div className="absolute top-16 right-1/4 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-40" />
        </div>
        <div className="relative z-10">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_4px_14px_rgba(0,0,0,0.05)] rounded-full px-4 py-2 mb-8">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span className="text-[13px] font-bold text-slate-700 tracking-wide uppercase">Payments that work. Even offline.</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-5xl md:text-6xl font-black text-slate-900 leading-[1.07] tracking-tight max-w-3xl mx-auto">
            Digital Payments<br />
            <span className="text-indigo-600">Without</span> the Internet
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-8 text-[19px] text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium">
            OffPay lets you send, receive, and settle payments anywhere — zero connectivity required. Built for India's next billion users.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="flex items-center justify-center gap-4 mt-12 flex-wrap">
            <Button variant="primary" size="lg" onClick={onEnter}>Launch Dashboard →</Button>
            <Button variant="secondary" size="lg">Watch Demo ▶</Button>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="flex items-center justify-center gap-8 sm:gap-14 mt-16 flex-wrap">
            {[
              { val:"99.2%",    label:"Offline success rate"  },
              { val:"< 5ms",    label:"Token verification"    },
              { val:"₹200Cr+",  label:"Monthly settlements"   },
              { val:"ISO 27001",label:"Certified security"    },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-[28px] font-black tracking-tight text-slate-900">{s.val}</p>
                <p className="text-[13px] font-medium text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-6 sm:px-10 py-24 max-w-7xl mx-auto" aria-labelledby="features-heading">
        <div className="text-center mb-16">
          <h2 id="features-heading" className="text-[40px] font-black text-slate-900 tracking-tight">Built for the real world</h2>
          <p className="text-slate-500 mt-4 text-[19px] font-medium">Every feature engineered for reliability, security, and scale.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 ease-out">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-5 shadow-inner" aria-hidden="true">{f.icon}</div>
              <h3 className="font-bold text-slate-900 text-[17px] tracking-tight mb-2">{f.title}</h3>
              <p className="text-[14px] font-medium text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 px-6 sm:px-10 py-10 border-t border-slate-800" role="contentinfo">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner"><span className="text-white text-xs font-black">Ω</span></div>
            <span className="font-bold text-white text-[15px] tracking-tight">OffPay</span>
          </div>
          <p className="text-[13px] font-medium text-slate-500">© 2026 OffPay Technologies Pvt. Ltd.</p>
          <nav className="flex gap-6 text-[13px] font-semibold text-slate-400" aria-label="Footer">
            {["Privacy","Terms","Security"].map(l => (
              <a key={l} href="#" className="hover:text-white transition-colors focus:outline-none focus-visible:underline rounded">{l}</a>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [tab, setTab] = useState("login");
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-emerald-100 rounded-full blur-3xl opacity-40" />
      </div>

      <motion.main initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="relative w-full max-w-md z-10" role="main">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200/50" aria-hidden="true">
            <span className="text-white text-2xl font-black">Ω</span>
          </div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight">Welcome to OffPay</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Offline-first digital payments</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8">
          <div className="flex bg-slate-100/80 rounded-2xl p-1.5 mb-7" role="tablist" aria-label="Authentication options">
            {[{id:"login",label:"Sign In"},{id:"register",label:"Sign Up"}].map(({ id, label }) => (
              <button
                key={id} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} onClick={() => setTab(id)}
                className={cls("flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95",
                  tab === id ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-slate-900" : "text-slate-500 hover:text-slate-700")}
              >{label}</button>
            ))}
          </div>

          <div id={`panel-${tab}`} role="tabpanel">
            <form className="space-y-4" onSubmit={e => { e.preventDefault(); onLogin(); }}>
              {tab === "register" && <Input label="Full Name" placeholder="Arjun Kumar" name="reg-name" icon={<User className="w-4 h-4"/>} />}
              <Input label="Email"    placeholder="you@example.com" type="email"    name="auth-email" icon={<Mail className="w-4 h-4"/>}  />
              <Input label="Password" placeholder="••••••••"        type="password" name="auth-pass"  icon={<Lock className="w-4 h-4"/>} />
              {tab === "register" && <Input label="Confirm Password" placeholder="••••••••" type="password" name="auth-confirm" icon={<Lock className="w-4 h-4"/>} />}

              <Button type="submit" variant="primary" size="lg" className="w-full mt-4">
                {tab === "login" ? "Sign In →" : "Create Account →"}
              </Button>
            </form>

            <div className="relative flex items-center gap-3 my-6" aria-hidden="true">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[13px] font-semibold text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button" aria-label="Continue with Google"
              className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-all duration-150 active:scale-95 active:shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span className="font-black text-blue-500 text-lg">G</span> Continue with Google
            </button>

            {tab === "login" && (
              <p className="text-center text-[13px] font-medium text-slate-400 mt-6">
                Protected by end-to-end encryption ·{" "}
                <a href="#" className="text-indigo-500 font-semibold hover:text-indigo-600 transition-colors focus:outline-none focus-visible:underline rounded">Forgot password?</a>
              </p>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// APP LAYOUT WRAPPER — UPGRADE #3 & #5
// ─────────────────────────────────────────────────────────────
function AppLayout({ page, onNav, children }) {
  const { dark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className={cls("flex h-screen overflow-hidden transition-colors duration-500 relative", dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900")}>
      {/* Ambient Depth Background Layer */}
      <div className={cls("absolute inset-0 opacity-60 pointer-events-none transition-colors duration-500", dark ? "bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950" : "bg-gradient-to-br from-indigo-50 via-white to-emerald-50")} />
      
      <div className="relative flex w-full h-full z-10">
        <Sidebar active={page} onNav={onNav} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

        <MobileSheet open={mobileOpen} onClose={() => setMobileOpen(false)} active={page} onNav={onNav} />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0 z-10">
          <TopNav page={page} onMenuOpen={() => setMobileOpen(true)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6" id="main-content" tabIndex={-1}>
            {/* Framer Motion Page Transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={page}
                initial={{ opacity: 0, y: 15, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.99 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="-m-4 sm:-m-6" /* Negate padding to allow children to handle it properly */
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [page, setPage]     = useState("overview");

  // UPGRADE #1: System Theme Detection & Persistence
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("offpay-theme");
    if (saved) {
      setDark(saved === "dark");
    } else {
      setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("offpay-theme", dark ? "dark" : "light");
  }, [dark]);

  // UPGRADE #7: Smooth Scrollbar Styling
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-thumb { background: ${dark ? '#334155' : '#cbd5e1'}; border-radius: 10px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [dark]);

  const theme = { dark, toggle: () => setDark(d => !d) };

  const renderScreen = () => {
    if (screen === "landing") return <LandingPage onEnter={() => setScreen("auth")} />;
    if (screen === "auth")    return <AuthPage    onLogin={() => setScreen("app")}  />;

    const pages = {
      overview:     <OverviewPage />,
      wallet:       <WalletPage />,
      tokens:       <TokensPage />,
      transactions: <TransactionsPage />,
      sync:         <SyncPage />,
      analytics:    <AnalyticsPage />,
      settings:     <SettingsPage />,
    };

    return (
      <AppLayout page={page} onNav={setPage}>
        {pages[page] ?? <OverviewPage />}
      </AppLayout>
    );
  };

  return (
    <ThemeCtx.Provider value={theme}>
      {renderScreen()}
    </ThemeCtx.Provider>
  );
}