import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { ShieldCheck, User, Fingerprint, Lock, CheckCircle2, AlertTriangle, Phone, FileText, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfile, updateProfile, setPin } from "../api/api";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editPhone, setEditPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  // KYC Form State
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycDocType, setKycDocType] = useState("aadhaar");
  const [kycDocNumber, setKycDocNumber] = useState("");
  const [kycFullName, setKycFullName] = useState("");
  const [kycDob, setKycDob] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);

  useEffect(() => {
    getProfile()
      .then(data => {
        setUser(data);
        setPhoneInput(data.phone_number || "");
      })
      .catch(err => console.error("Profile load error:", err))
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleSavePhone = async () => {
    setSaving(true);
    try {
      const updated = await updateProfile({ phone_number: phoneInput });
      setUser(updated);
      setEditPhone(false);
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleKycSubmit = (e) => {
    e.preventDefault();
    setKycSubmitting(true);

    const aadhaarRegex = /^\d{12}$/;
    const panRegex = /^[A-Z]{5}\d{4}[A-Z]$/;

    if (kycDocType === "aadhaar" && !aadhaarRegex.test(kycDocNumber)) {
      alert("Invalid Aadhaar number. Must be 12 digits.");
      setKycSubmitting(false);
      return;
    }
    if (kycDocType === "pan" && !panRegex.test(kycDocNumber.toUpperCase())) {
      alert("Invalid PAN number. Must be format: ABCDE1234F");
      setKycSubmitting(false);
      return;
    }

    // Simulate backend verification delay
    setTimeout(() => {
      setUser(prev => ({ ...prev, kyc_status: "verified" }));
      setShowKycForm(false);
      setKycSubmitting(false);
    }, 2000);
  };

  const handleAppLockToggle = async () => {
    const newVal = !user.app_lock_enabled;
    setUser(prev => ({ ...prev, app_lock_enabled: newVal }));
    try {
      await updateProfile({ app_lock_enabled: newVal });
    } catch (err) {
      // Revert on failure
      setUser(prev => ({ ...prev, app_lock_enabled: !newVal }));
      console.error("Failed to update app lock:", err);
    }
  };

  if (loadingProfile) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className={cls("text-lg font-semibold", T.text(dark))}>Unable to load profile. Please log in again.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className={cls("text-2xl font-bold tracking-tight", T.text(dark))}>Profile & Security</h1>
        <p className={cls("mt-1 text-sm font-medium", T.muted(dark))}>Manage your identity and app security policies</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Col 1: Identity */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-5 border-b pb-6" style={{ borderColor: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
              <div className={cls("w-16 h-16 rounded-full flex items-center justify-center shadow-inner", dark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500")}>
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className={cls("text-xl font-bold tracking-tight", T.text(dark))}>{user.full_name}</h2>
                <p className={cls("text-[15px] font-medium mt-0.5", T.subtle(dark))}>{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <Badge variant={user.kyc_status === "verified" ? "success" : "warning"}>
                    {user.kyc_status === "verified" ? "KYC Verified" : "KYC Pending"}
                  </Badge>
                  {user.has_transaction_pin && <Badge variant="default">PIN Set</Badge>}
                </div>
              </div>
            </div>

            <div className="pt-6 space-y-4">
               <div>
                 <label className={cls("block text-xs font-semibold uppercase tracking-wider mb-2", T.subtle(dark))}>Phone Number</label>
                 <div className="flex gap-3">
                   {editPhone ? (
                     <>
                       <Input 
                         value={phoneInput} 
                         onChange={e => setPhoneInput(e.target.value)} 
                         className="flex-1" 
                         icon={<Phone className="w-4 h-4"/>} 
                         placeholder="+91 98765 43210"
                       />
                       <Button variant="primary" onClick={handleSavePhone} disabled={saving}>
                         {saving ? "Saving…" : "Save"}
                       </Button>
                       <Button variant="ghost" onClick={() => { setEditPhone(false); setPhoneInput(user.phone_number || ""); }}>Cancel</Button>
                     </>
                   ) : (
                     <>
                       <Input value={user.phone_number || "Not set"} readOnly className="flex-1 bg-transparent" icon={<Phone className="w-4 h-4"/>} />
                       <Button variant="secondary" onClick={() => setEditPhone(true)}>Update</Button>
                     </>
                   )}
                 </div>
               </div>
               
               <div>
                 <label className={cls("block text-xs font-semibold uppercase tracking-wider mb-2", T.subtle(dark))}>KYC Document (Aadhaar/PAN)</label>
                 {user.kyc_status === "verified" ? (
                   <div className={cls("flex items-center gap-3 p-4 rounded-xl border backdrop-blur-sm", dark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50 border-emerald-200")}>
                     <CheckCircle2 className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                     <div>
                       <p className="text-sm font-bold text-emerald-500">Identity Verified</p>
                       <p className={cls("text-xs font-medium mt-0.5", dark ? "text-emerald-200/70" : "text-emerald-700")}>Your document is linked and verified. Full AURA wallet limits activated.</p>
                     </div>
                   </div>
                 ) : !showKycForm ? (
                   <div className={cls("flex items-center justify-between p-4 rounded-xl border", dark ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0" />
                        <div>
                           <p className="text-sm font-bold text-amber-500">KYC Pending</p>
                           <p className={cls("text-xs font-medium mt-0.5", dark ? "text-amber-200/70" : "text-amber-700")}>Complete KYC to unlock ₹1,00,000 wallet limit.</p>
                        </div>
                      </div>
                      <Button variant="primary" size="sm" onClick={() => setShowKycForm(true)}>Complete Now</Button>
                   </div>
                 ) : (
                   /* ─── KYC VERIFICATION FORM ─── */
                   <Card className="p-5 border-2 border-indigo-500/30">
                     <div className="flex items-center gap-3 mb-5">
                       <div className={cls("w-9 h-9 rounded-lg flex items-center justify-center", dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                         <FileText className="w-5 h-5" />
                       </div>
                       <div>
                         <p className={cls("text-sm font-bold", T.text(dark))}>KYC Verification</p>
                         <p className={cls("text-xs font-medium", T.muted(dark))}>Government-issued ID validation</p>
                       </div>
                     </div>

                     <form onSubmit={handleKycSubmit} className="space-y-4">
                       <div className={cls("flex p-1 rounded-lg", dark ? "bg-slate-800" : "bg-slate-100")}>
                         <button type="button" onClick={() => setKycDocType("aadhaar")} className={cls("flex-1 py-1.5 text-sm font-semibold rounded-md transition-all", kycDocType === "aadhaar" ? (dark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-900 shadow") : (dark ? "text-slate-400" : "text-slate-500"))}>Aadhaar</button>
                         <button type="button" onClick={() => setKycDocType("pan")} className={cls("flex-1 py-1.5 text-sm font-semibold rounded-md transition-all", kycDocType === "pan" ? (dark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-900 shadow") : (dark ? "text-slate-400" : "text-slate-500"))}>PAN Card</button>
                       </div>

                       <Input 
                         label="Full Name (as on document)" 
                         placeholder="e.g. Satoshi Nakamoto" 
                         required
                         value={kycFullName}
                         onChange={e => setKycFullName(e.target.value)}
                       />

                       <Input 
                         label={kycDocType === "aadhaar" ? "Aadhaar Number (12 digits)" : "PAN Number"}
                         placeholder={kycDocType === "aadhaar" ? "XXXX XXXX XXXX" : "ABCDE1234F"}
                         required
                         value={kycDocNumber}
                         onChange={e => setKycDocNumber(e.target.value)}
                       />

                       <Input 
                         label="Date of Birth"
                         type="date"
                         required
                         value={kycDob}
                         onChange={e => setKycDob(e.target.value)}
                       />

                       <div className="flex gap-3 pt-2">
                         <Button variant="secondary" type="button" className="flex-1" onClick={() => setShowKycForm(false)}>Cancel</Button>
                         <Button variant="primary" type="submit" className="flex-1" disabled={kycSubmitting}>
                           {kycSubmitting ? (
                             <span className="flex items-center gap-2">
                               <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                               Verifying...
                             </span>
                           ) : "Verify Identity"}
                         </Button>
                       </div>
                     </form>
                   </Card>
                 )}
               </div>
            </div>
          </Card>
        </div>

        {/* Col 2: Security */}
        <div className="space-y-6">
          <Card className="p-6">
             <h3 className={cls("text-sm font-bold uppercase tracking-wider mb-5", T.subtle(dark))}>App Security</h3>
             
             <div className="space-y-6">
               <div className="flex items-start gap-4">
                 <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                   <Lock className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                   <p className={cls("text-[15px] font-bold", T.text(dark))}>Transaction PIN</p>
                   <p className={cls("text-xs font-medium mt-1 leading-relaxed mb-3", T.muted(dark))}>
                     {user.has_transaction_pin 
                       ? "6-digit code active for all offline transfers and wallet funding." 
                       : "Set a 6-digit PIN to secure your transactions."}
                   </p>
                   <Button variant="secondary" size="sm" className="w-full" onClick={() => navigate("/pin-setup")}>
                     {user.has_transaction_pin ? "Change PIN" : "Set PIN"}
                   </Button>
                 </div>
               </div>

               <div className={cls("h-px", T.divider(dark))} />

               <div className="flex items-start gap-4">
                 <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", dark ? "bg-emerald-500/20 text-emerald-500" : "bg-emerald-50 text-emerald-600")}>
                   <Fingerprint className="w-5 h-5" />
                 </div>
                 <div className="flex-1">
                   <div className="flex justify-between items-center mb-1">
                     <p className={cls("text-[15px] font-bold", T.text(dark))}>App Lock</p>
                     <button 
                       onClick={handleAppLockToggle}
                       className={cls("w-11 h-6 rounded-full relative transition-colors", user.app_lock_enabled ? "bg-indigo-500" : (dark ? "bg-slate-700" : "bg-slate-300"))}
                     >
                       <span className={cls("absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm", user.app_lock_enabled ? "left-6" : "left-1")} />
                     </button>
                   </div>
                   <p className={cls("text-xs font-medium leading-relaxed mb-3", T.muted(dark))}>Require Biometrics (FaceID/Fingerprint) to open AURA.</p>
                 </div>
               </div>
             </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
