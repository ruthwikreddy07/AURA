import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Scanner } from "@yudiel/react-qr-scanner";
import { submitMotionProof, submitPaymentPacket } from "../api/api";

import { ArrowDown, Inbox, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import { useState, useEffect } from "react";
import { Skeleton } from "../components/ui/Skeleton";
import ModeBadge from "../components/ui/ModeBadge";
import HandshakeIndicator from "../components/ui/HandshakeIndicator";

// ─────────────────────────────────────────────────────────────
// PAGE: RECEIVE PAYMENT (AURA Protocol)
// ─────────────────────────────────────────────────────────────
export default function ReceivePage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [recvState, setRecvState] = useState("listening"); // listening | detecting | verifying | success
  const [countdown, setCountdown] = useState(60);
  const [activeMode, setActiveMode] = useState("QR"); // Default to QR for Phase 2

  useEffect(() => {
    if (recvState !== "listening") return;
    if (countdown <= 0) { setRecvState("listening"); setCountdown(60); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, recvState]);

  const simulateReceive = async () => {
    // Left empty for now, as we're building the real QR scanner
  };

  const handleScan = async (result) => {
    if (!result || !result[0] || !result[0].rawValue) return;
    
    // Determine if we've already started processing to prevent duplicate scans
    if (recvState !== "listening") return;
    setRecvState("detecting");

    try {
      // 1. Parse the packet from the QR code
      const qrPayload = JSON.parse(result[0].rawValue);
      const { s: sessionId, n: nonce, c: ciphertext } = qrPayload;

      // 2. Submit Receiver Motion Proof
      await submitMotionProof({
        session_id: sessionId,
        user_id: localStorage.getItem("user_id"),
        motion_hash: "receiver-motion-qr-ok"
      });

      setRecvState("verifying");

      // 3. Submit Packet for Backend Decryption & Settlement
      await submitPaymentPacket({
        session_id: sessionId,
        nonce: nonce,
        ciphertext: ciphertext
      });

      setRecvState("success");

    } catch (e) {
      console.error("Failed to process QR code", e);
      setRecvState("listening"); // Reset on error
    }
  };

  if (loading) return <div className="p-6 grid lg:grid-cols-2 gap-5"><Skeleton className="h-72 rounded-2xl" /><Skeleton className="h-72 rounded-2xl" /></div>;

  const countdownPct = (countdown / 60) * 100;
  const circumference = 2 * Math.PI * 44;

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Left: QR + Handshake */}
        <Card className="p-7" glow>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center", dark ? "bg-indigo-500/20" : "bg-indigo-50")}>
                <Inbox className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className={cls("font-bold text-[17px] tracking-tight", dark ? "text-slate-100" : "text-slate-900")}>
                  {recvState === "listening" && "Listening for payment…"}
                  {recvState === "detecting" && "Signal detected…"}
                  {recvState === "verifying" && "Verifying token…"}
                  {recvState === "success" && "Payment received!"}
                </p>
                <p className={cls("text-[13px] font-medium", dark ? "text-slate-400" : "text-slate-500")}>AURA Protocol · Passive mode</p>
              </div>
            </div>
            <ModeBadge mode={activeMode} active />
          </div>

          {/* QR Scanner WebRTC Feed */}
          {recvState === "listening" && activeMode === "QR" && (
            <div className={cls("relative rounded-2xl overflow-hidden aspect-square max-w-[280px] mx-auto border-2", dark ? "border-indigo-500/30 bg-slate-800/60" : "border-indigo-200 bg-indigo-50/50")}>
               <Scanner
                  onScan={handleScan}
                  formats={["qr_code"]}
                  components={{ audio: false, finder: false }}
                  styles={{ container: { width: "100%", height: "100%" } }}
               />
               
              <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-xl pointer-events-none" />
              {/* Corner markers */}
              {["top-4 left-4", "top-4 right-4", "bottom-4 left-4", "bottom-4 right-4"].map((pos, i) => (
                <div key={i} className={cls("absolute w-8 h-8 border-4 border-indigo-500 rounded-sm", pos,
                  i === 0 ? "border-r-0 border-b-0" : i === 1 ? "border-l-0 border-b-0" : i === 2 ? "border-r-0 border-t-0" : "border-l-0 border-t-0")} />
              ))}
            </div>
          )}

          {/* Legacy Mock UI for BLE/NFC */}
          {recvState === "listening" && activeMode !== "QR" && (
            <div className={cls("relative rounded-2xl overflow-hidden flex items-center justify-center aspect-square max-w-[240px] mx-auto border-2", dark ? "border-indigo-500/30 bg-slate-800/60" : "border-indigo-200 bg-indigo-50/50")}>
              {/* QR grid simulation */}
              <div className="absolute inset-4 grid grid-cols-7 gap-1 opacity-80">
                {Array.from({ length: 49 }).map((_, i) => {
                  const isCorner = [0, 1, 7, 8, 6, 13, 42, 43, 48, 47, 41, 35].includes(i);
                  const isFilled = isCorner || Math.random() > 0.55;
                  return <div key={i} className={cls("rounded-sm aspect-square", isFilled ? (dark ? "bg-indigo-300" : "bg-indigo-600") : "bg-transparent")} />;
                })}
              </div>
              {/* Scan line animation */}
              <div className={cls("absolute left-2 right-2 h-0.5 rounded-full", dark ? "bg-indigo-400/60" : "bg-indigo-500/50")}
                style={{ animation: "scanline 2s ease-in-out infinite", top: "50%" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cls("w-12 h-12 rounded-xl flex items-center justify-center shadow-xl", dark ? "bg-slate-900/80" : "bg-white/80")}>
                  <span className="text-[10px] font-black text-indigo-600">Ω</span>
                </div>
              </div>
              {/* Corner markers */}
              {["top-2 left-2", "top-2 right-2", "bottom-2 left-2", "bottom-2 right-2"].map((pos, i) => (
                <div key={i} className={cls("absolute w-6 h-6 border-2 rounded-sm", pos, dark ? "border-indigo-400" : "border-indigo-500",
                  i === 0 ? "border-r-0 border-b-0" : i === 1 ? "border-l-0 border-b-0" : i === 2 ? "border-r-0 border-t-0" : "border-l-0 border-t-0")} />
              ))}
            </div>
          )}

          {/* Detection / Verification state */}
          {(recvState === "detecting" || recvState === "verifying") && (
            <div className="flex items-center justify-center py-8">
              <HandshakeIndicator state={recvState === "detecting" ? "connecting" : "handshake"} />
            </div>
          )}

          {/* Success state */}
          {recvState === "success" && (
            <div className={cls("rounded-2xl p-6 text-center border", dark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <p className={cls("font-black text-[32px] tracking-tight", dark ? "text-emerald-300" : "text-emerald-700")}>₹2,400</p>
              <p className="text-emerald-500 font-bold text-[15px] mt-1">Received via BLE</p>
              <p className={cls("text-[13px] font-medium mt-1", dark ? "text-emerald-400/80" : "text-emerald-600")}>From: Arjun K. · Token verified · {new Date().toLocaleTimeString()}</p>
              <Button variant="primary" size="md" className="mt-5" onClick={() => { setRecvState("listening"); setCountdown(60); }}>Receive Another</Button>
            </div>
          )}

          {/* Mode selector */}
          <div className="mt-5 space-y-3">
            <p className={cls("text-[13px] font-semibold", dark ? "text-slate-400" : "text-slate-500")}>Receiving on</p>
            <div className="flex gap-2 flex-wrap">
              {["QR", "BLE", "NFC", "Sound"].map(m => (
                <button key={m} onClick={() => setActiveMode(m)} aria-pressed={activeMode === m} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg transition-transform active:scale-95">
                  <ModeBadge mode={m} active={activeMode === m} size="sm" />
                </button>
              ))}
            </div>
          </div>

          {/* Demo trigger for non-camera modes */}
          {recvState === "listening" && activeMode !== "QR" && (
            <Button variant="ghost" size="sm" className="mt-4 w-full" onClick={simulateReceive}>Simulate incoming payment →</Button>
          )}
        </Card>

        {/* Right: Countdown + verification status */}
        <div className="space-y-5">
          <Card className="p-6">
            <p className={cls("font-semibold text-[15px] mb-5", dark ? "text-slate-100" : "text-slate-900")}>Session Timer</p>
            <div className="flex items-center justify-center" role="timer" aria-label={`${countdown} seconds remaining`}>
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="44" fill="none" stroke={dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} strokeWidth="6" />
                  <circle cx="50" cy="50" r="44" fill="none"
                    stroke={countdown > 15 ? "#4F46E5" : "#EF4444"}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - countdownPct / 100)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className={cls("text-[32px] font-black tabular-nums tracking-tight", countdown <= 15 ? "text-red-500" : (dark ? "text-slate-100" : "text-slate-900"))}>{countdown}s</p>
                  <p className={cls("text-[11px] font-bold uppercase tracking-widest", dark ? "text-slate-500" : "text-slate-400")}>remaining</p>
                </div>
              </div>
            </div>
            <Button variant="secondary" size="md" className="w-full mt-5" onClick={() => setCountdown(60)}>
              <RefreshCw className="w-4 h-4" /> Reset Session
            </Button>
          </Card>

          <Card className="p-6">
            <p className={cls("font-semibold text-[15px] mb-5", dark ? "text-slate-100" : "text-slate-900")}>Token Verification Status</p>
            <div className="space-y-3" role="list">
              {[
                { label: "Channel Encryption", status: "success", val: "AES-256 Active" },
                { label: "Token Validity", status: recvState === "verifying" || recvState === "success" ? "success" : "pending", val: recvState === "success" ? "Verified" : recvState === "verifying" ? "Checking…" : "Awaiting" },
                { label: "Anti-replay Check", status: recvState === "success" ? "success" : "pending", val: recvState === "success" ? "Passed" : "Pending" },
                { label: "Entropy Validation", status: recvState === "success" ? "success" : "pending", val: recvState === "success" ? "128-bit OK" : "Pending" },
              ].map((item, i) => (
                <div key={i} role="listitem" className={cls("flex items-center justify-between p-3 rounded-xl", dark ? "bg-slate-800/40" : "bg-slate-50")}>
                  <span className={cls("text-[13px] font-semibold", dark ? "text-slate-300" : "text-slate-600")}>{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    {item.status === "pending" && <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />}
                    <span className={cls("text-[13px] font-bold", item.status === "success" ? "text-emerald-500" : "text-amber-400")}>{item.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}