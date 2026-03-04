import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import { LayoutGrid, Wallet, Disc, ArrowRightLeft, RefreshCw, BarChart3, Settings, Send, Inbox, Radio } from "lucide-react";

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: <LayoutGrid className="w-4 h-4" /> },
  { id: "wallet", label: "Wallet", icon: <Wallet className="w-4 h-4" /> },
  { id: "tokens", label: "Tokens", icon: <Disc className="w-4 h-4" /> },
  { id: "transactions", label: "Transactions", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { id: "sync", label: "Sync", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "send", label: "Send", icon: <Send className="w-4 h-4" /> },
  { id: "receive", label: "Receive", icon: <Inbox className="w-4 h-4" /> },
  { id: "modecontrol", label: "Mode Control", icon: <Radio className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];
// ─────────────────────────────────────────────────────────────
// SIDEBAR CONTENT
// ─────────────────────────────────────────────────────────────
export function SidebarContent({ active, onNav, collapsed = false }) {
    const { dark } = useTheme();
    return (
        <div className="flex flex-col h-full">
            <div className={cls(
  "flex items-center gap-3 px-4 py-5 border-b",
  dark ? "border-slate-700" : "border-slate-200"
)}>
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
                <div className={cls(
  "p-4 border-t",
  dark ? "border-slate-700" : "border-slate-200"
)}>
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
            <div className={cls(
  "p-3 border-t",
  dark ? "border-slate-700" : "border-slate-200"
)}>
                <button
                    onClick={onToggle}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={cls("w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all duration-150 ease-out text-sm", T.navHover(dark), "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95")}
                >
                    {collapsed ? <ArrowRightLeft className="w-4 h-4" /> : <><ArrowRightLeft className="w-4 h-4" /><span className="text-xs font-semibold">Collapse</span></>}
                </button>
            </div>
        </aside>
    );
}
export default Sidebar;