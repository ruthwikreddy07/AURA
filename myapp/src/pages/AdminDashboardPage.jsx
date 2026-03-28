import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, Users, Activity, ChevronRight, CheckCircle2, XCircle, LogOut } from "lucide-react";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

function adminFetch(endpoint) {
  const token = localStorage.getItem("admin_token");
  return fetch(`${API_BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  }).then((r) => { if (!r.ok) throw new Error("Unauthorized"); return r.json(); });
}
function adminPost(endpoint, body) {
  const token = localStorage.getItem("admin_token");
  return fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }).then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); });
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [riskLogs, setRiskLogs] = useState([]);
  const [tab, setTab] = useState("overview");
  const adminName = localStorage.getItem("admin_name") || "Admin";

  // Enforce 15-minute inactivity timeout for admin sessions
  useSessionTimeout(15, "/admin", () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_name");
  });

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) { navigate("/admin"); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, u, r] = await Promise.all([
        adminFetch("/admin/system-stats"),
        adminFetch("/admin/users"),
        adminFetch("/admin/risk-logs"),
      ]);
      setStats(s);
      setUsers(u);
      setRiskLogs(r);
    } catch {
      localStorage.removeItem("admin_token");
      navigate("/admin");
    }
  };

  const handleKyc = async (userId, newStatus) => {
    await adminPost("/admin/kyc-action", { user_id: userId, new_status: newStatus });
    loadData();
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_id");
    localStorage.removeItem("admin_name");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[#0a0118] text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#0a0118]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">AURA Command Center</h1>
              <p className="text-xs text-slate-500 font-medium">Logged in as {adminName}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Nav */}
        <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-8 w-fit">
          {[
            { id: "overview", icon: <Activity className="w-4 h-4" />, label: "System Overview" },
            { id: "users", icon: <Users className="w-4 h-4" />, label: "User Management" },
            { id: "risk", icon: <ShieldAlert className="w-4 h-4" />, label: "Risk Engine" },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl flex items-center gap-2 transition-all ${tab === t.id ? "bg-red-600 text-white shadow-lg" : "text-slate-400 hover:text-white"}`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Total Users", value: stats.total_users, color: "text-indigo-400" },
                { label: "KYC Verified", value: stats.verified_users, color: "text-emerald-400" },
                { label: "Flagged Events", value: stats.flagged_events, color: "text-red-400" },
                { label: "Online Liquidity", value: `₹${Number(stats.total_wallet_balance).toLocaleString()}`, color: "text-blue-400" },
                { label: "Offline Token Value", value: `₹${Number(stats.total_token_value).toLocaleString()}`, color: "text-amber-400" },
                { label: "Active Tokens", value: stats.active_tokens, color: "text-purple-400" },
              ].map((s, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{s.label}</p>
                  <p className={`text-[28px] font-black tracking-tight ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email / Phone</th>
                    <th className="px-6 py-4">KYC Status</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-semibold">{u.full_name}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{u.email || u.phone_number || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${u.kyc_status === "verified" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"}`}>
                          {u.kyc_status === "verified" ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.kyc_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{u.is_admin ? <span className="text-red-400 font-bold">ADMIN</span> : "User"}</td>
                      <td className="px-6 py-4">
                        {!u.is_admin && u.kyc_status === "pending" && (
                          <button onClick={() => handleKyc(u.id, "verified")}
                            className="text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Approve KYC
                          </button>
                        )}
                        {!u.is_admin && u.kyc_status === "verified" && (
                          <button onClick={() => handleKyc(u.id, "pending")}
                            className="text-xs font-bold bg-amber-600/80 hover:bg-amber-500 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Revoke KYC
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RISK ENGINE TAB */}
        {tab === "risk" && (
          <div className="space-y-4">
            {riskLogs.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-sm">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">No risk events logged yet. The ML engine will populate this after offline tokens are synced.</p>
              </div>
            ) : (
              riskLogs.map((log) => {
                const isHigh = log.risk_score > 0.8;
                const pct = Math.round(log.risk_score * 100);
                return (
                  <div key={log.id} className={`flex flex-col sm:flex-row gap-4 sm:items-center p-5 rounded-2xl border backdrop-blur-sm ${isHigh ? "bg-red-500/5 border-red-500/20" : "bg-white/5 border-white/10"}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold ${isHigh ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"}`}>
                          {log.decision.toUpperCase().replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm font-semibold mt-1">User: {log.user_name} <span className="text-slate-500">({log.user_id.split("-")[0]})</span></p>
                    </div>
                    <div className="sm:w-56 flex-shrink-0">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-semibold text-slate-500">ML Score</span>
                        <span className={`text-sm font-black ${isHigh ? "text-red-400" : "text-emerald-400"}`}>{pct}%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${isHigh ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
