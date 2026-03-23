import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import usePageLoad from "../hooks/usePageLoad";
import { cls } from "../utils/cls";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";
import { PlusCircle, Disc } from "lucide-react";
import { getUserWallets, getWalletTokens } from "../api/api";
import { useEffect, useState } from "react";

export default function TokensPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [wallets, setWallets] = useState([]);
  const [tokens, setTokens] = useState([]);
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    getUserWallets(userId)
      .then(data => {
        setWallets(data);
        if (data.length > 0) {
          localStorage.setItem("wallet_id", data[0].id);
          return getWalletTokens(data[0].id);
        }
        return [];
      })
      .then(tokenData => {
        if (tokenData) setTokens(tokenData);
      })
      .catch(err => console.error(err));
  }, []);
  const barCls = (s, u) => s === "failed" ? (dark ? "bg-slate-600" : "bg-slate-300") : u > 90 ? "bg-amber-400" : "bg-indigo-500";

  if (loading) return <div className="p-6 space-y-4">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid sm:grid-cols-3 gap-5">
        {[{ label: "Active Tokens", val: 12, max: 20, bar: "bg-indigo-500" },
        { label: "Expiring Soon", val: 3, max: 12, bar: "bg-amber-400" },
        { label: "Exhausted", val: 5, max: 12, bar: dark ? "bg-slate-600" : "bg-slate-300" }
        ].map((s, i) => (
          <Card key={i} className="p-6">
            <p className={cls("text-sm font-medium", T.muted(dark))}>{s.label}</p>
            <p className={cls("text-[32px] font-bold mt-1 tracking-tight", T.text(dark))}>{s.val}</p>
            <div className={cls("mt-4 rounded-full h-1.5", dark ? "bg-slate-800" : "bg-slate-100")}>
              <div className={cls("h-1.5 rounded-full transition-all duration-1000", s.bar)} style={{ width: `${(s.val / s.max) * 100}%` }} />
            </div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className={cls("px-6 py-5 border-b flex items-center justify-between", T.divider(dark))}>
          <p className={cls("font-semibold text-[15px]", T.text(dark))}>Token Registry</p>
          <Button variant="primary" size="sm"><PlusCircle className="w-4 h-4" /> Issue New Token</Button>
        </div>
        <div className="divide-y" style={{ borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
          {tokens.map((tk, i) => (
            <div key={i} className={cls("px-6 py-5 flex items-center gap-5 transition-colors cursor-pointer", dark ? "hover:bg-slate-800/40" : "hover:bg-slate-50")}>
              <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner", dark ? "bg-indigo-500/20" : "bg-indigo-50")}>
                <Disc className="text-indigo-500 w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <p className={cls("text-[15px] font-semibold font-mono tracking-tight", T.text(dark))}>{tk.id.slice(0,18)}...</p>
                  <Badge variant={tk.status}>{tk.status === "active" ? "Active" : tk.status === "pending" ? "Expiring" : "Exhausted"}</Badge>
                </div>
                
                {/* Partial spending indicator */}
                <div className="flex items-center justify-between mt-3 text-sm font-medium">
                  <span className={cls(T.muted(dark))}>Remaining Value</span>
                  <span className={cls("font-bold text-indigo-500")} aria-label={`Remaining value: ${tk.remaining_value !== undefined ? tk.remaining_value : tk.token_value}`}>
                     ₹{tk.remaining_value !== undefined ? Number(tk.remaining_value).toLocaleString() : Number(tk.token_value).toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 mt-2">
                  <div className={cls("flex-1 rounded-full h-1.5", dark ? "bg-slate-800" : "bg-slate-100")}>
                    <div className={cls("h-1.5 rounded-full transition-all duration-500", barCls(tk.status, tk.used || 0))} style={{ width: `${tk.used || 0}%` }} />
                  </div>
                  <span className={cls("text-xs font-medium whitespace-nowrap", T.subtle(dark))}>{tk.used || 0}% used</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex flex-col items-end">
                <p className={cls("text-xs uppercase tracking-wider font-semibold mb-1", T.subtle(dark))}>Mint Value</p>
                <Badge variant="default" className="text-sm">
                  ₹{Number(tk.token_value).toLocaleString()}
                </Badge>
                {/* Expiry Countdown */}
                <p className={cls("text-xs mt-2 font-medium flex gap-1", T.subtle(dark))}>
                   Expires {new Date(tk.expires_at || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
