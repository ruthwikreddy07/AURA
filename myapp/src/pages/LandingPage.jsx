import React, { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Trail } from "@react-three/drei";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Zap, Lock, RefreshCw, ShieldCheck, Globe, Disc,
  ArrowRight, Star, Quote, PlayCircle,
  QrCode, Bluetooth, Wifi, Volume2, Sun, Layers, Radio, CheckCircle2,
  Cpu, BarChart3, Shield, ChevronDown, Sparkles
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { cls } from "../utils/cls";

gsap.registerPlugin(ScrollTrigger);

/* ══════════════════════════════════════════════════════════════════════
   ANIMATED MESH GRADIENT CANVAS — the "wow" background
   ══════════════════════════════════════════════════════════════════════ */
function MeshGradientCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    let t = 0;

    const blobs = [
      { x: 0.2, y: 0.3, r: 350, color: [99, 102, 241], speed: 0.0008, phase: 0 },
      { x: 0.7, y: 0.2, r: 300, color: [139, 92, 246], speed: 0.0012, phase: 2 },
      { x: 0.5, y: 0.7, r: 280, color: [16, 185, 129], speed: 0.001, phase: 4 },
      { x: 0.3, y: 0.8, r: 260, color: [236, 72, 153], speed: 0.0009, phase: 1 },
      { x: 0.8, y: 0.6, r: 320, color: [59, 130, 246], speed: 0.0011, phase: 3 },
    ];

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      t++;
      ctx.fillStyle = "#030014";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const b of blobs) {
        const cx = canvas.width * (b.x + 0.15 * Math.sin(t * b.speed + b.phase));
        const cy = canvas.height * (b.y + 0.12 * Math.cos(t * b.speed * 1.3 + b.phase));
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r * (canvas.width / 1400));
        grad.addColorStop(0, `rgba(${b.color.join(",")}, 0.25)`);
        grad.addColorStop(0.5, `rgba(${b.color.join(",")}, 0.08)`);
        grad.addColorStop(1, `rgba(${b.color.join(",")}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 z-0 w-full h-full" />;
}

/* ══════════════════════════════════════════════════════════════════════
   DOT GRID OVERLAY
   ══════════════════════════════════════════════════════════════════════ */
function DotGrid() {
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none opacity-[0.03]"
      style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   3D HERO — Torus Knot with particle constellation
   ══════════════════════════════════════════════════════════════════════ */
function GlowingTorus() {
  const meshRef = useRef();
  const matRef = useRef();
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.elapsedTime * 0.12;
      meshRef.current.rotation.y = clock.elapsedTime * 0.18;
    }
  });
  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1}>
      <mesh ref={meshRef} scale={1.8}>
        <torusKnotGeometry args={[1, 0.35, 200, 32, 2, 3]} />
        <MeshDistortMaterial
          ref={matRef}
          color="#6366f1"
          emissive="#7c3aed"
          emissiveIntensity={0.6}
          roughness={0.15}
          metalness={0.9}
          distort={0.2}
          speed={3}
          transparent
          opacity={0.9}
          wireframe={false}
        />
      </mesh>
    </Float>
  );
}

function StarField() {
  const count = 250;
  const ref = useRef();
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 20;
      p[i * 3 + 1] = (Math.random() - 0.5) * 20;
      p[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return p;
  }, []);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.rotation.y = clock.elapsedTime * 0.015;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} /></bufferGeometry>
      <pointsMaterial size={0.035} color="#a78bfa" transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function Hero3D() {
  return (
    <div className="absolute top-0 right-[-5%] w-[45%] h-full z-[2] pointer-events-none opacity-25">
      <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
        <color attach="background" args={["transparent"]} />
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} color="#a78bfa" />
        <directionalLight position={[-3, -3, 2]} intensity={0.3} color="#34d399" />
        <pointLight position={[0, 0, 3]} intensity={1} color="#6366f1" distance={8} />
        <Suspense fallback={null}>
          <GlowingTorus />
          <StarField />
        </Suspense>
      </Canvas>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   GLOWING BORDER CARD
   ══════════════════════════════════════════════════════════════════════ */
function GlowCard({ children, className = "", glowColor = "indigo" }) {
  const colors = {
    indigo: "from-indigo-500/50 via-violet-500/50 to-indigo-500/50",
    emerald: "from-emerald-500/50 via-cyan-500/50 to-emerald-500/50",
    violet: "from-violet-500/50 via-purple-500/50 to-violet-500/50",
    amber: "from-amber-500/50 via-orange-500/50 to-amber-500/50",
    blue: "from-blue-500/50 via-cyan-500/50 to-blue-500/50",
    rose: "from-rose-500/50 via-pink-500/50 to-rose-500/50",
  };
  return (
    <div className="relative group">
      <div className={`absolute -inset-[1px] rounded-3xl bg-gradient-to-r ${colors[glowColor] || colors.indigo} opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm`} />
      <div className={cls("relative rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl", className)}>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MOUSE GLOW
   ══════════════════════════════════════════════════════════════════════ */
function MouseGlow() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 40, damping: 15 });
  const sy = useSpring(y, { stiffness: 40, damping: 15 });
  useEffect(() => {
    const h = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [x, y]);
  return (
    <motion.div className="pointer-events-none fixed z-[2]" style={{
      x: useTransform(sx, v => v - 250), y: useTransform(sy, v => v - 250),
      width: 500, height: 500, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)",
    }} />
  );
}

/* ══════════════════════════════════════════════════════════════════════
   ANIMATED COUNTER
   ══════════════════════════════════════════════════════════════════════ */
function Counter({ value, unit, label }) {
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(false);
  const [count, setCount] = useState(0);
  const numVal = parseInt(value.replace(/[<>]/g, "")) || 0;
  const prefix = value.startsWith("<") ? "<" : "";

  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.5 });
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref]);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    function step(now) {
      const p = Math.min((now - start) / 2000, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * numVal));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [inView, numVal]);

  return (
    <div ref={setRef} className="text-center px-4">
      <p className="text-5xl sm:text-7xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent tabular-nums">
        {prefix}{count}<span className="text-2xl font-bold ml-1 text-indigo-400/60">{unit}</span>
      </p>
      <p className="text-sm font-semibold mt-3 text-slate-500">{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   FRAMER VARIANTS
   ══════════════════════════════════════════════════════════════════════ */
const fadeUp = { hidden: { opacity: 0, y: 60 }, visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] } }) };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

function Section({ children, className = "", id }) {
  return (
    <motion.section id={id} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={stagger}
      className={cls("relative z-10 px-6 sm:px-10 max-w-7xl mx-auto", className)}>
      {children}
    </motion.section>
  );
}

function SectionLabel({ text, color = "text-indigo-400" }) {
  return (
    <motion.div variants={fadeUp} className="flex items-center justify-center gap-2 mb-5">
      <div className={cls("h-px w-8 bg-gradient-to-r from-transparent", color === "text-indigo-400" ? "to-indigo-500/50" : color === "text-emerald-400" ? "to-emerald-500/50" : "to-violet-500/50")} />
      <span className={cls("text-xs font-bold uppercase tracking-[0.25em]", color)}>{text}</span>
      <div className={cls("h-px w-8 bg-gradient-to-l from-transparent", color === "text-indigo-400" ? "to-indigo-500/50" : color === "text-emerald-400" ? "to-emerald-500/50" : "to-violet-500/50")} />
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  const demoRef = useRef(null);

  /* GSAP demo scrub */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from("#phone-sender", { y: 150, opacity: 0, rotate: -5, scrollTrigger: { trigger: "#demo-area", start: "top 75%", end: "top 35%", scrub: 1.2 } });
      gsap.from("#phone-receiver", { y: 150, opacity: 0, rotate: 5, scrollTrigger: { trigger: "#demo-area", start: "top 70%", end: "top 30%", scrub: 1.2 } });
      gsap.from("#packet-beam", { scaleX: 0, opacity: 0, transformOrigin: "left", scrollTrigger: { trigger: "#demo-area", start: "top 55%", end: "top 25%", scrub: 1.2 } });
    }, demoRef);
    return () => ctx.revert();
  }, []);

  const FEATURES = [
    { icon: <Disc className="w-6 h-6" />, title: "Offline Token Engine", desc: "RSA-2048 signed cryptographic tokens pre-fetched and secured on-device. Works with absolute zero connectivity.", glow: "indigo" },
    { icon: <Lock className="w-6 h-6" />, title: "AES-256-GCM Encryption", desc: "Every payment packet encrypted with ephemeral session keys. The same standard protecting classified government comms.", glow: "emerald" },
    { icon: <RefreshCw className="w-6 h-6" />, title: "Smart Sync Engine", desc: "Conflict-free background settlement with anti-replay nonce validation. Queues offline, settles on reconnect in <200ms.", glow: "violet" },
    { icon: <ShieldCheck className="w-6 h-6" />, title: "Risk Intelligence", desc: "Real-time ML anomaly detection scoring every transaction locally — velocity checks, geo-fencing, device trust.", glow: "amber" },
    { icon: <Zap className="w-6 h-6" />, title: "5 Hardware Channels", desc: "QR Code, Bluetooth Low Energy, NFC, Ultrasonic Sound (FSK), and Li-Fi Flashlight. Custom protocols for each.", glow: "blue" },
    { icon: <Globe className="w-6 h-6" />, title: "Universal Access", desc: "Works underground, on flights, during disasters. Financial inclusion for the 1.4 billion adults without bank access.", glow: "rose" },
  ];

  const PROTOCOL = [
    { n: "01", title: "Session Key Exchange", desc: "Ephemeral AES-256 session key generated via Diffie-Hellman. Never reused.", icon: <Layers className="w-5 h-5" />, color: "from-indigo-500 to-violet-500" },
    { n: "02", title: "Motion Verification", desc: "Both devices prove physical proximity via cryptographic motion-hash proofs.", icon: <Radio className="w-5 h-5" />, color: "from-violet-500 to-purple-500" },
    { n: "03", title: "Packet Encryption", desc: "Payment data sealed with AES-GCM using the ephemeral key. Tamper-proof.", icon: <Lock className="w-5 h-5" />, color: "from-purple-500 to-pink-500" },
    { n: "04", title: "Air-Gap Transfer", desc: "Encrypted packet sent via any of 5 hardware channels. Zero internet.", icon: <Zap className="w-5 h-5" />, color: "from-pink-500 to-rose-500" },
    { n: "05", title: "Verify & Settle", desc: "Backend decrypts, validates anti-replay nonces, runs ML risk scoring, settles.", icon: <CheckCircle2 className="w-5 h-5" />, color: "from-rose-500 to-emerald-500" },
  ];

  const MODES = [
    { icon: <QrCode />, name: "QR Code", speed: "~1.2s", range: "Line of sight", status: "Live", desc: "Camera-based encrypted QR scanning. Universal compatibility." },
    { icon: <Bluetooth />, name: "Bluetooth LE", speed: "~0.8s", range: "30 meters", status: "Built", desc: "Peer-to-peer GATT characteristic writes. Ambient payments." },
    { icon: <Wifi />, name: "NFC Tap", speed: "~0.3s", range: "4 cm", status: "Built", desc: "NDEF record exchange. Tap-and-go contactless payments." },
    { icon: <Volume2 />, name: "Ultrasonic", speed: "~2.5s", range: "3 meters", status: "Built", desc: "Custom FSK protocol at 18–20kHz. Goertzel frequency detection." },
    { icon: <Sun />, name: "Li-Fi Light", speed: "~3.0s", range: "1 meter", status: "Built", desc: "Manchester-encoded flashlight pulses. Camera brightness decode." },
  ];

  const TESTIMONIALS = [
    { name: "Sarah Jenkins", role: "Disaster Relief Coordinator", text: "AURA allowed our teams to distribute emergency funds in zero-connectivity hurricane zones. Absolute lifesaver.", avatar: "SJ" },
    { name: "Michael Ray", role: "Festival Organizer", text: "50,000 people, dead cell service, zero dropped payments. AURA was the only system that didn't go down.", avatar: "MR" },
    { name: "Elena Torres", role: "Commuter", text: "Coffee underground in the subway, instant sync at the surface. It feels like magic.", avatar: "ET" },
  ];
  const [activeT, setActiveT] = useState(0);
  useEffect(() => { const i = setInterval(() => setActiveT(p => (p + 1) % 3), 5000); return () => clearInterval(i); }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#030014] text-white">

      {/* === BACKGROUNDS === */}
      <MeshGradientCanvas />
      <DotGrid />
      <MouseGlow />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse-glow { 0%{box-shadow:0 0 0 0 rgba(99,102,241,0.5)}70%{box-shadow:0 0 0 20px rgba(99,102,241,0)}100%{box-shadow:0 0 0 0 rgba(99,102,241,0)} }
        .pulse-glow { animation: pulse-glow 2.5s infinite; }
        @keyframes shimmer { 0%{background-position:-200% 0}100%{background-position:200% 0} }
        .shimmer { background:linear-gradient(90deg,transparent,rgba(255,255,255,0.05),transparent); background-size:200% 100%; animation:shimmer 3s infinite; }
      `}} />

      {/* ═══════════════ STICKY NAV ═══════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.04] backdrop-blur-2xl bg-[#030014]/60">
        <div className="flex items-center justify-between px-6 sm:px-10 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white text-xs font-black">Ω</span>
            </div>
            <span className="font-black text-lg tracking-tight">AURA</span>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full border border-indigo-500/30 text-indigo-400 bg-indigo-500/10 ml-1">Protocol</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Features","Protocol","Modes","Security"].map(t => (
              <a key={t} href={`#${t.toLowerCase()}`} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{t}</a>
            ))}
          </div>
          <button onClick={() => navigate("/auth")} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:shadow-indigo-500/25">
            Launch Dashboard
          </button>
        </div>
      </nav>

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative min-h-[92vh] flex items-center justify-center">
        <Hero3D />
        {/* Dark vignette so text is always readable */}
        <div className="absolute inset-0 z-[3] pointer-events-none" style={{ background: 'radial-gradient(ellipse 90% 80% at 30% 50%, rgba(3,0,20,0.95) 0%, rgba(3,0,20,0.4) 60%, transparent 100%)' }} />

        {/* Main text content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 grid lg:grid-cols-2 items-center gap-10">
          <div className="text-center lg:text-left pt-20 lg:pt-0">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border border-indigo-500/30 bg-indigo-500/[0.08] backdrop-blur-xl mb-8">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold tracking-wider text-indigo-300">OFFLINE PAYMENTS PROTOCOL V2.0</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.15 }}
              className="text-6xl sm:text-7xl lg:text-[6rem] font-black tracking-tighter leading-[0.95] mb-8"
              style={{ textShadow: '0 4px 40px rgba(3,0,20,0.8)' }}>
              <span className="text-white drop-shadow-2xl">Pay Anyone.</span><br/>
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent drop-shadow-2xl">Zero Internet.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
              className="text-xl sm:text-2xl text-slate-400 font-medium leading-relaxed mb-12 max-w-xl mx-auto lg:mx-0">
              Military-grade cryptography across <span className="text-white font-semibold">5 hardware channels</span> — QR, Bluetooth, NFC, Sound & Light — enabling peer-to-peer payments completely off-grid.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.45 }}
              className="flex flex-wrap justify-center lg:justify-start gap-5">
              <button onClick={() => navigate("/auth")} className="pulse-glow px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all hover:scale-[1.02]">
                Try AURA Now <ArrowRight className="w-5 h-5" />
              </button>
              <button onClick={() => document.getElementById("demo-area")?.scrollIntoView({ behavior: "smooth" })}
                className="px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl transition-all hover:scale-[1.02]">
                Watch Demo <PlayCircle className="w-5 h-5 text-indigo-400" />
              </button>
            </motion.div>
          </div>
          
          {/* Floating UI cards orbiting the 3D element (only on desktop where layout splits) */}
          <div className="hidden lg:block relative h-full min-h-[500px]">
             
             {/* Card 1: Top Left of the void */}
             <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-10 left-0 xl:left-10 z-20 flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-emerald-500/10">
               <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
               <div className="text-left"><p className="font-bold text-xs text-white">Transfer Verified</p><p className="text-[10px] text-slate-500">Offline QR · AES-256</p></div>
             </motion.div>

             {/* Card 2: Bottom Right of the void */}
             <motion.div animate={{ y: [0, 12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
               className="absolute bottom-20 right-0 z-20 flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-blue-500/10">
               <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center"><Bluetooth className="w-4 h-4 text-blue-400" /></div>
               <div className="text-left"><p className="font-bold text-xs text-white">BLE Connected</p><p className="text-[10px] text-slate-500">Peer · AURA-002</p></div>
             </motion.div>

             {/* Card 3: Middle Left of the void (new) */}
             <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
               className="absolute top-1/2 left-10 xl:left-24 -translate-y-1/2 z-20 flex items-center gap-3 p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-2xl shadow-violet-500/10 fade-in">
               <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center"><Cpu className="w-4 h-4 text-violet-400" /></div>
               <div className="text-left"><p className="font-bold text-xs text-white">Zero Trust Core</p><p className="text-[10px] text-slate-500">Risk Score: 12 (Safe)</p></div>
             </motion.div>

          </div>
        </div>


        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <ChevronDown className="w-6 h-6 text-slate-600" />
        </motion.div>
      </section>

      {/* ═══════════════ STATS ═══════════════ */}
      <Section className="py-20">
        <motion.div variants={fadeUp} className="rounded-3xl p-10 lg:p-16 grid grid-cols-2 lg:grid-cols-4 gap-10 border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute inset-0 shimmer pointer-events-none" />
          {[
            { value: "256", unit: "bit", label: "AES-GCM Encryption" },
            { value: "<200", unit: "ms", label: "Settlement Time" },
            { value: "5", unit: "modes", label: "Hardware Channels" },
            { value: "0", unit: "bytes", label: "Network Data Needed" },
          ].map((s, i) => <Counter key={i} {...s} />)}
        </motion.div>
      </Section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <Section id="features" className="py-24">
        <SectionLabel text="Core Engine" color="text-indigo-400" />
        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-center mb-6">
          Engineered for <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Extremes</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg text-slate-400 text-center max-w-2xl mx-auto mb-16">
          Enterprise-grade security meets zero-connectivity payments.
        </motion.p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div key={i} variants={fadeUp} custom={i}>
              <GlowCard glowColor={f.glow} className="p-8 h-full">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-6 text-indigo-400">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ DEMO ═══════════════ */}
      <div ref={demoRef}>
        <Section id="demo-area" className="py-24">
          <SectionLabel text="Live Simulation" color="text-emerald-400" />
          <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-center mb-6">
            Air-Gapped <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Magic</span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-lg text-slate-400 text-center max-w-2xl mx-auto mb-16">
            Two unconnected devices exchange cryptographic proofs to complete a secure transfer.
          </motion.p>

          <div className="relative rounded-[40px] border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-8 md:p-16 flex flex-col md:flex-row items-center justify-center gap-8 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

            {/* Sender Phone */}
            <div id="phone-sender" className="w-64 h-[460px] rounded-[36px] border-[5px] border-slate-700/80 bg-[#0c0c1d] relative overflow-hidden flex flex-col pt-9 px-5 shadow-2xl shadow-indigo-500/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl" />
              <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Sender</p>
              <p className="text-4xl font-black text-center mt-5 mb-1 bg-gradient-to-b from-white to-white/50 bg-clip-text text-transparent">₹1,500</p>
              <p className="text-center text-slate-500 text-xs mb-6">To: Michael Ray</p>
              <div className="flex-1 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Bluetooth className="w-12 h-12 text-indigo-400" />
                </motion.div>
              </div>
              <div className="h-9 mt-4 w-full bg-indigo-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-xs">Sending via BLE...</span></div>
            </div>

            {/* Packet Beam */}
            <div id="packet-beam" className="flex flex-col items-center gap-2">
              <motion.div animate={{ x: [0, 16, 0] }} transition={{ duration: 1, repeat: Infinity }}>
                <ArrowRight className="text-indigo-400 w-7 h-7" />
              </motion.div>
              <span className="text-[10px] font-black text-indigo-400 tracking-[0.2em]">AES-256</span>
              <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <span className="text-[9px] text-indigo-300 font-mono">0x7F…9AE4</span>
              </div>
            </div>

            {/* Receiver Phone */}
            <div id="phone-receiver" className="w-64 h-[460px] rounded-[36px] border-[5px] border-slate-700/80 bg-[#0c0c1d] relative overflow-hidden flex flex-col pt-9 px-5 shadow-2xl shadow-emerald-500/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-black rounded-b-xl" />
              <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Receiver</p>
              <div className="w-full h-24 bg-emerald-500/10 rounded-2xl flex flex-col items-center justify-center border border-emerald-500/20 mt-5 mb-4">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mb-1" />
                <p className="text-emerald-400 text-[10px] font-bold">Signature Verified</p>
              </div>
              <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-xl mb-3 border border-white/[0.05]">
                <span className="text-xs text-slate-500">Balance</span>
                <span className="font-bold text-white">₹14,500</span>
              </div>
              <div className="flex-1" />
              <div className="h-9 mt-4 w-full bg-emerald-600 rounded-xl flex items-center justify-center"><span className="text-white font-bold text-xs">Transfer Complete ✓</span></div>
            </div>
          </div>
        </Section>
      </div>

      {/* ═══════════════ 5 MODES ═══════════════ */}
      <Section className="py-24" id="modes">
        <SectionLabel text="Omnichannel" color="text-indigo-400" />
        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-center mb-6">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">5</span> Communication Channels
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg text-slate-400 text-center max-w-2xl mx-auto mb-16">
          Every sensor on your device becomes a payment terminal.
        </motion.p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {MODES.map((m, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ y: -8 }}
              className="rounded-3xl p-6 text-center border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-indigo-500/30 transition-colors">
              <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4 bg-indigo-500/10 text-indigo-400">{m.icon}</div>
              <h3 className="font-bold text-[15px] mb-1 text-white">{m.name}</h3>
              <span className={cls("inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] mb-3",
                m.status === "Live" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400")}>{m.status}</span>
              <p className="text-[11px] leading-relaxed text-slate-500 mb-3">{m.desc}</p>
              <div className="flex justify-between text-[10px] text-slate-600 border-t border-white/[0.04] pt-3 mt-auto">
                <span>{m.speed}</span><span>{m.range}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ PROTOCOL ═══════════════ */}
      <Section className="py-24" id="protocol">
        <SectionLabel text="Architecture" color="text-violet-400" />
        <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-center mb-6">
          The AURA <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Protocol</span>
        </motion.h2>
        <motion.p variants={fadeUp} className="text-lg text-slate-400 text-center max-w-2xl mx-auto mb-16">
          Five cryptographic steps. Zero internet. Complete security.
        </motion.p>

        <div className="max-w-4xl mx-auto space-y-4">
          {PROTOCOL.map((s, i) => (
            <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ x: 8 }}
              className="flex items-start gap-6 rounded-3xl p-6 md:p-8 border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl hover:border-white/[0.12] transition-all group">
              <div className={`w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br ${s.color} shadow-lg`}>
                <span className="text-white font-black text-lg">{s.n}</span>
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-indigo-400">{s.icon}</span>
                  <h3 className="font-bold text-xl text-white">{s.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-400">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ═══════════════ SECURITY ═══════════════ */}
      <Section className="py-24" id="security">
        <motion.div variants={fadeUp} className="rounded-[40px] p-10 sm:p-16 border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/8 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionLabel text="Zero Trust Security" color="text-indigo-400" />
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 leading-tight">
                Bank-Grade<br/>
                <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">Cryptography.</span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-10">
                Every layer is built on cryptographic proofs. From RSA-2048 token signing to ephemeral AES-256-GCM encryption — the same standard protecting classified infrastructure.
              </p>
              <div className="space-y-4">
                {[
                  "RSA-2048 token signatures with anti-replay nonces",
                  "AES-256-GCM per-session ephemeral encryption",
                  "JWT authentication with bcrypt password hashing",
                  "Real-time ML risk scoring on every transaction",
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">{item}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Encryption", value: "AES-256-GCM", icon: <Lock className="w-5 h-5" /> },
                { label: "Token Signing", value: "RSA-2048", icon: <Cpu className="w-5 h-5" /> },
                { label: "Authentication", value: "JWT + bcrypt", icon: <ShieldCheck className="w-5 h-5" /> },
                { label: "Anti-Replay", value: "Nonce + Expiry", icon: <RefreshCw className="w-5 h-5" /> },
                { label: "Risk Engine", value: "ML Scoring", icon: <BarChart3 className="w-5 h-5" /> },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeUp} custom={i} whileHover={{ scale: 1.02 }}
                  className="flex items-center justify-between p-5 rounded-2xl border border-white/[0.06] bg-white/[0.03] hover:border-indigo-500/20 transition-all cursor-default">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">{item.icon}</div>
                    <span className="text-sm font-semibold text-slate-300">{item.label}</span>
                  </div>
                  <span className="text-sm font-black text-white">{item.value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <Section className="py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-8 text-amber-400 gap-1">{[...Array(5)].map((_, i) => <Star key={i} fill="currentColor" className="w-5 h-5" />)}</div>
          <div className="h-56 relative">
            <AnimatePresence mode="wait">
              <motion.div key={activeT} initial={{ opacity: 0, y: 25 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -25 }} transition={{ duration: 0.5 }}
                className="absolute inset-0 flex flex-col items-center justify-center px-6">
                <p className="text-2xl sm:text-3xl font-medium leading-relaxed mb-8 text-slate-200">"{TESTIMONIALS[activeT].text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">{TESTIMONIALS[activeT].avatar}</div>
                  <div className="text-left"><h4 className="font-bold text-white">{TESTIMONIALS[activeT].name}</h4><p className="text-sm text-emerald-400 font-medium">{TESTIMONIALS[activeT].role}</p></div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="flex justify-center gap-2 mt-6">{TESTIMONIALS.map((_, i) => (<button key={i} onClick={() => setActiveT(i)} className={cls("h-2 rounded-full transition-all duration-300", activeT === i ? "bg-indigo-500 w-10" : "bg-white/10 w-2")} />))}</div>
        </div>
      </Section>

      {/* ═══════════════ CTA ═══════════════ */}
      <Section className="py-24 pb-32">
        <motion.div variants={fadeUp} className="relative rounded-[40px] overflow-hidden p-12 sm:p-24 text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-emerald-600" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L3N2Zz4=')] opacity-60" />
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-[80px]" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-emerald-400/20 rounded-full blur-[80px]" />

          <div className="relative z-10">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white mb-6 leading-tight">
              The Future of Payments<br className="hidden sm:block" /> is Offline.
            </h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-12 font-medium">
              Join the revolution. Secure your assets in an air-gapped cryptographic engine.
            </p>
            <button onClick={() => navigate("/auth")} className="pulse-glow px-12 py-5 bg-white text-indigo-700 rounded-full font-black text-xl hover:scale-[1.03] transition-transform shadow-2xl flex items-center gap-3 mx-auto">
              Get Started for Free <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </Section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="relative z-10 px-6 sm:px-10 py-12 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center"><span className="text-white text-xs font-black">Ω</span></div>
            <span className="font-black">AURA Protocol</span>
            <span className="text-xs text-slate-600">© 2026</span>
          </div>
          <div className="flex flex-wrap gap-8 text-sm font-medium text-slate-500">
            {["Documentation", "Security Audit", "Whitepaper", "Privacy"].map(t => (<span key={t} className="hover:text-indigo-400 cursor-pointer transition-colors">{t}</span>))}
          </div>
        </div>
      </footer>
    </div>
  );
}