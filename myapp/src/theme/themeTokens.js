const tv = (dark, light, darkVal) => (dark ? darkVal : light);

export const T = {
    nav: d => tv(d, "bg-white/70 backdrop-blur-xl border-white/40", "bg-slate-900/60 backdrop-blur-xl border-white/10"),
    text: d => tv(d, "text-slate-900", "text-slate-100"),
    muted: d => tv(d, "text-slate-500", "text-slate-400"),
    subtle: d => tv(d, "text-slate-400", "text-slate-500"),
    divider: d => tv(d, "bg-slate-200/60", "bg-slate-700/50"),
    inputBg: d => tv(
        d,
        "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400",
        "bg-slate-800/60 border-slate-700 text-slate-100 placeholder-slate-500"
    ),
    softBg: d => tv(d, "bg-slate-50/80", "bg-slate-800/40"),
    navActive: d => tv(d, "bg-indigo-50 text-indigo-700", "bg-indigo-500/15 text-indigo-300"),
    navHover: d => tv(
        d,
        "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
        "text-slate-400 hover:bg-slate-700/50 hover:text-slate-100"
    ),
    kpiBg: {
        indigo: d => tv(d, "bg-indigo-50 text-indigo-600", "bg-indigo-500/15 text-indigo-300"),
        emerald: d => tv(d, "bg-emerald-50 text-emerald-600", "bg-emerald-500/15 text-emerald-300"),
        amber: d => tv(d, "bg-amber-50 text-amber-600", "bg-amber-500/15 text-amber-300"),
        slate: d => tv(d, "bg-slate-100 text-slate-600", "bg-slate-700/50 text-slate-300"),
    },
    glow: d => tv(
        d,
        "ring-1 ring-indigo-100 shadow-indigo-50/80 shadow-md",
        "ring-1 ring-indigo-500/20 shadow-indigo-900/40 shadow-lg"
    ),
};