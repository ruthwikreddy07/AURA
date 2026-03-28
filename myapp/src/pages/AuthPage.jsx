import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { User, Phone, Mail, Lock, KeyRound, QrCode, Smartphone, ShieldAlert } from "lucide-react";
import QRCode from "react-qr-code";
import { requestOtp, verifyOtp, completeProfile, generateQrSession, checkQrSession } from "../api/api";

export default function AuthPage() {
  const navigate = useNavigate();
  
  // Login Method: 'phone' or 'qr'
  const [loginMethod, setLoginMethod] = useState("qr");

  // Steps: 'phone' -> 'otp' -> 'profile' (or just 'qr' if method is qr) -> 'admin'
  const [step, setStep] = useState("qr");

  // Admin login state
  const [adminEmail, setAdminEmail] = useState("admin@aura.network");
  const [adminPassword, setAdminPassword] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Form State
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Storage for keys before profile completion
  const [deviceKeys, setDeviceKeys] = useState(null);

  // QR Session State
  const [qrSessionId, setQrSessionId] = useState(null);
  const pollingInterval = useRef(null);

  // Switch between QR and Phone seamlessly
  useEffect(() => {
    if (loginMethod === "qr") {
      setStep("qr");
      initializeQrSession();
    } else {
      setStep("phone");
      stopPolling();
    }
    return () => stopPolling();
  }, [loginMethod]);

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const initializeQrSession = async () => {
    try {
      setLoading(true);
      const res = await generateQrSession();
      setQrSessionId(res.session_id);
      
      // Start polling for approval
      pollingInterval.current = setInterval(async () => {
        try {
          const statusRes = await checkQrSession(res.session_id);
          if (statusRes.status === "approved" && statusRes.access_token) {
            stopPolling();
            await saveTokensAndRoute(statusRes.access_token, statusRes.user_id, null);
          } else if (statusRes.status === "expired") {
            stopPolling();
            setQrSessionId(null);
            setErrorMsg("QR Code expired. Please refresh.");
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
      
    } catch (err) {
      setErrorMsg("Failed to generate QR Code. " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!phoneNumber || phoneNumber.length < 8) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }

    const fullPhone = `${countryCode}${phoneNumber}`;
    setLoading(true);
    try {
      await requestOtp({ phone_number: fullPhone });
      setStep("otp");
    } catch (err) {
      setErrorMsg(err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!otp || otp.length < 4) {
      setErrorMsg("Please enter the OTP.");
      return;
    }

    setLoading(true);
    try {
      // 1. Generate Fake RSA Device Keys (In real app, use WebCrypto API)
      const deviceId = crypto.randomUUID();
      const mockPublicKey = `pub_key_${deviceId}`; 
      const mockPrivateKey = `priv_key_${deviceId}`; 
      
      setDeviceKeys({ deviceId, publicKey: mockPublicKey, privateKey: mockPrivateKey });

      // 2. Verify OTP
      const fullPhone = `${countryCode}${phoneNumber}`;
      const res = await verifyOtp({ 
        phone_number: fullPhone, 
        otp,
        device_id: deviceId,
        device_public_key: mockPublicKey
      });

      if (res.is_new_user) {
        setStep("profile");
      } else {
        await saveTokensAndRoute(res.access_token, res.user_id, mockPrivateKey);
      }
    } catch (err) {
      setErrorMsg(err.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!fullName.trim()) {
      setErrorMsg("Full name is required.");
      return;
    }
    if (pin.length < 4 || pin.length > 6) {
      setErrorMsg("PIN must be 4 to 6 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg("PINs do not match.");
      return;
    }

    setLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber}`;
      const res = await completeProfile({
        phone_number: fullPhone,
        full_name: fullName,
        email: email || null,
        app_pin: pin,
        device_id: deviceKeys.deviceId,
        device_public_key: deviceKeys.publicKey
      });

      await saveTokensAndRoute(res.access_token, res.id, deviceKeys.privateKey);
    } catch (err) {
      setErrorMsg(err.message || "Failed to complete setup.");
    } finally {
      setLoading(false);
    }
  };

  const saveTokensAndRoute = async (token, userId, privateKey) => {
    if (userId) localStorage.setItem("user_id", userId);
    if (token) localStorage.setItem("auth_token", token);
    if (privateKey) localStorage.setItem("device_private_key", privateKey);
    navigate("/app/overview");
  };

  // Admin Login Handler
  const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!adminEmail || !adminPassword) {
      setErrorMsg("Email and password are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid credentials.");
      }
      const data = await res.json();
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_id", data.user_id);
      localStorage.setItem("admin_name", data.full_name);
      navigate("/admin/dashboard");
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030014] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px]" />
      </div>

      <motion.main 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }} 
        className="relative w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(79,70,229,0.3)] backdrop-blur-md">
            <span className="text-white text-3xl font-black">Ω</span>
          </div>
          <h1 className="text-[32px] font-black text-white tracking-tight mb-2">
            {step === "qr" && "Quick Login"}
            {step === "phone" && "Enter AURA"}
            {step === "otp" && "Verify Number"}
            {step === "profile" && "Secure Vault"}
            {step === "admin" && "Command Center"}
          </h1>
          <p className="text-slate-400 text-[15px] font-medium px-4">
            {step === "qr" && "Scan with the AURA mobile app to instantly login securely."}
            {step === "phone" && "Your phone number is your universal offline identity."}
            {step === "otp" && "Enter the 6-digit code sent to your device."}
            {step === "profile" && "Setup your offline PIN to encrypt your local hardware vault."}
            {step === "admin" && "Restricted access for system administrators only."}
          </p>
        </div>

        {/* Tab Switcher (Only show if not mid-flow) */}
        {(step === "phone" || step === "qr") && (
          <div className="flex p-1 bg-white/5 border border-white/10 rounded-2xl mb-6 backdrop-blur-md">
            <button 
              onClick={() => setLoginMethod("qr")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${loginMethod === 'qr' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <QrCode className="w-4 h-4" /> QR Login
            </button>
            <button 
              onClick={() => setLoginMethod("phone")}
              className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${loginMethod === 'phone' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              <Smartphone className="w-4 h-4" /> Phone Number
            </button>
          </div>
        )}

        <div className={`bg-white/5 border rounded-[32px] p-8 backdrop-blur-xl shadow-2xl relative transition-all duration-500 ${step === "admin" ? "border-red-500/30 shadow-[0_0_40px_rgba(220,38,38,0.15)]" : "border-white/10"}`}>
          
          {errorMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[14px] font-semibold text-center">
              {errorMsg}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            
            {/* STEP 0: QR LOGIN */}
            {step === "qr" && (
              <motion.div key="qr" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="flex flex-col items-center justify-center py-4">
                <div className="p-4 bg-white rounded-3xl shadow-2xl mb-6">
                  {qrSessionId ? (
                    <QRCode
                      value={qrSessionId}
                      size={200}
                      level="H"
                      fgColor="#000000"
                      bgColor="#ffffff"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-100 rounded-2xl animate-pulse">
                      <span className="text-slate-400 font-semibold">Generating...</span>
                    </div>
                  )}
                </div>
                
                <p className="text-slate-300 text-center font-medium leading-relaxed">
                  1. Open the <strong className="text-white">AURA Mobile App</strong><br/>
                  2. Head to the <strong className="text-white">More</strong> tab<br/>
                  3. Tap <strong className="text-indigo-400">Scan Web QR</strong>
                </p>

                {qrSessionId === null && !loading && (
                   <button onClick={initializeQrSession} className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
                     Reload QR Code
                   </button>
                )}
              </motion.div>
            )}

            {/* STEP 1: PHONE */}
            {step === "phone" && (
              <motion.form key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleRequestOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Phone Number</label>
                  <div className="flex bg-black/40 border border-white/10 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                    <select 
                      value={countryCode} 
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-transparent text-white font-medium pl-4 pr-2 py-3.5 border-r border-white/10 focus:outline-none appearance-none"
                    >
                      <option value="+91" className="bg-slate-900 w-12 text-center text-white">IN (+91)</option>
                      <option value="+1" className="bg-slate-900 w-12 text-center text-white">US (+1)</option>
                      <option value="+44" className="bg-slate-900 w-12 text-center text-white">UK (+44)</option>
                      <option value="+61" className="bg-slate-900 w-12 text-center text-white">AU (+61)</option>
                      <option value="+971" className="bg-slate-900 w-12 text-center text-white">AE (+971)</option>
                    </select>
                    <input type="tel" placeholder="98765 43210" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))} autoFocus
                      className="flex-1 bg-transparent px-4 py-3.5 text-[16px] font-medium text-white placeholder-slate-500 focus:outline-none" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[16px] rounded-2xl py-4 transition-all duration-200 active:scale-[0.98] shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50">
                  {loading ? "Connecting..." : "Send Verification Code"}
                </button>
              </motion.form>
            )}

            {/* STEP: ADMIN LOGIN */}
            {step === "admin" && (
              <motion.form key="admin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Admin Email</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Mail className="w-5 h-5" /></span>
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} autoFocus
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-[15px] font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-5 h-5" /></span>
                    <input type="password" placeholder="••••••••" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-[15px] font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-bold text-[16px] rounded-2xl py-4 transition-all duration-200 active:scale-[0.98] shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50">
                  {loading ? "Authenticating..." : "Access Command Center"}
                </button>
              </motion.form>
            )}


            {/* STEP 2: OTP */}
            {step === "otp" && (
              <motion.form key="otp" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">6-Digit Code</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><KeyRound className="w-5 h-5" /></span>
                    <input type="text" placeholder="123456" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} autoFocus
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-[18px] tracking-[0.2em] font-black text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[16px] rounded-2xl py-4 transition-all duration-200 active:scale-[0.98] shadow-[0_0_20px_rgba(79,70,229,0.4)] disabled:opacity-50">
                  {loading ? "Generating Keys..." : "Verify Identity"}
                </button>
                <div className="text-center mt-6">
                  <button type="button" onClick={() => setStep("phone")} className="text-sm text-slate-400 font-medium hover:text-indigo-400 transition-colors">
                    Edit phone number
                  </button>
                </div>
              </motion.form>
            )}

            {/* STEP 3: PROFILE */}
            {step === "profile" && (
              <motion.form key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleCompleteProfile} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-300 ml-1">Full Name (As per Bank)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><User className="w-5 h-5" /></span>
                    <input type="text" placeholder="Arjun Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-[15px] font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Offline PIN (6-digit)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-4 h-4" /></span>
                      <input type="password" placeholder="••••••" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-[18px] tracking-[0.2em] font-black text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-300 ml-1">Confirm PIN</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Lock className="w-4 h-4" /></span>
                      <input type="password" placeholder="••••••" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} maxLength={6}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-[18px] tracking-[0.2em] font-black text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-center" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[16px] rounded-2xl py-4 transition-all duration-200 active:scale-[0.98] shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-50">
                  {loading ? "Encrypting Vault..." : "Initialize Profile"}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Global Footer Links */}
        <div className="mt-8 flex justify-center border-t border-white/10 pt-6">
          {step === "admin" ? (
             <button onClick={() => { setStep("qr"); setLoginMethod("qr"); setErrorMsg(""); }} className="text-sm font-semibold text-slate-500 hover:text-slate-300 transition-colors">
               ← Return to Consumer Login
             </button>
          ) : (
            <button onClick={() => { setStep("admin"); stopPolling(); setErrorMsg(""); }} className="text-[13px] font-bold tracking-widest uppercase text-slate-600 hover:text-red-500 transition-colors flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" /> Staff Gateway
            </button>
          )}
        </div>
      </motion.main>
    </div>
  );
}