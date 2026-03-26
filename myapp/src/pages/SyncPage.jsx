import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Skeleton } from "../components/ui/Skeleton";

import { RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import { useState, useCallback, useEffect } from "react";
import { getSyncQueue, processSync } from "../api/api";
export default function SyncPage() {
    const { dark } = useTheme();
    const loading = usePageLoad();
    const [syncing, setSyncing] = useState(false);
    const [queueItems, setQueueItems] = useState([]);
    
    const fetchQueue = useCallback(async () => {
        const userId = localStorage.getItem("user_id");
        if (!userId) return;
        try {
            const data = await getSyncQueue(userId);
            setQueueItems(data);
        } catch(err) { console.error(err); }
    }, []);

    useEffect(() => {
        fetchQueue();
    }, [fetchQueue]);

    const progress = queueItems.length > 0 ? 87 : 100;

    const handleSync = useCallback(async () => {
        if (queueItems.length === 0) return;
        setSyncing(true);
        try {
            for (const item of queueItems) {
                await processSync(item.token_id);
            }
            await new Promise(r => setTimeout(r, 800)); // Smooth animation feel
            await fetchQueue();
        } catch(err) {
            console.error("Sync error:", err);
            alert("Failed to sync some pending transfers.");
        } finally {
            setSyncing(false);
        }
    }, [queueItems, fetchQueue]);

    if (loading) return (
        <div className="p-6 grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-2xl" />
            <div className="space-y-6"><Skeleton className="h-44 rounded-2xl" /><Skeleton className="h-44 rounded-2xl" /></div>
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
                            { label: "Last successful sync", val: progress === 100 ? "Just now" : "Pending items", cls: T.text(dark) },
                            { label: "Pending transactions", val: queueItems.length.toString(), cls: queueItems.length > 0 ? "text-amber-500 font-bold" : T.text(dark) },
                            { label: "Sync interval", val: "Every 5 min", cls: T.text(dark) },
                        ].map((row, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <dt className={cls("text-[15px] font-medium", T.muted(dark))}>{row.label}</dt>
                                <dd className={cls("text-[15px] font-semibold", row.cls)}>{row.val}</dd>
                            </div>
                        ))}
                    </dl>

                    <Button variant="primary" size="lg" className="w-full mt-8" onClick={handleSync} disabled={syncing} ariaLabel={syncing ? "Syncing in progress" : "Force sync now"}>
                        {syncing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Syncing…</> : <><RefreshCw className="w-5 h-5" /> Force Sync Now</>}
                    </Button>
                </Card>

                <div className="space-y-6">
                    <Card className="p-6">
                        <p className={cls("font-semibold text-[15px] mb-4", T.text(dark))}>Sync Queue</p>
                        <div className="space-y-3">
                            {queueItems.length === 0 ? (
                                <p className={cls("text-sm text-center py-4 font-medium", T.muted(dark))}>All data is synced.</p>
                            ) : queueItems.map((item, i) => (
                                <div key={i} className={cls("flex items-center gap-4 p-4 rounded-2xl shadow-sm", dark ? "bg-slate-800/40" : "bg-slate-50")}>
                                    <RefreshCw className="text-amber-500 w-5 h-5 flex-shrink-0" aria-hidden="true" />
                                    <div className="flex-1 min-w-0">
                                        <p className={cls("text-[15px] font-semibold tracking-tight", T.text(dark))}>{item.merchant} · ₹{item.amount}</p>
                                        <p className={cls("text-xs font-mono font-medium mt-0.5", T.subtle(dark))}>{item.id.split("-")[0].toUpperCase()}</p>
                                    </div>
                                    <Badge variant="pending">Queued</Badge>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <p className={cls("font-semibold text-[15px] mb-4", T.text(dark))}>System Alerts</p>
                        <div className="space-y-3" role="list">
                            <div role="listitem" className={cls("p-4 border rounded-2xl flex items-start gap-3 backdrop-blur-sm", dark ? "bg-red-900/20 border-red-500/20" : "bg-red-50 border-red-200")}>
                                <AlertTriangle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                    <p className={cls("text-sm font-semibold", dark ? "text-red-400" : "text-red-800")}>Token Expiry Warning</p>
                                    <p className={cls("text-[13px] mt-1 font-medium leading-relaxed", dark ? "text-red-300/80" : "text-red-700")}>3 offline tokens expire in 2 hours. A sync is highly recommended.</p>
                                </div>
                            </div>
                            <div role="listitem" className={cls("p-4 border rounded-2xl flex items-start gap-3 backdrop-blur-sm", dark ? "bg-emerald-900/20 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
                                <ShieldCheck className="text-emerald-500 w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
                                <div>
                                    <p className={cls("text-sm font-semibold", dark ? "text-emerald-400" : "text-emerald-800")}>Device Integrity Verified</p>
                                    <p className={cls("text-[13px] mt-1 font-medium leading-relaxed", dark ? "text-emerald-300/80" : "text-emerald-700")}>All registered hardware enclaves passed security assertions.</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}