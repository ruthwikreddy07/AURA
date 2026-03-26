import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import Card from "../components/ui/Card";
import Toggle from "../components/ui/Toggle";
import usePageLoad from "../hooks/usePageLoad";
import { useState } from "react";
import { Skeleton } from "../components/ui/Skeleton";
import { Bluetooth, Volume2, Sun, QrCode, Wifi, Zap, Activity, Battery, Mic, Eye, Signal, Gauge, BarChart3 } from "lucide-react";
import ModeBadge from "../components/ui/ModeBadge";
import Badge from "../components/ui/Badge";
import { getModePreferences, setModePreferences } from "../api/api";

function EnvironmentMetricRow({ icon, label, value, unit, pct, color, dark }) {
  const barColorMap = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
  };

  return (
    <div className="flex items-center gap-4">
      <div className={cls("flex items-center gap-3 w-36 flex-shrink-0", dark ? "text-slate-300" : "text-slate-600")}>
        {icon}
        <span className="text-[13px] font-semibold">{label}</span>
      </div>
      <div className="flex-1">
        <div className={cls("h-2 rounded-full", dark ? "bg-slate-700/60" : "bg-slate-200")}>
          <div className={cls("h-2 rounded-full", barColorMap[color])} style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className={cls("w-20 text-right font-bold text-sm tabular-nums", dark ? "text-slate-200" : "text-slate-700")}>{value}{unit}</div>
    </div>
  );
}

export default function ModeControlPage() {

  const { dark } = useTheme();
  const loading = usePageLoad();
  const [modes, setModes] = useState({ BLE: true, Sound: false, Light: false, QR: true, NFC: true });
  const [autoSelect, setAutoSelect] = useState(true);

  // Modes not available on web
  const WEB_UNAVAILABLE = ["BLE", "NFC", "Sound", "Light"];
  const isWebUnavailable = (mode) => WEB_UNAVAILABLE.includes(mode);

  const toggleMode = key => {
    if (isWebUnavailable(key)) return; // Can't toggle mobile-only modes on web
    setModes(p => ({ ...p, [key]: !p[key] }));
  };

  if (loading) return <div className="p-6 space-y-5"><div className="grid lg:grid-cols-3 gap-5">{[0, 1, 2].map(i => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div><Skeleton className="h-80 rounded-2xl" /></div>;

  const modeConfigs = [
    { key: "BLE", icon: <Bluetooth className="w-5 h-5" />, title: "Bluetooth Low Energy", desc: "30m range · 2.4GHz · Encrypted", score: 94, color: "blue", scoreColor: "text-blue-500" },
    { key: "Sound", icon: <Volume2 className="w-5 h-5" />, title: "Ultrasonic Sound", desc: "< 1m range · 18–22kHz inaudible", score: 61, color: "violet", scoreColor: "text-violet-500" },
    { key: "Light", icon: <Sun className="w-5 h-5" />, title: "Light Pulse Mode", desc: "< 0.5m · Line-of-sight required", score: 42, color: "amber", scoreColor: "text-amber-500" },
    { key: "QR", icon: <QrCode className="w-5 h-5" />, title: "QR Code Interface", desc: "Camera-based · Universal compat.", score: 76, color: "emerald", scoreColor: "text-emerald-500" },
    { key: "NFC", icon: <Wifi className="w-5 h-5" />, title: "NFC / HCE Tap", desc: "< 5cm · ISO 14443 · Instant", score: 88, color: "indigo", scoreColor: "text-indigo-500" },
  ];
  const barColorMap = { blue: "bg-blue-500", violet: "bg-violet-500", amber: "bg-amber-400", emerald: "bg-emerald-500", indigo: "bg-indigo-500" };
  const iconBgMap = { blue: dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600", violet: dark ? "bg-violet-500/15 text-violet-400" : "bg-violet-50 text-violet-600", amber: dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600", emerald: dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600", indigo: dark ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-50 text-indigo-600" };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header row */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className={cls("font-black text-[22px] tracking-tight", dark ? "text-slate-100" : "text-slate-900")}>AURA Mode Control</p>
          <p className={cls("text-[15px] font-medium mt-1", dark ? "text-slate-400" : "text-slate-500")}>Manage adaptive communication protocol channels</p>
        </div>
        <Card className="px-5 py-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-500" />
            <span className={cls("text-[14px] font-bold", dark ? "text-slate-200" : "text-slate-700")}>Auto-Selection Engine</span>
          </div>
          <Toggle enabled={autoSelect} onChange={setAutoSelect} label="" id="auto-select-tog" />
        </Card>
      </div>

      {/* Mode Cards grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {modeConfigs.map(mc => (
          <Card key={mc.key} className={cls("p-5 transition-all duration-200", (!modes[mc.key] || isWebUnavailable(mc.key)) && "opacity-50")}>
            <div className="flex items-start justify-between mb-4">
              <div className={cls("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner", iconBgMap[mc.color])}>
                {mc.icon}
              </div>
              <div className="flex items-center gap-2">
                {isWebUnavailable(mc.key) && (
                  <Badge variant="warning" size="sm">Mobile Only</Badge>
                )}
                <button
                  role="switch" aria-checked={modes[mc.key]} onClick={() => toggleMode(mc.key)}
                  aria-label={`${modes[mc.key] ? "Disable" : "Enable"} ${mc.title}`}
                  disabled={isWebUnavailable(mc.key)}
                  className={cls("w-10 h-5.5 h-[22px] rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                    isWebUnavailable(mc.key) ? (dark ? "bg-slate-800 cursor-not-allowed" : "bg-slate-200 cursor-not-allowed") :
                    modes[mc.key] ? "bg-indigo-600" : (dark ? "bg-slate-700" : "bg-slate-200"))}
                >
                  <span className={cls("block w-[18px] h-[18px] bg-white rounded-full shadow transition-transform duration-200 mx-[1px]", modes[mc.key] && !isWebUnavailable(mc.key) ? "translate-x-[20px]" : "translate-x-0")} />
                </button>
              </div>
            </div>
            <p className={cls("font-bold text-[14px] leading-tight", dark ? "text-slate-100" : "text-slate-900")}>{mc.title}</p>
            <p className={cls("text-[11px] font-medium mt-1 leading-snug", dark ? "text-slate-500" : "text-slate-400")}>{mc.desc}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className={cls("text-[11px] font-bold uppercase tracking-widest", dark ? "text-slate-500" : "text-slate-400")}>Score</span>
                <span className={cls("text-[15px] font-black", mc.scoreColor)}>{mc.score}</span>
              </div>
              <div className={cls("h-1.5 rounded-full", dark ? "bg-slate-700/60" : "bg-slate-200")}>
                <div className={cls("h-1.5 rounded-full transition-all duration-700", barColorMap[mc.color])} style={{ width: `${mc.score}%` }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Environment Metrics + Mode Score Dashboard */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            <p className={cls("font-semibold text-[15px]", dark ? "text-slate-100" : "text-slate-900")}>Environment Metrics</p>
            <span className={cls("ml-auto text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg", dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600")}>Mobile App</span>
          </div>
          <div className={cls("p-4 rounded-xl border mb-5", dark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50/50 border-amber-200")}>
            <p className={cls("text-[13px] font-medium", dark ? "text-amber-400" : "text-amber-700")}>📱 Environment sensors (battery, noise, BLE signal, distance) require native device APIs and are only available on the mobile app.</p>
          </div>
          <div className="space-y-5 opacity-40">
            <EnvironmentMetricRow icon={<Battery className="w-4 h-4" />} label="Battery Level" value="—" unit="" pct={0} color="emerald" dark={dark} />
            <EnvironmentMetricRow icon={<Mic className="w-4 h-4" />} label="Ambient Noise" value="—" unit="" pct={0} color="blue" dark={dark} />
            <EnvironmentMetricRow icon={<Eye className="w-4 h-4" />} label="Light Level" value="—" unit="" pct={0} color="amber" dark={dark} />
            <EnvironmentMetricRow icon={<Signal className="w-4 h-4" />} label="BLE Signal" value="—" unit="" pct={0} color="indigo" dark={dark} />
            <EnvironmentMetricRow icon={<Gauge className="w-4 h-4" />} label="Distance Estimate" value="—" unit="" pct={0} color="violet" dark={dark} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-indigo-500" aria-hidden="true" />
            <p className={cls("font-semibold text-[15px]", dark ? "text-slate-100" : "text-slate-900")}>Mode Scoring Dashboard</p>
          </div>
          <div className="space-y-4">
            {modeConfigs.sort((a, b) => b.score - a.score).map((mc, i) => (
              <div key={mc.key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cls("text-[11px] font-black w-4 text-center", dark ? "text-slate-500" : "text-slate-400")}>#{i + 1}</span>
                    <ModeBadge mode={mc.key} active={modes[mc.key]} size="sm" />
                    {!modes[mc.key] && <span className={cls("text-[10px] font-bold", dark ? "text-slate-600" : "text-slate-400")}>DISABLED</span>}
                  </div>
                  <span className={cls("text-[15px] font-black tabular-nums", mc.scoreColor)}>{mc.score}</span>
                </div>
                <div className={cls("h-2.5 rounded-full", dark ? "bg-slate-700/50" : "bg-slate-100")}>
                  <div className={cls("h-2.5 rounded-full transition-all duration-700 ease-out", !modes[mc.key] ? (dark ? "bg-slate-600" : "bg-slate-300") : barColorMap[mc.color])} style={{ width: `${mc.score}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className={cls("mt-6 p-4 rounded-xl border", dark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-200")}>
            <p className={cls("text-[13px] font-bold flex items-center gap-2", dark ? "text-indigo-300" : "text-indigo-700")}>
              <Zap className="w-4 h-4" /> Auto-Selection Recommendation
            </p>
            <p className={cls("text-[13px] font-medium mt-1", dark ? "text-indigo-400/80" : "text-indigo-600")}>
              BLE selected · Score 94 · Optimal for current environment (24cm, 84% battery, low noise)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}