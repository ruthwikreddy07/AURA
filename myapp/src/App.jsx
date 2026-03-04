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
import { ThemeProvider } from "./context/ThemeContext";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Routes, Route, Navigate } from "react-router-dom"
import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid, Wallet, Disc, ArrowRightLeft, RefreshCw, BarChart3, Settings,
  User, Mail, Lock, PlusCircle, ArrowDown, ArrowUp, AlertTriangle, CheckCircle,
  Search, Bell, Menu, X, Smartphone, ShieldCheck,
  Send, Inbox, Radio, Bluetooth, Volume2, Sun, QrCode, Wifi,
  Zap, Activity, Battery, Mic, Eye, Gauge, Fingerprint, Clock, ShieldAlert,
  CheckCircle2, Loader2, ScanLine, Cpu, Signal
} from "lucide-react";
// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import OverviewPage from "./pages/OverviewPage";
import WalletPage from "./pages/WalletPage";
import TokensPage from "./pages/TokensPage";
import TransactionsPage from "./pages/TransactionsPage";
import SyncPage from "./pages/SyncPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SendPage from "./pages/SendPage";
import ReceivePage from "./pages/ReceivePage";
import ModeControlPage from "./pages/ModeControlPage";
import SettingsPage from "./pages/SettingsPage";

// Layout
import AppLayout from "./layout/AppLayout";

// ─────────────────────────────────────────────────────────────
// NAV ITEMS — UPGRADE #6: Lucide Icons
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "overview", icon: <LayoutGrid className="w-[18px] h-[18px]" />, label: "Overview" },
  { id: "wallet", icon: <Wallet className="w-[18px] h-[18px]" />, label: "Wallet" },
  { id: "tokens", icon: <Disc className="w-[18px] h-[18px]" />, label: "Offline Tokens" },
  { id: "send", icon: <Send className="w-[18px] h-[18px]" />, label: "Send" },
  { id: "receive", icon: <Inbox className="w-[18px] h-[18px]" />, label: "Receive" },
  { id: "modecontrol", icon: <Radio className="w-[18px] h-[18px]" />, label: "Mode Control" },
  { id: "transactions", icon: <ArrowRightLeft className="w-[18px] h-[18px]" />, label: "Transactions" },
  { id: "sync", icon: <RefreshCw className="w-[18px] h-[18px]" />, label: "Sync Status" },
  { id: "analytics", icon: <BarChart3 className="w-[18px] h-[18px]" />, label: "Analytics" },
  { id: "settings", icon: <Settings className="w-[18px] h-[18px]" />, label: "Settings" },
];




// ─────────────────────────────────────────────────────────────
// AURA PROTOCOL — SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────

// ModeBadge — reusable component for communication mode display
function ModeBadge({ mode, active = false, size = "md" }) {
  const { dark } = useTheme();
  const modes = {
    BLE: { icon: <Bluetooth className="w-3.5 h-3.5" />, color: active ? "bg-blue-500/15 text-blue-500 border-blue-500/30" : (dark ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-slate-100 text-slate-400 border-slate-200") },
    Sound: { icon: <Volume2 className="w-3.5 h-3.5" />, color: active ? "bg-violet-500/15 text-violet-500 border-violet-500/30" : (dark ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-slate-100 text-slate-400 border-slate-200") },
    Light: { icon: <Sun className="w-3.5 h-3.5" />, color: active ? "bg-amber-500/15 text-amber-500 border-amber-500/30" : (dark ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-slate-100 text-slate-400 border-slate-200") },
    QR: { icon: <QrCode className="w-3.5 h-3.5" />, color: active ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" : (dark ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-slate-100 text-slate-400 border-slate-200") },
    NFC: { icon: <Wifi className="w-3.5 h-3.5" />, color: active ? "bg-indigo-500/15 text-indigo-500 border-indigo-500/30" : (dark ? "bg-slate-800 text-slate-500 border-slate-700" : "bg-slate-100 text-slate-400 border-slate-200") },
  };
  const m = modes[mode] ?? modes.BLE;
  return (
    <span className={cls(
      "inline-flex items-center gap-1.5 border rounded-lg font-semibold tracking-wide transition-all duration-200",
      size === "sm" ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
      m.color
    )}>
      {m.icon} {mode}
      {active && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse ml-0.5" aria-hidden="true" />}
    </span>
  );
}

// RiskCard — risk score visualization
function RiskCard({ score, level }) {
  const { dark } = useTheme();
  const configs = {
    Safe: { color: "text-emerald-500", barColor: "bg-emerald-500", bg: dark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200", icon: <ShieldCheck className="w-5 h-5 text-emerald-500" /> },
    Verify: { color: "text-amber-500", barColor: "bg-amber-400", bg: dark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200", icon: <AlertTriangle className="w-5 h-5 text-amber-500" /> },
    "High Risk": { color: "text-red-500", barColor: "bg-red-500", bg: dark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200", icon: <ShieldAlert className="w-5 h-5 text-red-500" /> },
  };
  const c = configs[level] ?? configs.Safe;
  return (
    <div className={cls("p-5 border rounded-2xl backdrop-blur-sm", c.bg)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {c.icon}
          <p className={cls("text-[15px] font-bold", c.color)}>{level}</p>
        </div>
        <p className={cls("text-[28px] font-black tracking-tight", c.color)}>{score}%</p>
      </div>
      <div className={cls("h-2 rounded-full", dark ? "bg-slate-700/60" : "bg-black/10")}>
        <div className={cls("h-2 rounded-full transition-all duration-700 ease-out", c.barColor)} style={{ width: `${score}%` }} />
      </div>
      <p className={cls("text-xs font-medium mt-3", dark ? "text-slate-400" : "text-slate-500")}>
        {level === "Safe" ? "Transaction cleared by AURA Risk Engine. Proceed." : level === "Verify" ? "Moderate anomaly detected. Biometric confirmation required." : "High risk pattern detected. Transaction blocked."}
      </p>
    </div>
  );
}

// HandshakeIndicator — kinetic circular sync animation
function HandshakeIndicator({ state = "searching" }) {
  const { dark } = useTheme();
  const states = {
    searching: { label: "Searching for nearby device…", color: "#4F46E5", pulse: true },
    connecting: { label: "Establishing secure channel…", color: "#4F46E5", pulse: true },
    handshake: { label: "Kinetic handshake in progress…", color: "#10B981", pulse: true },
    verified: { label: "Protocol verified", color: "#10B981", pulse: false },
    failed: { label: "Connection failed", color: "#EF4444", pulse: false },
  };
  const s = states[state] ?? states.searching;
  const circumference = 2 * Math.PI * 44;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-28 h-28">
        {/* Outer pulse ring */}
        {s.pulse && (
          <>
            <div className="absolute inset-0 rounded-full opacity-20 animate-ping" style={{ background: s.color }} />
            <div className="absolute inset-2 rounded-full opacity-10 animate-ping" style={{ background: s.color, animationDelay: "0.3s" }} />
          </>
        )}
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="44" fill="none" stroke={dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"} strokeWidth="4" />
          <circle cx="50" cy="50" r="44" fill="none" stroke={s.color} strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={state === "verified" ? 0 : circumference * 0.25}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.8s ease", animation: s.pulse ? "spin 2s linear infinite" : "none" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {state === "verified" && <CheckCircle2 className="w-10 h-10" style={{ color: s.color }} />}
          {state === "failed" && <X className="w-10 h-10" style={{ color: s.color }} />}
          {state === "searching" && <Signal className="w-8 h-8 opacity-80" style={{ color: s.color }} />}
          {state === "connecting" && <Bluetooth className="w-8 h-8 opacity-80" style={{ color: s.color }} />}
          {state === "handshake" && <Cpu className="w-8 h-8 opacity-80" style={{ color: s.color }} />}
        </div>
      </div>
      <p className={cls("text-sm font-semibold text-center", dark ? "text-slate-300" : "text-slate-600")}>{s.label}</p>
    </div>
  );
}

// EnvironmentMetricRow — reusable environment metric display
function EnvironmentMetricRow({ icon, label, value, unit, pct, color = "indigo" }) {
  const { dark } = useTheme();
  const barColors = { indigo: "bg-indigo-500", emerald: "bg-emerald-500", amber: "bg-amber-400", red: "bg-red-500", blue: "bg-blue-500", violet: "bg-violet-500" };
  return (
    <div className="flex items-center gap-4">
      <div className={cls("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", dark ? "bg-slate-800/60" : "bg-slate-100")}>
        <span className={cls(dark ? "text-slate-300" : "text-slate-500")}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className={cls("text-[13px] font-semibold", dark ? "text-slate-300" : "text-slate-600")}>{label}</span>
          <span className={cls("text-[13px] font-bold tabular-nums", dark ? "text-slate-200" : "text-slate-800")}>{value}<span className={cls("text-xs font-medium ml-0.5", dark ? "text-slate-400" : "text-slate-500")}>{unit}</span></span>
        </div>
        <div className={cls("h-1.5 rounded-full", dark ? "bg-slate-700/60" : "bg-slate-200")}>
          <div className={cls("h-1.5 rounded-full transition-all duration-700 ease-out", barColors[color] ?? barColors.indigo)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}





// ─────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────
export default function App() {

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

  // UPGRADE #7: Smooth Scrollbar Styling + scanline keyframe for QR
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
      @keyframes spin{from{stroke-dashoffset:0}to{stroke-dashoffset:-276}}
      @keyframes scanline{0%,100%{top:20%}50%{top:80%}}
      ::-webkit-scrollbar { width: 8px; }
      ::-webkit-scrollbar-thumb { background: ${dark ? '#334155' : '#cbd5e1'}; border-radius: 10px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, [dark]);

  const theme = { dark, toggle: () => setDark(d => !d) };

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        <Route path="/app" element={<AppLayout />}>
          <Route path="overview" element={<OverviewPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="tokens" element={<TokensPage />} />
          <Route path="send" element={<SendPage />} />
          <Route path="receive" element={<ReceivePage />} />
          <Route path="modecontrol" element={<ModeControlPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="sync" element={<SyncPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </ThemeProvider>
  );
}