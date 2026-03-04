import { useEffect } from "react";
import { X } from "lucide-react";
import { cls } from "../utils/cls";
import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { SidebarContent } from "./Sidebar";

function MobileSheet({ open, onClose, active, onNav }) {
    const { dark } = useTheme();

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    useEffect(() => {
        document.body.style.overflow = open ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    return (
        <>
            <div
                className={cls("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden", open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none")}
                onClick={onClose} aria-hidden="true"
            />
            <div
                role="dialog" aria-modal="true" aria-label="Navigation menu"
                className={cls("fixed inset-y-0 left-0 z-50 w-64 border-r shadow-2xl transition-transform duration-300 ease-out md:hidden", T.nav(dark), open ? "translate-x-0" : "-translate-x-full")}
            >
                <button
                    onClick={onClose} aria-label="Close menu"
                    className={cls("absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors active:scale-95", "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400", T.navHover(dark))}
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent active={active} onNav={(id) => { onNav(id); onClose(); }} collapsed={false} />
            </div>
        </>
    );
}

export default MobileSheet;