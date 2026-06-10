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
    indigo: "#00D4FF",
    emerald: "#00E5A0",
    amber: "#FFB800",
    red: "#FF3B5C",
    violet: "#7C3AED",
    blue: "#3b82f6",
    accent: "#FF006E",
    gradient: { start: "#00D4FF", end: "#7C3AED" },
  },
  dark: {
    bg: "#0A0E1A",
    card: "rgba(15, 20, 35, 0.85)",
    border: "rgba(255,255,255,0.06)",
    text: "#F0F2F5",
    textSecondary: "#8B95A5",
    textMuted: "#4A5568",
    indigo: "#00D4FF",
    emerald: "#00E5A0",
    amber: "#FFB800",
    red: "#FF3B5C",
    violet: "#7C3AED",
    blue: "#3B82F6",
    accent: "#FF006E",
    gradient: { start: "#00D4FF", end: "#7C3AED" },
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
