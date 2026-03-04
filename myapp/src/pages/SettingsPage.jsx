import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import Card from "../components/ui/Card";
import Toggle from "../components/ui/Toggle";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Skeleton } from "../components/ui/Skeleton";
import Badge from "../components/ui/Badge";

import { Settings, ShieldCheck, Fingerprint, Clock, PlusCircle, Smartphone } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import { useState } from "react";
export default function SettingsPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [toggles, setToggles] = useState({ biometric: true, autoSync: true, offlineMode: true, notifications: false, twoFA: true });
  const toggle = key => setToggles(p => ({ ...p, [key]: !p[key] }));

  if (loading) return (
    <div className="p-6 space-y-6 max-w-2xl">
      {[0, 1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}
    </div>
  );

  // Entropy ring values
  const entropyPct = 87;
  const entCircumference = 2 * Math.PI * 36;

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto md:mx-0">

      {/* ── EXISTING: Profile ── */}
      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-5", dark ? "text-slate-100" : "text-slate-900")}>Profile</p>
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-inner" aria-label="Profile avatar">
            <span className="text-white text-2xl font-bold" aria-hidden="true">AK</span>
          </div>
          <div>
            <p className={cls("text-[17px] font-bold tracking-tight", dark ? "text-slate-100" : "text-slate-900")}>Arjun Kumar</p>
            <p className={cls("text-[15px] font-medium mt-0.5", dark ? "text-slate-400" : "text-slate-500")}>arjun@offpay.in · Pro Plan</p>
          </div>
          <Button variant="secondary" size="md" className="ml-auto">Edit</Button>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <Input label="Full Name" placeholder="Arjun Kumar" name="full-name" />
          <Input label="Email" placeholder="arjun@offpay.in" name="email" type="email" />
        </div>
      </Card>

      {/* ── EXISTING: Security Controls ── */}
      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-5", dark ? "text-slate-100" : "text-slate-900")}>Security Controls</p>
        <div className="space-y-5">
          <Toggle enabled={toggles.biometric} onChange={() => toggle("biometric")} label="Biometric Authentication" id="tog-bio" />
          <div className={cls("h-px", dark ? "bg-slate-700/50" : "bg-slate-200/60")} />
          <Toggle enabled={toggles.twoFA} onChange={() => toggle("twoFA")} label="Two-Factor Authentication (TOTP)" id="tog-2fa" />
          <div className={cls("h-px", dark ? "bg-slate-700/50" : "bg-slate-200/60")} />
          <Toggle enabled={toggles.notifications} onChange={() => toggle("notifications")} label="Security Alerts via Email" id="tog-notif" />
        </div>
        <Button variant="destructive" size="md" className="mt-6">Change Password</Button>
      </Card>

      {/* ── NEW: AURA Security Intelligence ── */}
      <Card className="p-6" glow>
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-5 h-5 text-indigo-500" aria-hidden="true" />
          <p className={cls("font-semibold text-[15px]", dark ? "text-slate-100" : "text-slate-900")}>AURA Security Intelligence</p>
          <Badge variant="indigo" className="ml-auto">Protocol v2.4</Badge>
        </div>

        {/* Entropy ring + fingerprint + timestamp in a row */}
        <div className="grid sm:grid-cols-3 gap-5 mb-6">

          {/* Entropy strength indicator */}
          <div className={cls("p-5 rounded-2xl border text-center", dark ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-200")}>
            <div className="flex items-center justify-center mb-3" role="meter" aria-valuenow={entropyPct} aria-valuemin={0} aria-valuemax={100} aria-label={`Entropy strength: ${entropyPct}%`}>
              <div className="relative w-20 h-20">
                <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                  <circle cx="40" cy="40" r="36" fill="none" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="5" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke="#4F46E5" strokeWidth="5"
                    strokeDasharray={entCircumference}
                    strokeDashoffset={entCircumference * (1 - entropyPct / 100)}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={cls("text-[17px] font-black tabular-nums", dark ? "text-slate-100" : "text-slate-900")}>{entropyPct}%</p>
                </div>
              </div>
            </div>
            <p className={cls("text-[12px] font-bold uppercase tracking-widest", dark ? "text-slate-400" : "text-slate-500")}>Entropy Strength</p>
            <p className="text-emerald-500 text-[12px] font-bold mt-1">Excellent</p>
          </div>

          {/* Device fingerprint */}
          <div className={cls("p-5 rounded-2xl border", dark ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-200")}>
            <div className={cls("w-9 h-9 rounded-xl flex items-center justify-center mb-3", dark ? "bg-indigo-500/20" : "bg-indigo-50")}>
              <Fingerprint className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            </div>
            <p className={cls("text-[11px] font-bold uppercase tracking-widest mb-1", dark ? "text-slate-500" : "text-slate-400")}>Device Fingerprint</p>
            <p className={cls("text-[12px] font-mono font-bold tracking-tight break-all", dark ? "text-slate-300" : "text-slate-700")}>a3f9·c721·8e04·b156</p>
            <p className={cls("text-[11px] font-medium mt-2", dark ? "text-emerald-400" : "text-emerald-600")}>✓ Integrity verified</p>
          </div>

          {/* Last handshake + anti-tamper */}
          <div className={cls("p-5 rounded-2xl border", dark ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-200")}>
            <div className={cls("w-9 h-9 rounded-xl flex items-center justify-center mb-3", dark ? "bg-emerald-500/20" : "bg-emerald-50")}>
              <Clock className="w-5 h-5 text-emerald-500" aria-hidden="true" />
            </div>
            <p className={cls("text-[11px] font-bold uppercase tracking-widest mb-1", dark ? "text-slate-500" : "text-slate-400")}>Last Handshake</p>
            <p className={cls("text-[14px] font-bold tracking-tight", dark ? "text-slate-200" : "text-slate-800")}>4 min ago</p>
            <p className={cls("text-[11px] font-medium mt-1", dark ? "text-slate-400" : "text-slate-500")}>Samsung S24 · BLE</p>
            <div className="mt-3">
              <Badge variant="success">Anti-tamper: Active</Badge>
            </div>
          </div>
        </div>

        {/* Anti-tamper status detail */}
        <div className={cls("p-4 rounded-xl border flex items-start gap-3", dark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
          <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className={cls("text-sm font-bold", dark ? "text-emerald-300" : "text-emerald-800")}>Hardware Enclave Sealed · No tamper events detected</p>
            <p className={cls("text-[13px] font-medium mt-0.5", dark ? "text-emerald-400/80" : "text-emerald-700")}>TEE attestation valid · Secure boot verified · Last audit: Today 09:14 AM</p>
          </div>
        </div>
      </Card>

      {/* ── EXISTING: Registered Devices ── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <p className={cls("font-semibold text-[15px]", dark ? "text-slate-100" : "text-slate-900")}>Registered Devices</p>
          <Button variant="secondary" size="sm"><PlusCircle className="w-4 h-4" /> Add Device</Button>
        </div>
        <div className="space-y-3" role="list">
          {[
            { name: "Samsung Galaxy S24", id: "DEV-001", badge: "success", time: "Active now" },
            { name: "iPhone 15 Pro", id: "DEV-002", badge: "success", time: "2h ago" },
            { name: "OnePlus 12", id: "DEV-003", badge: "default", time: "3 days ago" },
          ].map((d, i) => (
            <div key={i} role="listitem" className={cls("flex items-center justify-between p-4 rounded-2xl shadow-sm", dark ? "bg-slate-800/40" : "bg-slate-50")}>
              <div className="flex items-center gap-4">
                <Smartphone className="text-indigo-500 w-6 h-6" aria-hidden="true" />
                <div>
                  <p className={cls("text-[15px] font-semibold tracking-tight", dark ? "text-slate-100" : "text-slate-900")}>{d.name}</p>
                  <p className={cls("text-[13px] font-medium mt-0.5", dark ? "text-slate-500" : "text-slate-400")}>{d.id} · {d.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={d.badge}>{d.badge === "success" ? "Active" : "Inactive"}</Badge>
                <Button variant="ghost" size="sm" ariaLabel={`Remove ${d.name}`}>Remove</Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── EXISTING: Token Preferences ── */}
      <Card className="p-6">
        <p className={cls("font-semibold text-[15px] mb-5", dark ? "text-slate-100" : "text-slate-900")}>Token Preferences</p>
        <div className="space-y-5">
          <Toggle enabled={toggles.autoSync} onChange={() => toggle("autoSync")} label="Auto-sync when online" id="tog-sync" />
          <div className={cls("h-px", dark ? "bg-slate-700/50" : "bg-slate-200/60")} />
          <Toggle enabled={toggles.offlineMode} onChange={() => toggle("offlineMode")} label="Enable Offline Mode" id="tog-offline" />
          <div className={cls("h-px", dark ? "bg-slate-700/50" : "bg-slate-200/60")} />
          <div className="flex items-center justify-between">
            <span className={cls("text-[15px] font-medium select-none", dark ? "text-slate-200" : "text-slate-800")}>Max Token Limit</span>
            <div className="flex items-center gap-3">
              <span className="text-[17px] font-bold tracking-tight text-indigo-500">₹50,000</span>
              <Button variant="secondary" size="sm">Edit</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}