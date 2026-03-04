import { cls } from "../../utils/cls";
import Card from "./Card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { T } from "../../theme/themeTokens";

export default function KPICard({
  label,
  value,
  sub,
  icon,
  trend,
  color = "indigo",
}) {
  const { dark } = useTheme();
  const colorCls = T.kpiBg[color]?.(dark) ?? T.kpiBg.indigo(dark);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cls(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            colorCls
          )}
        >
          {icon}
        </div>

        {trend !== undefined && (
          <span
            className={cls(
              "text-xs font-semibold flex items-center gap-0.5",
              trend > 0 ? "text-emerald-600" : "text-red-500"
            )}
          >
            {trend > 0 ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </span>
        )}
      </div>

      <p
        className={cls(
          "text-[22px] font-semibold tracking-tight",
          T.text(dark)
        )}
      >
        {value}
      </p>

      <p className={cls("text-xs mt-0.5", T.muted(dark))}>{label}</p>

      {sub && (
        <p className={cls("text-xs mt-1", T.subtle(dark))}>{sub}</p>
      )}
    </Card>
  );
}