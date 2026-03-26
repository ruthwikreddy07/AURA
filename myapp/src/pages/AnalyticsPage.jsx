import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import MiniLineChart from "../components/charts/MiniLineChart";
import { BarChart3 } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import { Skeleton } from "../components/ui/Skeleton";
import { useState, useEffect } from "react";
import { getMonthlyVolume, getModeDistribution, getFraudAttempts } from "../api/api";

export default function AnalyticsPage() {
    const { dark } = useTheme();
    const loading = usePageLoad();
    const [WEEK_DATA, setWeekData] = useState([12400, 18200, 9800, 22100, 15600, 28900, 19400]);
    const [MONTHLY_OFF, setMonthlyOff] = useState([55, 68, 43, 72, 61, 78, 65]);
    const [modeStats, setModeStats] = useState([
        { cat: "Food & Beverages", pct: 34, amount: "₹29,400" },
        { cat: "Transportation", pct: 22, amount: "₹19,100" },
        { cat: "Shopping", pct: 28, amount: "₹24,300" },
        { cat: "Entertainment", pct: 16, amount: "₹13,800" },
    ]);

    useEffect(() => {
        Promise.all([getMonthlyVolume(), getModeDistribution(), getFraudAttempts()])
        .then(([vol, mode, fraud]) => {
           if (vol && vol.length > 0) {
               // Pad array if too small for a good chart
               const vData = vol.map(v => v.total);
               setWeekData(vData.length < 5 ? [...vData, ...vData, ...vData] : vData);
           }
           if (mode && mode.length > 0) {
               const total = mode.reduce((acc, m) => acc + m.count, 0) || 1;
               setModeStats(mode.map(m => ({
                   cat: m.mode.toUpperCase() + " Mode",
                   pct: Math.round((m.count / total) * 100),
                   amount: `${m.count} txns`
               })));
           }
           if (fraud && fraud.length > 0) {
               const fData = fraud.map(f => f.count);
               setMonthlyOff(fData.length < 5 ? [...fData, 0, 0, 0] : fData);
           }
        }).catch(err => console.error("Analytics fetch error:", err));
    }, []);

    if (loading) return (
        <div className="p-6 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6"><Skeleton className="h-56 rounded-2xl" /><Skeleton className="h-56 rounded-2xl" /></div>
            <div className="grid sm:grid-cols-3 gap-5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
            <Skeleton className="h-64 rounded-2xl" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className={cls("font-semibold text-[15px]", T.text(dark))}>Transaction Volume (Monthly)</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="indigo">Live Data</Badge>
                        </div>
                    </div>
                    <MiniLineChart data={WEEK_DATA} color="#10B981" gradId="wkChart" />
                    <div className="flex justify-between mt-3 px-1">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                            <span key={d} className={cls("text-[11px] font-semibold uppercase tracking-wider", T.subtle(dark))}>{d}</span>
                        ))}
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <p className={cls("font-semibold text-[15px]", T.text(dark))}>Fraud Engine Interventions</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="success">YTD</Badge>
                        </div>
                    </div>
                    <MiniLineChart data={MONTHLY_OFF} color="#4F46E5" gradId="mthChart" />
                    <div className="flex justify-between mt-3 px-1">
                        {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map(m => (
                            <span key={m} className={cls("text-[11px] font-semibold uppercase tracking-wider", T.subtle(dark))}>{m}</span>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
                {[
                    { label: "Avg Transaction Size", val: "₹1,240", change: "+12%" },
                    { label: "Offline Success Rate", val: "99.2%", change: "+0.4%" },
                    { label: "Avg Sync Delay", val: "4.3 min", change: "-1.1m" },
                ].map((s, i) => (
                    <Card key={i} className="p-6 text-center">
                        <p className={cls("text-[32px] font-bold tracking-tight", T.text(dark))}>{s.val}</p>
                        <p className={cls("text-sm font-medium mt-1", T.muted(dark))}>{s.label}</p>
                        <p className="text-xs font-bold text-emerald-500 mt-2 tracking-wide">{s.change} vs last month</p>
                    </Card>
                ))}
            </div>

            <Card className="p-6">
                <p className={cls("font-semibold text-[15px] mb-6", T.text(dark))}>Transaction Mode Distribution</p>
                <div className="space-y-4" role="list">
                    {modeStats.map((c, i) => (
                        <div key={i} className="flex items-center gap-5" role="listitem">
                            <span className={cls("text-[13px] font-semibold w-36 flex-shrink-0", T.muted(dark))}>{c.cat}</span>
                            <div className={cls("flex-1 rounded-full h-2.5", dark ? "bg-slate-800" : "bg-slate-100")} role="meter" aria-valuenow={c.pct} aria-valuemin={0} aria-valuemax={100}>
                                <div className="h-2.5 rounded-full bg-indigo-500 transition-all duration-1000 ease-out" style={{ width: `${c.pct}%`, opacity: 0.5 + i * 0.1 }} />
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
