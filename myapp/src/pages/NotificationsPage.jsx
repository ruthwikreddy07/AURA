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
import { useState, useEffect } from "react";
import { getAlerts } from "../api/api";
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
  const [activeFilter, setActiveFilter] = useState("All");
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if(!userId) return;
    getAlerts(userId).then(data => {
       const mapped = data.map(dbAlert => {
          let icon = Bell;
          let color = "indigo";
          if(dbAlert.type === "security") { icon = ShieldAlert; color = "amber"; }
          if(dbAlert.type === "system") { icon = RefreshCw; color = "blue"; }
          if(dbAlert.type === "transaction" && dbAlert.message.toLowerCase().includes("received")) { icon = ArrowDown; color = "emerald"; }
          if(dbAlert.type === "transaction" && dbAlert.message.toLowerCase().includes("sent")) { icon = ArrowUp; color = "indigo"; }
          
          return {
             id: dbAlert.id,
             type: dbAlert.type,
             title: dbAlert.type.charAt(0).toUpperCase() + dbAlert.type.slice(1) + " Alert",
             desc: dbAlert.message,
             time: new Date(dbAlert.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
             icon, color
          };
       });
       setAlerts(mapped);
    }).catch(console.error);
  }, []);

  const FILTER_MAP = {
    All: null,
    Payments: ["transaction"],
    Security: ["security"],
    Tokens: ["expiry", "refund"],
    Sync: ["system"],
  };

  const filteredNotifications = activeFilter === "All"
    ? alerts
    : alerts.filter(n => FILTER_MAP[activeFilter]?.includes(n.type));

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
          <button key={filter} onClick={() => setActiveFilter(filter)} className={cls(
            "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border",
            filter === activeFilter
              ? (dark ? "bg-indigo-500/20 border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border-indigo-200 text-indigo-600")
              : (dark ? "bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white" : "bg-white border-slate-200 text-slate-500 hover:text-slate-900")
          )}>
            {filter}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filteredNotifications.map((notif, i) => {
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
