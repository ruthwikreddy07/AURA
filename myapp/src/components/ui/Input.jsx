import { cls } from "../../utils/cls";
import { useTheme } from "../../context/ThemeContext";
import { T } from "../../theme/themeTokens";

export default function Input({
    label,
    placeholder,
    type = "text",
    icon,
    value,
    onChange,
    name,
}) {
    const { dark } = useTheme();

    const id =
        name ??
        label?.toLowerCase().replace(/\s+/g, "-") ??
        Math.random().toString(36).slice(2);

    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={id}
                    className={cls("text-sm font-medium", T.muted(dark))}
                >
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <span
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        aria-hidden="true"
                    >
                        {icon}
                    </span>
                )}

                <input
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    className={cls(
                        "w-full border rounded-xl py-2.5 text-sm transition-all duration-200 ease-out",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:border-transparent",
                        T.inputBg(dark),
                        icon ? "pl-10 pr-4" : "px-4"
                    )}
                />
            </div>
        </div>
    );
}