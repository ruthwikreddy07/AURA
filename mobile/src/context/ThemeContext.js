import { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import NetInfo from "@react-native-community/netinfo";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [dark, setDark] = useState(systemScheme === "dark");
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Monitor network state globally
    const unsubscribe = NetInfo.addEventListener(state => {
      // In simulator, it might say connected but no internet.
      // NetInfo.isConnected is true if there's any active network interface.
      setIsOffline(state.isConnected === false);
    });
    return () => unsubscribe();
  }, []);

  const toggle = () => setDark((d) => !d);

  return (
    <ThemeContext.Provider value={{ dark, toggle, isOffline }}>
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
  const { dark, isOffline } = useTheme();
  const baseColors = dark ? colors.dark : colors.light;
  
  // ⚡ Emergency Off-Grid Mode: Systematically swap the brand accent color 
  // from Indigo to Amber, giving the app a distinct "Warning/Offline" feel globally.
  if (isOffline) {
    return {
      ...baseColors,
      indigo: baseColors.amber, // Turn all primary buttons & accents to Amber 
      violet: baseColors.red,
    };
  }

  return baseColors;
}
