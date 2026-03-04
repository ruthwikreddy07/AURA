import { cls } from "../../utils/cls";
import { useTheme } from "../../context/ThemeContext";
import { T } from "../../theme/themeTokens";

const shimmerStyle = {
    background: "linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 50%, transparent 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.6s infinite",
};

export function Skeleton({ className = "" }) {
    const { dark } = useTheme();
    return (
        <div
            className={cls(
                "rounded-xl",
                dark ? "bg-slate-700/40" : "bg-slate-200/70",
                className
            )}
            style={shimmerStyle}
            role="status"
            aria-busy="true"
            aria-label="Loading..."
        />
    );
}

export function KPICardSkeleton() {
    const { dark } = useTheme();
    return (
        <div
            className={cls(
                "rounded-2xl border p-5 space-y-3 backdrop-blur-xl",
                dark
                    ? "bg-slate-900/60 border-white/10"
                    : "bg-white/70 border-white/40"
            )}
        >
            <div className="flex justify-between items-start">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-12 h-4 rounded-full" />
            </div>
            <Skeleton className="w-28 h-8 mt-1 rounded-lg" />
            <Skeleton className="w-36 h-3 rounded-full" />
        </div>
    );
}