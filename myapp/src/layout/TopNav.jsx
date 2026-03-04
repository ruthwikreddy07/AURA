import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, Bell } from "lucide-react";
import { cls } from "../utils/cls";
import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";

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
    const PAGE_LABELS = { overview: "Overview", wallet: "Wallet", tokens: "Offline Tokens", transactions: "Transactions", sync: "Sync Status", analytics: "Analytics", settings: "Settings", send: "Send Payment", receive: "Receive Payment", modecontrol: "Mode Control Center" };

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
                                <div className={cls("px-4 py-3 border-b", dark ? "border-slate-700" : "border-slate-200")}>
                                    <p className={cls("font-semibold text-sm", T.text(dark))}>Notifications</p>
                                </div>
                                {NOTIFICATIONS.map((n, i) => (
                                    <div key={i} role="menuitem" tabIndex={0} className={cls("px-4 py-3 cursor-pointer transition-colors border-b focus:outline-none focus-visible:bg-indigo-50", dark ? "border-slate-700" : "border-slate-200", dark ? "hover:bg-slate-800/60" : "hover:bg-slate-50")}>
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

export default TopNav;