import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "./Sidebar";
import MobileSheet from "./MobileSheet";
import TopNav from "./TopNav";

import { useTheme } from "../context/ThemeContext";
import { cls } from "../utils/cls";

export default function AppLayout() {
  const { dark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const page = location.pathname.split("/")[2] || "overview";

  return (
    <div
      className={cls(
        "flex h-screen overflow-hidden",
        dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      )}
    >
      <Sidebar
        active={page}
        onNav={(id) => navigate(`/app/${id}`)}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <MobileSheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        active={page}
        onNav={(id) => navigate(`/app/${id}`)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav page={page} onMenuOpen={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}