import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Disc, RefreshCw, Smartphone, ShieldCheck } from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import Button from "../components/ui/Button";

export default function LandingPage() {
  const navigate = useNavigate();
  const { dark } = useTheme();

  const FEATURES = [
    {
      icon: <Disc className="w-5 h-5" />,
      title: "Offline Token System",
      desc: "Cryptographically signed tokens that work without internet.",
    },
    {
      icon: <RefreshCw className="w-5 h-5" />,
      title: "Secure Sync Engine",
      desc: "Conflict-free background settlement once connectivity returns.",
    },
    {
      icon: <Smartphone className="w-5 h-5" />,
      title: "NFC / HCE Support",
      desc: "Tap-to-pay via Host Card Emulation.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Risk Intelligence",
      desc: "ML-driven anomaly detection before settlement.",
    },
  ];

  return (
    <div
      className={cls(
        "relative min-h-screen overflow-x-hidden transition-colors duration-500",
        dark
          ? "bg-slate-950 text-slate-100"
          : "bg-white text-slate-900"
      )}
    >
      {/* Ambient Glow Background */}
      {!dark && (
        <div
          className="absolute inset-0 pointer-events-none 
      bg-[radial-gradient(circle_at_30%_30%,rgba(99,102,241,0.15),transparent_40%)]"
        />
      )}

      <div className="relative z-10">
        {/* NAV */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-inner">
              <span className="text-white text-sm font-black">Ω</span>
            </div>
            <span className="font-bold text-xl tracking-tight">OffPay</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button variant="primary" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
          </div>
        </nav>

        {/* HERO */}
        <section className="px-6 sm:px-10 pt-20 pb-24 max-w-6xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-6xl font-black tracking-tight"
          >
            Digital Payments <br />
            <span className="text-indigo-600">Without</span> the Internet
          </motion.h1>

          <p
            className={cls(
              "mt-8 text-lg max-w-2xl mx-auto font-medium",
              T.muted(dark)
            )}
          >
            Send, receive and settle payments anywhere — zero connectivity required.
          </p>

          <div className="flex justify-center gap-4 mt-10">
            <Button variant="primary" size="lg" onClick={() => navigate("/auth")}>
              Launch Dashboard →
            </Button>
            <Button variant="secondary" size="lg">
              Watch Demo
            </Button>
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-6 sm:px-10 py-20 max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className={cls(
                  "rounded-3xl p-6 border transition-all duration-300",
                  dark
                    ? "bg-slate-900/60 border-white/10"
                    : "bg-white border-slate-200"
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-5">
                  {f.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                <p className={cls("text-sm", T.muted(dark))}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer
          className={cls(
            "px-6 sm:px-10 py-10 border-t",
            dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
          )}
        >
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <span className="font-semibold">© 2026 OffPay</span>
            <div className="flex gap-6 text-sm">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Security</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}