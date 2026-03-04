import { cls } from "../../utils/cls";
import { useTheme } from "../../context/ThemeContext";
import { T } from "../../theme/themeTokens";

export default function Toggle({ enabled, onChange, label, id }) {
    const { dark } = useTheme();
    const toggleId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="flex items-center justify-between gap-4">
            <label
                htmlFor={toggleId}
                className={cls(
                    "text-sm font-medium cursor-pointer select-none",
                    T.text(dark)
                )}
            >
                {label}
            </label>

            <button
                id={toggleId}
                role="switch"
                aria-checked={enabled}
                onClick={() => onChange(!enabled)}
                className={cls(
                    "w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 flex-shrink-0",
                    enabled
                        ? "bg-indigo-600"
                        : dark
                            ? "bg-slate-700"
                            : "bg-slate-200"
                )}
            >
                <span
                    className={cls(
                        "block w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 mx-1",
                        enabled ? "translate-x-5" : "translate-x-0"
                    )}
                />
            </button>
        </div>
    );
}