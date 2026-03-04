import { cls } from "../../utils/cls";
import { useTheme } from "../../context/ThemeContext";
import { T } from "../../theme/themeTokens";


export default function Card({ children, className = "", glow = false }) {
    const { dark } = useTheme();

    return (
        <div
            className={cls(
                "border rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.06)]",
                "hover:-translate-y-[2px] hover:shadow-lg transition-all duration-200",
                dark
                    ? "backdrop-blur-xl bg-slate-900/60 border-white/10"
                    : "backdrop-blur-xl bg-white/70 border-white/40",
                glow && T.glow(dark),
                className
            )}
        >
            {children}
        </div>
    );
}