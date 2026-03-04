import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import { createPaymentSession, submitPaymentPacket } from "../api/api";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

import { ArrowUp, Send, Gauge, CheckCircle2, X, AlertTriangle } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import { useState } from "react";
import { Skeleton } from "../components/ui/Skeleton";
import ModeBadge from "../components/ui/ModeBadge";
import RiskCard from "../components/ui/RiskCard";
import HandshakeIndicator from "../components/ui/HandshakeIndicator";

// ─────────────────────────────────────────────────────────────
// PAGE: SEND PAYMENT (AURA Protocol)
// ─────────────────────────────────────────────────────────────
export default function SendPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [step, setStep] = useState("input"); // input | searching | confirm | progress | success
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [activeMode, setActiveMode] = useState("BLE");

  const [progressVal, setProgressVal] = useState(0);
  const [session, setSession] = useState(null);
  const senderId = "00000000-0000-0000-0000-000000000001";
  const receiverId = "00000000-0000-0000-0000-000000000002";

  const handleSearch = async () => {

  if (!amount) return;

  setStep("searching");

  try {

    const sessionData = await createPaymentSession({
      sender_id: senderId,
      receiver_id: receiverId,
      mode: activeMode.toLowerCase()
    });

    setSession(sessionData);

    setTimeout(() => setStep("confirm"), 1200);

  } catch (err) {
    console.error("Session error", err);
    setStep("input");
  }

};
  const handleConfirm = async () => {

  if (!session) return;

  setStep("progress");
  setProgressVal(0);

  try {

    const payload = {
      sender_id: senderId,
      receiver_id: receiverId,
      token_id: "00000000-0000-0000-0000-000000000010",
      risk_score: riskScore / 100
    };

    const encryptedPacket = {
  session_id: session.session_id,
  nonce: btoa("nonce-demo"),
  ciphertext: btoa(JSON.stringify(payload))
};

    await submitPaymentPacket(encryptedPacket);

  } catch (err) {
    console.error("Payment error", err);
  }

  const interval = setInterval(() => {
    setProgressVal(p => {
      if (p >= 100) {
        clearInterval(interval);
        setStep("success");
        return 100;
      }
      return p + 8;
    });
  }, 120);

};
  const handleReset = () => { setStep("input"); setAmount(""); setNote(""); setProgressVal(0); };

  if (loading) return <div className="p-6 space-y-5"><Skeleton className="h-64 rounded-2xl" /><Skeleton className="h-48 rounded-2xl" /></div>;

  const riskScore = amount ? Math.max(5, Math.min(92, Math.round(100 - (Number(amount.replace(/,/g, "")) / 1000)))) : 12;
  const riskLevel = riskScore < 35 ? "Safe" : riskScore < 65 ? "Verify" : "High Risk";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Step: Input */}
      {step === "input" && (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 space-y-5">
            <Card className="p-7" glow>
              <div className="flex items-center gap-3 mb-7">
                <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center", dark ? "bg-indigo-500/20" : "bg-indigo-50")}>
                  <Send className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className={cls("font-bold text-[17px] tracking-tight", dark ? "text-slate-100" : "text-slate-900")}>Send Payment</p>
                  <p className={cls("text-[13px] font-medium", dark ? "text-slate-400" : "text-slate-500")}>AURA Adaptive Protocol · Auto-mode selection</p>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-2 mb-6">
                <label className={cls("text-sm font-semibold", dark ? "text-slate-300" : "text-slate-600")}>Amount</label>
                <div className="relative">
                  <span className={cls("absolute left-4 top-1/2 -translate-y-1/2 text-[22px] font-bold", dark ? "text-slate-300" : "text-slate-500")}>₹</span>
                  <input
                    type="text" placeholder="0" value={amount}
                    onChange={e => setAmount(e.target.value.replace(/[^0-9,]/g, ""))}
                    aria-label="Payment amount in rupees"
                    className={cls(
                      "w-full border rounded-2xl pl-10 pr-5 py-5 text-[36px] font-black tracking-tight transition-all",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:border-transparent",
                      dark ? "bg-slate-800/60 border-white/10 text-slate-100 placeholder-slate-600" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-300"
                    )}
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  {["500", "1,000", "2,000", "5,000"].map(q => (
                    <button key={q} onClick={() => setAmount(q)}
                      className={cls("px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 active:scale-95 border",
                        dark ? "bg-slate-800/60 border-white/10 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/30" : "bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200")}>
                      ₹{q}
                    </button>
                  ))}
                </div>
              </div>

              <Input label="Note (optional)" placeholder="e.g. Lunch, Rent…" name="send-note" value={note} onChange={e => setNote(e.target.value)} />

              {/* Active mode selector */}
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className={cls("text-sm font-semibold", dark ? "text-slate-300" : "text-slate-600")}>Communication Mode</p>
                  <span className={cls("text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg", dark ? "bg-indigo-500/15 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>Auto-Selected</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {["BLE", "Sound", "QR", "Light", "NFC"].map(m => (
                    <button key={m} onClick={() => setActiveMode(m)} aria-pressed={activeMode === m} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded-lg transition-transform active:scale-95">
                      <ModeBadge mode={m} active={activeMode === m} />
                    </button>
                  ))}
                </div>
              </div>

              <Button variant="primary" size="lg" className="w-full mt-8" onClick={handleSearch} disabled={!amount} ariaLabel="Initiate payment search">
                <Send className="w-5 h-5" /> Initiate Payment
              </Button>
            </Card>
          </div>

          {/* Risk Panel */}
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-5">
                <Gauge className="w-5 h-5 text-indigo-500" aria-hidden="true" />
                <p className={cls("font-semibold text-[15px]", dark ? "text-slate-100" : "text-slate-900")}>Risk Preview</p>
              </div>
              <RiskCard score={riskScore} level={riskLevel} />
              <div className={cls("mt-5 space-y-3 p-4 rounded-xl", dark ? "bg-slate-800/40" : "bg-slate-50")}>
                {[
                  { label: "Device Trust Score", val: "98.4%", ok: true },
                  { label: "Token Integrity", val: "Verified", ok: true },
                  { label: "Velocity Check", val: "Normal", ok: true },
                  { label: "Geo-fence Status", val: "Active", ok: true },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className={cls("text-[13px] font-medium", dark ? "text-slate-400" : "text-slate-500")}>{r.label}</span>
                    <span className={cls("text-[13px] font-bold flex items-center gap-1", r.ok ? "text-emerald-500" : "text-red-500")}>
                      {r.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />} {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <p className={cls("font-semibold text-[15px] mb-4", dark ? "text-slate-100" : "text-slate-900")}>Mode Score</p>
              <div className="space-y-3">
                {[
                  { mode: "BLE", score: 94, color: "blue" },
                  { mode: "NFC", score: 88, color: "indigo" },
                  { mode: "QR", score: 76, color: "emerald" },
                  { mode: "Sound", score: 61, color: "violet" },
                  { mode: "Light", score: 42, color: "amber" },
                ].map((ms, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <ModeBadge mode={ms.mode} active={ms.mode === activeMode} size="sm" />
                    <div className={cls("flex-1 h-2 rounded-full", dark ? "bg-slate-700/60" : "bg-slate-200")}>
                      <div className={cls("h-2 rounded-full transition-all duration-700",
                        ms.color === "blue" ? "bg-blue-500" : ms.color === "indigo" ? "bg-indigo-500" : ms.color === "emerald" ? "bg-emerald-500" : ms.color === "violet" ? "bg-violet-500" : "bg-amber-400"
                      )} style={{ width: `${ms.score}%` }} />
                    </div>
                    <span className={cls("text-[13px] font-bold w-8 text-right tabular-nums", dark ? "text-slate-300" : "text-slate-700")}>{ms.score}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Step: Searching */}
      {step === "searching" && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-12 text-center max-w-sm w-full" glow>
            <HandshakeIndicator state="searching" />
            <div className="mt-8 space-y-3">
              <p className={cls("font-bold text-[17px]", dark ? "text-slate-100" : "text-slate-900")}>Scanning for AURA devices</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {["BLE", "NFC", "Sound"].map(m => <ModeBadge key={m} mode={m} active={m === "BLE"} size="sm" />)}
              </div>
              <p className={cls("text-sm font-medium", dark ? "text-slate-400" : "text-slate-500")}>Hold device within 30cm of receiver</p>
            </div>
            <Button variant="ghost" size="md" className="mt-6 w-full" onClick={() => setStep("input")}>Cancel</Button>
          </Card>
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 max-w-md w-full space-y-6" glow>
            <div className="text-center">
              <div className={cls("w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4", dark ? "bg-emerald-500/15" : "bg-emerald-50")}>
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <p className={cls("font-bold text-[17px]", dark ? "text-slate-100" : "text-slate-900")}>Device Found · Ready to Send</p>
              <p className={cls("text-[13px] font-medium mt-1", dark ? "text-slate-400" : "text-slate-500")}>Samsung Galaxy S24 · 24cm · BLE channel secured</p>
            </div>

            {/* Transaction summary */}
            <div className={cls("rounded-2xl p-5 space-y-3", dark ? "bg-slate-800/50" : "bg-slate-50")}>
              {[
                { l: "Amount", v: `₹${amount}`, bold: true },
                { l: "To", v: "Nearby Device (DEV-0042)" },
                { l: "Channel", v: "BLE · Encrypted (AES-256)" },
                { l: "Token", v: "TKN-7821" },
                { l: "Note", v: note || "—" },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className={cls("text-[13px] font-medium", dark ? "text-slate-400" : "text-slate-500")}>{row.l}</span>
                  <span className={cls("text-[14px]", row.bold ? "font-black text-indigo-500" : (dark ? "text-slate-200 font-semibold" : "text-slate-800 font-semibold"))}>{row.v}</span>
                </div>
              ))}
            </div>

            <RiskCard score={riskScore} level={riskLevel} />

            <div className="flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setStep("input")}>Back</Button>
              <Button variant="primary" size="lg" className="flex-1" onClick={handleConfirm} disabled={riskLevel === "High Risk"} ariaLabel="Confirm and send payment">
                {riskLevel === "Verify" ? <><AlertTriangle className="w-4 h-4" /> Verify & Send</> : <><Send className="w-4 h-4" /> Confirm Send</>}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Step: Progress */}
      {step === "progress" && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-12 text-center max-w-sm w-full" glow>
            <HandshakeIndicator state={progressVal < 60 ? "connecting" : "handshake"} />
            <p className={cls("font-bold text-[17px] mt-6", dark ? "text-slate-100" : "text-slate-900")}>Transmitting ₹{amount}</p>
            <div className={cls("h-2.5 rounded-full mt-5", dark ? "bg-slate-700/60" : "bg-slate-200")}>
              <div className="h-2.5 rounded-full bg-indigo-500 transition-all duration-200 ease-out" style={{ width: `${progressVal}%` }} />
            </div>
            <p className={cls("text-sm font-semibold mt-3 tabular-nums", dark ? "text-slate-400" : "text-slate-500")}>{progressVal}% · Do not move device</p>
          </Card>
        </div>
      )}

      {/* Step: Success */}
      {step === "success" && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-10 text-center max-w-sm w-full" glow>
            <div className={cls("w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 shadow-inner", dark ? "bg-emerald-500/15" : "bg-emerald-50")}>
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <p className={cls("font-black text-[28px] tracking-tight", dark ? "text-slate-100" : "text-slate-900")}>₹{amount}</p>
            <p className="text-emerald-500 font-bold text-[17px] mt-1">Payment Sent</p>
            <p className={cls("text-[13px] font-medium mt-2", dark ? "text-slate-400" : "text-slate-500")}>via BLE · Token TKN-7821 · {new Date().toLocaleTimeString()}</p>

            <div className={cls("mt-6 p-4 rounded-2xl space-y-2 text-left", dark ? "bg-slate-800/50" : "bg-slate-50")}>
              {[
                { l: "Transaction ID", v: "TX" + Math.floor(Math.random() * 10000 + 9000) },
                { l: "Channel", v: "BLE · AES-256 Encrypted" },
                { l: "Sync Status", v: "Queued for sync" },
              ].map((r, i) => (
                <div key={i} className="flex justify-between">
                  <span className={cls("text-[13px] font-medium", dark ? "text-slate-400" : "text-slate-500")}>{r.l}</span>
                  <span className={cls("text-[13px] font-bold", dark ? "text-slate-200" : "text-slate-800")}>{r.v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="secondary" size="md" className="flex-1">Share Receipt</Button>
              <Button variant="primary" size="md" className="flex-1" onClick={handleReset}>New Payment</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}