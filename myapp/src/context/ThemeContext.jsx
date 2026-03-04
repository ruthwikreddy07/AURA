import { createContext, useContext, useState, useEffect } from "react";

// Create context
export const ThemeCtx = createContext();

// Custom hook
export const useTheme = () => useContext(ThemeCtx);

// Provider component
export function ThemeProvider({ children }) {
    const [dark, setDark] = useState(false);

    // System preference + localStorage
    useEffect(() => {
        const saved = localStorage.getItem("offpay-theme");
        if (saved) {
            setDark(saved === "dark");
        } else {
            setDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("offpay-theme", dark ? "dark" : "light");
    }, [dark]);

    const toggle = () => setDark(d => !d);

    return (
        <ThemeCtx.Provider value={{ dark, toggle }}>
            {children}
        </ThemeCtx.Provider>
    );
}