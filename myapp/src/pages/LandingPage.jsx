import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Disc, RefreshCw, Smartphone, ShieldCheck, Zap, Globe, Lock,
  Bluetooth, QrCode, Wifi, Volume2, Sun, ArrowRight, CheckCircle2,
  BarChart3, Users, Shield, Eye, Cpu, Radio, Layers, TrendingUp,
  ChevronRight
} from "lucide-react";

import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import Button from "../components/ui/Button";

/* ─────────────────────────────── animations ─────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };
const fadeIn = { hidden: { opacity: 0 }, visible: { opacity: 1 } };
const stagger = { visible: { transition: { staggerChildren: 0.12 } } };

/* ─────────────────────────── section wrapper ─────────────────────────────── */
function Section({ children, className = "", id }) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger}
      className={cls("px-6 sm:px-10 max-w-7xl mx-auto", className)}
    >
      {children}
    </motion.section>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useTheme();

  /* ───── data ───── */
  const FEATURES = [
    { icon: <Disc className="w-6 h-6" />, title: "Offline Token Engine", desc: "RSA-signed cryptographic tokens that work without any internet connectivity. Pre-fetched and stored securely on-device.", color: "indigo" },
    { icon: <Lock className="w-6 h-6" />, title: "AES-256 Encryption", desc: "Every payment packet is encrypted with AES-GCM using ephemeral session keys. Military-grade encryption for every transaction.", color: "emerald" },
    { icon: <RefreshCw className="w-6 h-6" />, title: "Smart Sync Engine", desc: "Conflict-free background settlement with anti-replay protection. Transactions queue locally and settle when connectivity returns.", color: "violet" },
    { icon: <ShieldCheck className="w-6 h-6" />, title: "Risk Intelligence", desc: "Real-time anomaly detection scoring every transaction. Velocity checks, geo-fencing, and device trust scoring before settlement.", color: "amber" },
    { icon: <Zap className="w-6 h-6" />, title: "Instant Settlement", desc: "Sub-second transaction processing. The moment connectivity returns, pending transactions settle in under 200ms.", color: "blue" },
    { icon: <Globe className="w-6 h-6" />, title: "Universal Access", desc: "Works in rural areas, underground metros, flights, and disaster zones. Financial inclusion for the unconnected billion.", color: "rose" },
  ];

  const MODES = [
    { icon: <QrCode className="w-8 h-8" />, name: "QR Code", status: "Live", desc: "Scan-to-pay via encrypted QR codes. Works on any device with a camera.", statusColor: "emerald" },
    { icon: <Bluetooth className="w-8 h-8" />, name: "Bluetooth (BLE)", status: "Mobile App", desc: "Ambient peer-to-peer payments within 30m range via Bluetooth Low Energy.", statusColor: "blue" },
    { icon: <Wifi className="w-8 h-8" />, name: "NFC", status: "Mobile App", desc: "Tap-to-pay via Near Field Communication. Sub-second contactless transfers.", statusColor: "blue" },
    { icon: <Volume2 className="w-8 h-8" />, name: "Ultrasonic Sound", status: "Research", desc: "Data-over-sound using inaudible frequencies. No pairing required.", statusColor: "amber" },
    { icon: <Sun className="w-8 h-8" />, name: "Light (Li-Fi)", status: "Research", desc: "Visible light communication via screen flashing patterns.", statusColor: "amber" },
  ];

  const PROTOCOL_STEPS = [
    { step: "01", title: "Session Created", desc: "Sender initiates a cryptographic session. A unique AES-256 session key is generated.", icon: <Layers className="w-5 h-5" /> },
    { step: "02", title: "Motion Verified", desc: "Both devices prove physical proximity via motion hash verification.", icon: <Radio className="w-5 h-5" /> },
    { step: "03", title: "Packet Encrypted", desc: "Payment data is AES-GCM encrypted with the ephemeral session key.", icon: <Lock className="w-5 h-5" /> },
    { step: "04", title: "Air-Gap Transfer", desc: "Encrypted packet transfers via QR / BLE / NFC. Zero internet needed.", icon: <Zap className="w-5 h-5" /> },
    { step: "05", title: "Verified & Settled", desc: "Backend decrypts, validates anti-replay, scores risk, and settles.", icon: <CheckCircle2 className="w-5 h-5" /> },
  ];

  const STATS = [
    { value: "256", unit: "bit", label: "AES Encryption" },
    { value: "<200", unit: "ms", label: "Settlement Time" },
    { value: "5", unit: "modes", label: "Communication Channels" },
    { value: "0", unit: "bytes", label: "Network Data Required" },
  ];

  const colorMap = {
    indigo: { bg: dark ? "bg-indigo-500/15" : "bg-indigo-50", text: "text-indigo-500", border: dark ? "border-indigo-500/20" : "border-indigo-200" },
    emerald: { bg: dark ? "bg-emerald-500/15" : "bg-emerald-50", text: "text-emerald-500", border: dark ? "border-emerald-500/20" : "border-emerald-200" },
    violet: { bg: dark ? "bg-violet-500/15" : "bg-violet-50", text: "text-violet-500", border: dark ? "border-violet-500/20" : "border-violet-200" },
    amber: { bg: dark ? "bg-amber-500/15" : "bg-amber-50", text: "text-amber-500", border: dark ? "border-amber-500/20" : "border-amber-200" },
    blue: { bg: dark ? "bg-blue-500/15" : "bg-blue-50", text: "text-blue-500", border: dark ? "border-blue-500/20" : "border-blue-200" },
    rose: { bg: dark ? "bg-rose-500/15" : "bg-rose-50", text: "text-rose-500", border: dark ? "border-rose-500/20" : "border-rose-200" },
  };

  return (
    <div className={cls("relative min-h-screen overflow-x-hidden transition-colors duration-500", dark ? "bg-slate-950 text-slate-100" : "bg-white text-slate-900")}>

      {/* ═══════════ AMBIENT BACKGROUND ═══════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={cls("absolute w-[600px] h-[600px] rounded-full blur-3xl -top-40 -left-40", dark ? "bg-indigo-600/8" : "bg-indigo-400/15")} />
        <div className={cls("absolute w-[500px] h-[500px] rounded-full blur-3xl top-1/3 -right-32", dark ? "bg-violet-600/6" : "bg-violet-300/10")} />
        <div className={cls("absolute w-[400px] h-[400px] rounded-full blur-3xl bottom-20 left-1/3", dark ? "bg-emerald-600/5" : "bg-emerald-300/10")} />
      </div>

      <div className="relative z-10">

        {/* ═══════════ NAVIGATION ═══════════ */}
        <nav className="flex items-center justify-between px-6 sm:px-10 py-5 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white text-sm font-black">Ω</span>
            </div>
            <span className="font-black text-xl tracking-tight">AURA</span>
            <span className={cls("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border", dark ? "border-indigo-500/30 text-indigo-400" : "border-indigo-200 text-indigo-600")}>Protocol</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className={cls("w-9 h-9 rounded-xl flex items-center justify-center transition-all", dark ? "bg-slate-800 text-slate-400 hover:text-white" : "bg-slate-100 text-slate-500 hover:text-slate-900")}>
              {dark ? <Sun className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
            <Button variant="primary" onClick={() => navigate("/auth")}>Get Started</Button>
          </div>
        </nav>

        {/* ═══════════ HERO ═══════════ */}
        <Section className="pt-20 sm:pt-28 pb-20 text-center">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-8" style={{ borderColor: dark ? "rgba(99,102,241,0.3)" : "rgba(99,102,241,0.2)", background: dark ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.05)" }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className={cls("text-xs font-bold tracking-wide", dark ? "text-indigo-300" : "text-indigo-600")}>PROTOCOL v2.0 · NOW WITH QR PAYMENTS</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            Digital Payments<br />
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-500 bg-clip-text text-transparent">Without</span> the Internet
          </motion.h1>

          <motion.p variants={fadeUp} className={cls("mt-7 text-lg sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed", dark ? "text-slate-400" : "text-slate-500")}>
            AURA enables secure, offline, peer-to-peer digital payments using military-grade cryptography through Bluetooth, NFC, QR codes, and beyond.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4 mt-10">
            <Button variant="primary" size="lg" onClick={() => navigate("/auth")}>
              Launch Dashboard <ArrowRight className="w-4 h-4 ml-1 inline" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => document.getElementById("protocol")?.scrollIntoView({ behavior: "smooth" })}>
              How It Works
            </Button>
          </motion.div>
        </Section>

        {/* ═══════════ STATS BAR ═══════════ */}
        <Section className="py-10">
          <motion.div variants={fadeUp} className={cls("rounded-3xl p-8 grid grid-cols-2 lg:grid-cols-4 gap-8 border backdrop-blur-sm", dark ? "bg-slate-900/60 border-white/10" : "bg-slate-50/80 border-slate-200")}>
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-black tracking-tight text-indigo-500">
                  {s.value}<span className="text-lg font-bold ml-1 opacity-60">{s.unit}</span>
                </p>
                <p className={cls("text-sm font-semibold mt-1", dark ? "text-slate-400" : "text-slate-500")}>{s.label}</p>
              </div>
            ))}
          </motion.div>
        </Section>

        {/* ═══════════ FEATURES GRID ═══════════ */}
        <Section className="py-20" id="features">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className={cls("text-xs font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg", dark ? "bg-indigo-500/10 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>Features</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-5">Built for the Impossible</h2>
            <p className={cls("text-base font-medium mt-3 max-w-xl mx-auto", dark ? "text-slate-400" : "text-slate-500")}>
              Enterprise-grade security meets zero-connectivity payments.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const c = colorMap[f.color];
              return (
                <motion.div key={i} variants={fadeUp}
                  className={cls("rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group", dark ? "bg-slate-900/60 border-white/10 hover:border-white/20" : "bg-white border-slate-200 hover:border-slate-300")}
                >
                  <div className={cls("w-12 h-12 rounded-2xl flex items-center justify-center mb-5", c.bg, c.text)}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-[17px] mb-2">{f.title}</h3>
                  <p className={cls("text-sm leading-relaxed", dark ? "text-slate-400" : "text-slate-500")}>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </Section>

        {/* ═══════════ PROTOCOL FLOW ═══════════ */}
        <Section className="py-20" id="protocol">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className={cls("text-xs font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg", dark ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")}>Protocol</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-5">How AURA Works</h2>
            <p className={cls("text-base font-medium mt-3 max-w-xl mx-auto", dark ? "text-slate-400" : "text-slate-500")}>
              Five cryptographic steps. Zero internet. Complete security.
            </p>
          </motion.div>

          <div className="relative">
            {/* Vertical line connector */}
            <div className={cls("absolute left-8 top-0 bottom-0 w-px hidden lg:block", dark ? "bg-gradient-to-b from-indigo-500/40 via-emerald-500/40 to-indigo-500/0" : "bg-gradient-to-b from-indigo-300 via-emerald-300 to-indigo-100")} />

            <div className="space-y-4 lg:space-y-6">
              {PROTOCOL_STEPS.map((s, i) => (
                <motion.div key={i} variants={fadeUp}
                  className={cls("flex items-start gap-5 lg:gap-8 rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-0.5", dark ? "bg-slate-900/40 border-white/8 hover:border-indigo-500/30" : "bg-white border-slate-200 hover:border-indigo-200")}
                >
                  <div className={cls("w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center relative z-10", dark ? "bg-indigo-500/15" : "bg-indigo-50")}>
                    <span className="text-indigo-500 font-black text-xl">{s.step}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-indigo-500">{s.icon}</span>
                      <h3 className="font-bold text-[17px]">{s.title}</h3>
                    </div>
                    <p className={cls("text-sm leading-relaxed", dark ? "text-slate-400" : "text-slate-500")}>{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Section>

        {/* ═══════════ COMMUNICATION MODES ═══════════ */}
        <Section className="py-20" id="modes">
          <motion.div variants={fadeUp} className="text-center mb-14">
            <span className={cls("text-xs font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg", dark ? "bg-violet-500/10 text-violet-400" : "bg-violet-50 text-violet-600")}>Transmission</span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mt-5">5 Communication Channels</h2>
            <p className={cls("text-base font-medium mt-3 max-w-xl mx-auto", dark ? "text-slate-400" : "text-slate-500")}>
              Multiple air-gap data transfer methods for maximum compatibility.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {MODES.map((m, i) => (
              <motion.div key={i} variants={fadeUp}
                className={cls("rounded-2xl p-5 border text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg", dark ? "bg-slate-900/60 border-white/10" : "bg-white border-slate-200")}
              >
                <div className={cls("w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4", dark ? "bg-slate-800/60" : "bg-slate-50")}>
                  <span className="text-indigo-500">{m.icon}</span>
                </div>
                <h3 className="font-bold text-[15px] mb-1">{m.name}</h3>
                <span className={cls("inline-block px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide mb-3", 
                  m.statusColor === "emerald" ? (dark ? "bg-emerald-500/15 text-emerald-400" : "bg-emerald-50 text-emerald-600") :
                  m.statusColor === "blue" ? (dark ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600") :
                  (dark ? "bg-amber-500/15 text-amber-400" : "bg-amber-50 text-amber-600")
                )}>
                  {m.status}
                </span>
                <p className={cls("text-xs leading-relaxed", dark ? "text-slate-500" : "text-slate-400")}>{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ═══════════ SECURITY BANNER ═══════════ */}
        <Section className="py-20">
          <motion.div variants={fadeUp}
            className={cls("rounded-3xl p-10 sm:p-14 border relative overflow-hidden", dark ? "bg-gradient-to-br from-indigo-950/80 to-slate-900/80 border-indigo-500/20" : "bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200")}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-20 bg-indigo-500 pointer-events-none" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <Shield className="w-6 h-6 text-indigo-500" />
                  <span className={cls("text-xs font-bold uppercase tracking-[0.2em]", dark ? "text-indigo-400" : "text-indigo-600")}>Security Architecture</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-5">
                  Bank-Grade Security.<br />Zero Trust by Default.
                </h2>
                <p className={cls("text-base leading-relaxed mb-6", dark ? "text-slate-400" : "text-slate-600")}>
                  Every layer of AURA is built with a zero-trust security model. From RSA-2048 token signing to ephemeral AES-256-GCM session encryption, your money is protected by the same cryptography that secures government communications.
                </p>
                <div className="space-y-3">
                  {[
                    "RSA-2048 token signatures with anti-replay nonces",
                    "AES-256-GCM per-session ephemeral encryption",
                    "JWT authentication with bcrypt password hashing",
                    "Real-time risk scoring on every transaction",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className={cls("text-sm font-medium", dark ? "text-slate-300" : "text-slate-700")}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={cls("rounded-2xl p-6 space-y-4 border", dark ? "bg-slate-900/60 border-white/10" : "bg-white/80 border-slate-200")}>
                {[
                  { label: "Encryption Standard", value: "AES-256-GCM", icon: <Lock className="w-4 h-4" /> },
                  { label: "Token Signing", value: "RSA-2048", icon: <Cpu className="w-4 h-4" /> },
                  { label: "Auth Protocol", value: "JWT + bcrypt", icon: <ShieldCheck className="w-4 h-4" /> },
                  { label: "Anti-Replay", value: "Nonce + Expiry", icon: <RefreshCw className="w-4 h-4" /> },
                  { label: "Risk Engine", value: "ML Scoring", icon: <BarChart3 className="w-4 h-4" /> },
                ].map((item, i) => (
                  <div key={i} className={cls("flex items-center justify-between p-3 rounded-xl", dark ? "bg-slate-800/50" : "bg-slate-50")}>
                    <div className="flex items-center gap-3">
                      <span className="text-indigo-500">{item.icon}</span>
                      <span className={cls("text-sm font-medium", dark ? "text-slate-400" : "text-slate-500")}>{item.label}</span>
                    </div>
                    <span className={cls("text-sm font-bold", dark ? "text-slate-200" : "text-slate-800")}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </Section>

        {/* ═══════════ CTA ═══════════ */}
        <Section className="py-24 text-center">
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Ready to <span className="text-indigo-500">go offline</span>?
            </h2>
            <p className={cls("text-lg font-medium mt-5 max-w-lg mx-auto", dark ? "text-slate-400" : "text-slate-500")}>
              Join the next generation of payments. No signal required.
            </p>
            <div className="flex flex-wrap justify-center gap-4 mt-10">
              <Button variant="primary" size="lg" onClick={() => navigate("/auth")}>
                Create Free Account <ChevronRight className="w-4 h-4 ml-1 inline" />
              </Button>
              <Button variant="secondary" size="lg" onClick={() => navigate("/auth")}>
                View Live Demo
              </Button>
            </div>
          </motion.div>
        </Section>

        {/* ═══════════ FOOTER ═══════════ */}
        <footer className={cls("px-6 sm:px-10 py-10 border-t", dark ? "bg-slate-900/60 border-slate-800" : "bg-slate-50 border-slate-200")}>
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <span className="text-white text-xs font-black">Ω</span>
              </div>
              <span className="font-bold">AURA Protocol</span>
              <span className={cls("text-xs", dark ? "text-slate-500" : "text-slate-400")}>© 2026</span>
            </div>
            <div className={cls("flex gap-6 text-sm font-medium", dark ? "text-slate-500" : "text-slate-400")}>
              <span className="hover:text-indigo-500 cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-indigo-500 cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-indigo-500 cursor-pointer transition-colors">Security</span>
              <span className="hover:text-indigo-500 cursor-pointer transition-colors">Documentation</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}