import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { Bell, ArrowDown, ArrowUp, Clock, ShieldAlert, RefreshCw, Disc, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import usePageLoad from "../hooks/usePageLoad";
import { Skeleton } from "../components/ui/Skeleton";

const MOCK_NOTIFICATIONS = [
  { id: 1, type: "received", title: "Payment Received", desc: "₹2,400 from Arjun K. via BLE", time: "2 min ago", icon: ArrowDown, color: "emerald" },
  { id: 2, type: "sent", title: "Payment Sent", desc: "₹500 to Priya M. via QR", time: "15 min ago", icon: ArrowUp, color: "indigo" },
  { id: 3, type: "expiry", title: "Token Expiring Soon", desc: "TKN-7821 expires in 2 hours — ₹800 remaining", time: "1 hr ago", icon: Clock, color: "amber" },
  { id: 4, type: "security", title: "New Device Login", desc: "Chrome on Windows detected. Was this you?", time: "3 hr ago", icon: ShieldAlert, color: "red" },
  { id: 5, type: "sync", title: "Sync Complete", desc: "4 offline transactions settled successfully", time: "5 hr ago", icon: RefreshCw, color: "blue" },
  { id: 6, type: "refund", title: "Token Auto-Refund", desc: "TKN-3291 expired — ₹1,200 refunded to wallet", time: "Yesterday", icon: Disc, color: "violet" },
  { id: 7, type: "received", title: "Payment Received", desc: "₹1,000 from Rahul D. via NFC", time: "Yesterday", icon: ArrowDown, color: "emerald" },
  { id: 8, type: "security", title: "PIN Changed", desc: "Your transaction PIN was updated successfully", time: "2 days ago", icon: ShieldAlert, color: "emerald" },
];

const COLOR_MAP = {
  emerald: { bg: "bg-emerald-500/15", text: "text-emerald-500", border: "border-emerald-500/20" },
  indigo:  { bg: "bg-indigo-500/15", text: "text-indigo-500", border: "border-indigo-500/20" },
  amber:   { bg: "bg-amber-500/15", text: "text-amber-500", border: "border-amber-500/20" },
  red:     { bg: "bg-red-500/15", text: "text-red-500", border: "border-red-500/20" },
  blue:    { bg: "bg-blue-500/15", text: "text-blue-500", border: "border-blue-500/20" },
  violet:  { bg: "bg-violet-500/15", text: "text-violet-500", border: "border-violet-500/20" },
};

export default function NotificationsPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();

  if (loading) return <div className="p-6 space-y-4">{[0,1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className={cls("text-2xl font-bold tracking-tight", T.text(dark))}>Notifications</h1>
          <p className={cls("mt-1 text-sm font-medium", T.muted(dark))}>Transaction alerts, security events & token updates</p>
        </div>
        <Button variant="secondary" size="sm">Mark all read</Button>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        {["All", "Payments", "Security", "Tokens", "Sync"].map(filter => (
          <button key={filter} className={cls(
            "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
            filter === "All" 
              ? (dark ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600")
              : (dark ? "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900")
          )}>
            {filter}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {MOCK_NOTIFICATIONS.map((notif, i) => {
          const colors = COLOR_MAP[notif.color];
          const Icon = notif.icon;
          return (
            <motion.div 
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-5 cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", colors.bg)}>
                    <Icon className={cls("w-5 h-5", colors.text)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={cls("text-[15px] font-bold tracking-tight", T.text(dark))}>{notif.title}</p>
                      {i < 3 && <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />}
                    </div>
                    <p className={cls("text-[13px] font-medium leading-relaxed", T.muted(dark))}>{notif.desc}</p>
                  </div>
                  <span className={cls("text-xs font-medium whitespace-nowrap mt-1", T.subtle(dark))}>{notif.time}</span>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
