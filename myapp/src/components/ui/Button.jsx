import { cls } from "../../utils/cls";

import { useTheme } from "../../context/ThemeContext";
import { T } from "../../theme/themeTokens";

const BTN_VARIANTS = {
    primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200/60 focus-visible:ring-indigo-500 active:scale-95 active:shadow-inner",
    secondary: "bg-white/80 backdrop-blur-md hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm focus-visible:ring-slate-300 active:scale-95 active:shadow-inner",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 focus-visible:ring-slate-200 active:scale-95 active:bg-slate-200/50",
    destructive: "bg-red-500 hover:bg-red-600 text-white shadow-sm focus-visible:ring-red-400 active:scale-95 active:shadow-inner",
    emerald: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200/60 focus-visible:ring-emerald-400 active:scale-95 active:shadow-inner",
    darkGhost: "bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 focus-visible:ring-slate-500 active:scale-95 active:bg-slate-600/50",
};

const BTN_SIZES = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
};

function Button({
    variant = "primary",
    children,
    onClick,
    className = "",
    size = "md",
    disabled = false,
    ariaLabel,
    type = "button"
}) {
    return (
        <button
            type={type}
            disabled={disabled}
            onClick={onClick}
            aria-label={ariaLabel}
            className={cls(
                "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 ease-out will-change-transform",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                BTN_SIZES[size],
                BTN_VARIANTS[variant] ?? BTN_VARIANTS.primary,
                className
            )}
        >
            {children}
        </button>
    );
}

export default Button;