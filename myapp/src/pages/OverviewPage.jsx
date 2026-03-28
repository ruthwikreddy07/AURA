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
import { getUserWallets, getUserTransactions, getWalletTokens, getProfile } from "../api/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────────────────────
// PAGE: OVERVIEW
// ─────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const navigate = useNavigate();
  const userId = localStorage.getItem("user_id");

  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [profile, setProfile] = useState(null);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  const pendingSync = transactions.filter(tx => tx.status === "initiated").length;
  const monthlyVolume = transactions.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // Token allocation — compute from actual tokens
  const tokenTotal = tokens.reduce((sum, t) => sum + Number(t.token_value || 0), 0);
  const tokenRemaining = tokens.reduce((sum, t) => sum + Number(t.remaining_value || t.token_value || 0), 0);
  const tokenUtilPct = tokenTotal > 0 ? Math.round(((tokenTotal - tokenRemaining) / tokenTotal) * 100) : 0;

  // Build activity feed from real transactions (latest 5)
  const activityFeed = transactions.slice(0, 5).map(tx => {
    const isRecent = (Date.now() - new Date(tx.created_at).getTime()) < 3600000;
    return {
      time: new Date(tx.created_at).toLocaleString(),
      desc: `₹${Number(tx.amount).toLocaleString()} ${tx.sender_id === userId ? "sent" : "received"} via ${tx.mode || "AURA"}`,
      type: tx.status === "success" ? "success" : tx.status === "failed" ? "warning" : "default"
    };
  });

  // Build chart data from transactions (group by month if enough data, else use raw amounts)
  const chartData = transactions.length > 0
    ? transactions.slice(0, 12).map(tx => Number(tx.amount || 0))
    : [0];

  useEffect(() => {
    async function loadData() {
      try {
        const p = await getProfile();
        const w = await getUserWallets(userId);
        const t = await getUserTransactions(userId);
        setProfile(p);
        setWallets(w);
        setTransactions(t);

        // Fetch tokens from first wallet
        if (w.length > 0) {
          const tkns = await getWalletTokens(w[0].id);
          setTokens(tkns || []);
        }
      } catch (err) {
        console.error("Overview data error:", err);
      }
    }
    if (userId) loadData();
  }, []);

  const dotCls = { success: "bg-emerald-400", warning: "bg-amber-400", default: dark ? "bg-slate-500" : "bg-slate-300" };

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

      {/* KYC Banner */}
      {profile?.kyc_status === "pending" && (
        <div className={cls("p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm", dark ? "bg-amber-900/10 border-amber-500/20 text-amber-200" : "bg-amber-50 border-amber-200 text-amber-900")}>
          <div>
            <h3 className="font-bold flex items-center gap-2">⚠️ Standard Tier Active (₹5,000 Offline Limit)</h3>
            <p className="text-sm opacity-80 mt-1">Upgrade your KYC to unlock the ₹1,00,000 Pro offline transaction limit.</p>
          </div>
          <Button variant="outline" className={cls("shrink-0", dark ? "border-amber-500/50 hover:bg-amber-500/20 text-amber-300" : "border-amber-300 hover:bg-amber-100")} onClick={() => navigate("/app/settings")}>
            Verify Aadhaar
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Balance" value={`₹${totalBalance.toLocaleString()}`} sub={`Across ${wallets.length} wallet${wallets.length !== 1 ? "s" : ""}`} icon={<Wallet className="w-5 h-5" />} color="indigo" trend={8.2} />
        <KPICard label="Token Allocation" value={`₹${tokenTotal.toLocaleString()}`} sub={`${tokenUtilPct}% utilized`} icon={<Disc className="w-5 h-5" />} color="emerald" trend={3.1} />
        <KPICard label="Pending Sync" value={`${pendingSync} txns`} sub="Waiting for settlement" icon={<RefreshCw className="w-5 h-5" />} color="amber" trend={-2} />
        <KPICard label="Monthly Volume" value={`₹${monthlyVolume.toLocaleString()}`} sub={`${transactions.length} transactions`} icon={<BarChart3 className="w-5 h-5" />} color="slate" trend={23.6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className={cls("font-semibold text-[15px]", T.text(dark))}>Transaction Volume</p>
              <p className={cls("text-xs mt-0.5", T.muted(dark))}>{transactions.length > 0 ? `${transactions.length} transactions` : "No transactions yet"}</p>
            </div>
            <div className="flex items-center gap-2">
              {transactions.length > 0 && <Badge variant="success"><ArrowUp className="w-3 h-3" /> Active</Badge>}
            </div>
          </div>
          {chartData.length > 1 ? (
            <MiniLineChart data={chartData} color="#4F46E5" gradId="ovChart" />
          ) : (
            <div className={cls("flex items-center justify-center h-40 rounded-xl", dark ? "bg-slate-800/40" : "bg-slate-50")}>
              <p className={cls("text-sm font-medium", T.muted(dark))}>Transaction chart will appear after your first transactions</p>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <p className={cls("font-semibold text-[15px] mb-5", T.text(dark))}>Activity Feed</p>
          {activityFeed.length > 0 ? (
            <ol className="space-y-4">
              {activityFeed.map((t2, i) => (
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
          ) : (
            <div className={cls("flex items-center justify-center h-32 rounded-xl", dark ? "bg-slate-800/40" : "bg-slate-50")}>
              <p className={cls("text-sm font-medium", T.muted(dark))}>No recent activity</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-4", T.text(dark))}>Quick Actions</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" size="sm" onClick={() => navigate("/app/tokens")}><PlusCircle className="w-4 h-4" /> Issue Tokens</Button>
          <Button variant="emerald" size="sm" onClick={() => navigate("/app/receive")}><ArrowDown className="w-4 h-4" /> Receive Payment</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate("/app/send")}><ArrowUp className="w-4 h-4" /> Send Payment</Button>
          <Button variant="secondary" size="sm" onClick={() => navigate("/app/sync")}><RefreshCw className="w-4 h-4" /> Force Sync</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/transactions")}><LayoutGrid className="w-4 h-4" /> All Transactions</Button>
        </div>
      </Card>
    </div>
  );
}