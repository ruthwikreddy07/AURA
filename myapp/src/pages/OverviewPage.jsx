import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import KPICard from "../components/ui/KPICard";
import { Skeleton, KPICardSkeleton } from "../components/ui/Skeleton";
import MiniLineChart from "../components/charts/MiniLineChart";
import { Wallet, Disc, RefreshCw, BarChart3, ArrowUp, PlusCircle, LayoutGrid, ArrowDown } from "lucide-react";
import { cls } from "../utils/cls";
import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import usePageLoad from "../hooks/usePageLoad";
import { getUserWallets, getUserTransactions } from "../api/api";
import { useEffect, useState } from "react";

// ─────────────────────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────────────────────
const CHART_DATA = [4200, 3800, 5100, 4700, 6300, 5800, 7200, 6900, 8100, 7600, 9200, 8800];

export default function OverviewPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const userId = localStorage.getItem("user_id");

const [wallets, setWallets] = useState([]);
const [transactions, setTransactions] = useState([]);
const totalBalance =
  wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);

const pendingSync =
  transactions.filter(tx => tx.status === "initiated").length;

const monthlyVolume =
  transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const timeline = [
    { time: "2m ago", desc: "Token sync completed", type: "success" },
    { time: "14m ago", desc: "₹2,400 received offline", type: "success" },
    { time: "31m ago", desc: "Token expiry warning", type: "warning" },
    { time: "1h ago", desc: "₹800 payment dispatched", type: "default" },
    { time: "2h ago", desc: "Device authorized: Samsung S24", type: "default" },
  ];
  const dotCls = { success: "bg-emerald-400", warning: "bg-amber-400", default: dark ? "bg-slate-500" : "bg-slate-300" };
  useEffect(() => {

  async function loadData() {
    try {

      const w = await getUserWallets(userId);
      const t = await getUserTransactions(userId);

      setWallets(w);
      setTransactions(t);

    } catch (err) {
      console.error("Overview data error:", err);
    }
  }

  loadData();

}, []);
  if (loading) return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map(i => <KPICardSkeleton key={i} />)}</div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className={cls("lg:col-span-2 rounded-2xl border p-5", dark ? "bg-slate-900/60 border-white/10" : "bg-white/70 border-white/40")}><Skeleton className="h-48" /></div>
        <div className={cls("rounded-2xl border p-5", dark ? "bg-slate-900/60 border-white/10" : "bg-white/70 border-white/40")}><Skeleton className="h-48" /></div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Balance" value={`₹${totalBalance.toLocaleString()}`} sub="Across 3 wallets" icon={<Wallet className="w-5 h-5" />} color="indigo" trend={8.2} />
        <KPICard label="Token Allocation" value="₹32,000" sub="68% utilized" icon={<Disc className="w-5 h-5" />} color="emerald" trend={3.1} />
        <KPICard label="Pending Sync" value={`${pendingSync} txns`} sub="Last sync 4min ago" icon={<RefreshCw className="w-5 h-5" />} color="amber" trend={-2} />
        <KPICard label="Monthly Volume" value={`₹${monthlyVolume.toLocaleString()}`} sub="Vs ₹7.2L last month" icon={<BarChart3 className="w-5 h-5" />} color="slate" trend={23.6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={cls("font-semibold text-[15px]", T.text(dark))}>Transaction Volume</p>
              <p className={cls("text-xs mt-0.5", T.muted(dark))}>Last 12 months</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success"><ArrowUp className="w-3 h-3" /> 23.6%</Badge>
              <Button variant="ghost" size="sm">Export</Button>
            </div>
          </div>
          <MiniLineChart data={CHART_DATA} color="#4F46E5" gradId="ovChart" />
          <div className="flex justify-between mt-3 px-1">
            {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
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
          <Button variant="primary" size="sm"><PlusCircle className="w-4 h-4" /> Issue Tokens</Button>
          <Button variant="emerald" size="sm"><ArrowDown className="w-4 h-4" /> Receive Payment</Button>
          <Button variant="secondary" size="sm"><ArrowUp className="w-4 h-4" /> Send Payment</Button>
          <Button variant="secondary" size="sm"><RefreshCw className="w-4 h-4" /> Force Sync</Button>
          <Button variant="ghost" size="sm"><LayoutGrid className="w-4 h-4" /> All Transactions</Button>
        </div>
      </Card>
    </div>
  );
}