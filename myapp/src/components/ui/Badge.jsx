import { cls } from "../../utils/cls";
import { normalizeVariant } from "../../utils/normalizeVariant";
const BADGE_STYLES = {
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    failed: "bg-red-50 text-red-600 border border-red-200",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    default: "bg-slate-100 text-slate-600 border border-slate-200",
};

const BADGE_DOT = {
    success: "bg-emerald-500 animate-pulse",
    pending: "bg-amber-400",
    failed: "bg-red-500",
};

export default function Badge({ variant = "default", children }) {
    const v = normalizeVariant(variant);
    const style = BADGE_STYLES[v] ?? BADGE_STYLES.default;

    return (
        <span
            className={cls(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                style
            )}
        >
            {BADGE_DOT[v] && (
                <span
                    className={cls("w-1.5 h-1.5 rounded-full flex-shrink-0", BADGE_DOT[v])}
                    aria-hidden="true"
                />
            )}
            {children}
        </span>
    );
}