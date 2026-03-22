import { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [dark, setDark] = useState(systemScheme === "dark");
  const toggle = () => setDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/* ═══ Color Palette (matching web app) ═══ */
export const colors = {
  light: {
    bg: "#ffffff",
    card: "#f8fafc",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#64748b",
    textMuted: "#94a3b8",
    indigo: "#4f46e5",
    emerald: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    violet: "#8b5cf6",
    blue: "#3b82f6",
  },
  dark: {
    bg: "#020617",
    card: "#0f172a",
    border: "rgba(255,255,255,0.08)",
    text: "#f1f5f9",
    textSecondary: "#94a3b8",
    textMuted: "#475569",
    indigo: "#6366f1",
    emerald: "#10b981",
    amber: "#f59e0b",
    red: "#ef4444",
    violet: "#8b5cf6",
    blue: "#3b82f6",
  },
};

export function useColors() {
  const { dark } = useTheme();
  return dark ? colors.dark : colors.light;
}
