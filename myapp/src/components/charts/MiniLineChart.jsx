import React from "react";
import { useTheme } from "../../context/ThemeContext";
import { T } from "../../theme/themeTokens";
export default function MiniLineChart({ data, color = "#4F46E5", gradId = "chartFill" }) {
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const W = 300, H = 80;
    const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * W, y: H - ((v - min) / range) * (H - 16) - 8 }));
    const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
    const areaPath = linePath + ` L ${W} ${H} L 0 ${H} Z`;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-20" role="img" aria-label="Line chart">
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill={color} />
        </svg>
    );
}
