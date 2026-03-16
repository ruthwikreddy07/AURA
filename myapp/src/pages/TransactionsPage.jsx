import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import usePageLoad from "../hooks/usePageLoad";
import { ArrowRightLeft, Search, ArrowDown } from "lucide-react";
import { useState, useEffect } from "react";
import { normalizeVariant } from "../utils/normalizeVariant";
import { Skeleton } from "../components/ui/Skeleton";
import { getUserTransactions } from "../api/api";


// ─────────────────────────────────────────────────────────────
// PAGE: TRANSACTIONS
// ─────────────────────────────────────────────────────────────


export default function TransactionsPage() {
    const { dark } = useTheme();
    const loading = usePageLoad();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("All");
    const [TX_DATA, setTX_DATA] = useState([]);

    useEffect(() => {
        const userId = localStorage.getItem("user_id");

        if (!userId) return;

        getUserTransactions(userId)
            .then(data => setTX_DATA(data))
            .catch(err => console.error(err));
    }, []);

    const filtered = TX_DATA.filter(tx =>
        (filter === "All" || tx.status === filter.toLowerCase()) &&
        (
            (tx.id && tx.id.toLowerCase().includes(search.toLowerCase())) ||
            (tx.mode && tx.mode.toLowerCase().includes(search.toLowerCase()))
        )
    );

    if (loading) return (
        <div className="p-6 space-y-5">
            <div className="flex gap-2">{[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-9 w-24 rounded-xl" />)}</div>
            <Skeleton className="h-96 rounded-2xl" />
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex gap-2 flex-wrap" role="group" aria-label="Filter transactions">
                    {["All", "Success", "Pending", "Failed"].map(f => (
                        <button
                            key={f} onClick={() => setFilter(f)} aria-pressed={filter === f}
                            className={cls(
                                "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95",
                                filter === f ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50" : cls("border backdrop-blur-md", dark ? "bg-slate-800/60 border-white/10 text-slate-300 hover:bg-slate-700/60" : "bg-white/70 border-white/40 text-slate-600 hover:bg-white")
                            )}
                        >{f}</button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search..." aria-label="Search transactions"
                            className={cls("border rounded-xl pl-10 pr-4 py-2 text-sm w-48 sm:w-64 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:border-transparent transition-all backdrop-blur-md", T.inputBg(dark))}
                        />
                    </div>
                    <Button variant="secondary" size="md" ariaLabel="Export transactions"><ArrowDown className="w-4 h-4" /> Export</Button>
                </div>
            </div>

            <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full" role="table" aria-label="Transactions table">
                        <thead>
                            <tr className={cls("border-b", T.divider(dark), dark ? "bg-slate-900/40" : "bg-slate-50/50")}>
                                {["Transaction ID", "Merchant", "Type", "Amount", "Mode", "Status", "Date"].map(h => (
                                    <th key={h} scope="col" className={cls("px-5 py-4 text-left text-[11px] font-bold uppercase tracking-wider whitespace-nowrap", T.muted(dark))}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((tx) => (
                                <tr key={tx.id} className={cls("border-b transition-colors cursor-pointer", dark ? "border-white/5 hover:bg-slate-800/40" : "border-black/5 hover:bg-slate-50")}>
                                    <td className="px-5 py-4"><span className="text-[13px] font-mono text-indigo-500 font-bold">{tx.id}</span></td>
                                    <td className="px-5 py-4"><span className={cls("text-[15px] font-semibold tracking-tight", T.text(dark))}>{tx.receiver_name || tx.receiver_id}</span></td>
                                    <td className="px-5 py-4">
                                        <span className={cls("text-[13px] font-medium", T.muted(dark))}>
                                            Token Transfer
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className={cls("text-[15px] font-bold tracking-tight", T.text(dark))}>
                                            ₹{tx.amount}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4"><Badge variant="default">{tx.mode}</Badge></td>
                                    <td className="px-5 py-4"><Badge variant={tx.status}>{tx.status.charAt(0).toUpperCase() + tx.status.slice(1).toLowerCase()}</Badge></td>
                                    <td className="px-5 py-4"><span className={cls("text-[13px] font-medium", T.subtle(dark))}>{new Date(tx.created_at).toLocaleString()}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && (
                    <div className="py-20 text-center" role="status">
                        <p className={cls("text-[15px] font-medium", T.muted(dark))}>No transactions found.</p>
                    </div>
                )}
                <div className={cls("px-5 py-4 border-t flex items-center justify-between", T.divider(dark), dark ? "bg-slate-900/40" : "bg-slate-50/50")}>
                    <p className={cls("text-sm font-medium", T.subtle(dark))}>{filtered.length} transactions</p>
                    <div className="flex gap-2" role="navigation" aria-label="Pagination">
                        {[1, 2, 3].map(p => (
                            <button key={p} aria-label={`Page ${p}`} aria-current={p === 1 ? "page" : undefined}
                                className={cls("w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                                    p === 1 ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/50" : cls(dark ? "text-slate-300 hover:bg-slate-700/60 bg-slate-800/40" : "text-slate-600 hover:bg-white bg-slate-100/50"))}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    );
}