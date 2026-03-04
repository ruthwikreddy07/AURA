import { cls } from "../../utils/cls";
import { useTheme } from "../../context/ThemeContext";
import { ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export default function RiskCard({ score, level }) {
  const { dark } = useTheme();

  const levelConfig = {
    "Safe": {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-500" />,
      color: "emerald",
      text: "Low Risk",
      bg: dark ? "bg-emerald-900/30 border-emerald-500/20" : "bg-emerald-50 border-emerald-200",
      textColor: dark ? "text-emerald-300" : "text-emerald-800",
    },
    "Verify": {
      icon: <ShieldAlert className="w-6 h-6 text-amber-500" />,
      color: "amber",
      text: "Medium Risk",
      bg: dark ? "bg-amber-900/30 border-amber-500/20" : "bg-amber-50 border-amber-200",
      textColor: dark ? "text-amber-300" : "text-amber-800",
    },
    "High Risk": {
      icon: <ShieldX className="w-6 h-6 text-red-500" />,
      color: "red",
      text: "High Risk",
      bg: dark ? "bg-red-900/30 border-red-500/20" : "bg-red-50 border-red-200",
      textColor: dark ? "text-red-300" : "text-red-800",
    },
  };

  const config = levelConfig[level] || levelConfig["Safe"];
  const circumference = 2 * Math.PI * 28;
  const offset = circumference * (1 - score / 100);

  const barColor = {
    emerald: "stroke-emerald-500",
    amber: "stroke-amber-500",
    red: "stroke-red-500",
  };

  return (
    <div className={cls("p-5 rounded-2xl border", config.bg)}>
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke={dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} strokeWidth="6" />
            <circle cx="32" cy="32" r="28" fill="none" className={cls(barColor[config.color])} strokeWidth="6" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.5s ease-out" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {config.icon}
          </div>
        </div>
        <div>
          <p className={cls("text-sm font-bold uppercase tracking-wider", config.textColor)}>{config.text}</p>
          <p className={cls("text-2xl font-black", dark ? "text-slate-100" : "text-slate-900")}>{score}</p>
          <p className={cls("text-xs font-medium", dark ? "text-slate-400" : "text-slate-500")}>AURA Score</p>
        </div>
      </div>
    </div>
  );
}