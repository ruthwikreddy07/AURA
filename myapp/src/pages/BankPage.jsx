import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import { useState, useEffect } from "react";
import { Building2, PlusCircle, CheckCircle2, ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserBanks, linkBank, removeBank } from "../api/api";
import usePageLoad from "../hooks/usePageLoad";

export default function BankPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  
  const [banks, setBanks] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [linkMethod, setLinkMethod] = useState("upi"); // upi or account
  
  const [formData, setFormData] = useState({ bank_name: "HDFC Bank", account_name: "John Doe", account_number: "", ifsc: "", upi_id: "" });
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;
      const data = await getUserBanks(userId);
      setBanks(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLink = async (e) => {
    e.preventDefault();
    setIsLinking(true);
    
    // Simulate Razorpay/Bank Gateway Delay
    setTimeout(async () => {
      try {
        await linkBank({
          bank_name: formData.bank_name,
          account_name: formData.account_name,
          account_number_masked: linkMethod === "upi" ? "••••" + Math.floor(1000 + Math.random() * 9000) : "••••" + formData.account_number.slice(-4),
          ifsc_code: formData.ifsc,
          upi_id: formData.upi_id
        });
        
        setShowAddModal(false);
        setFormData({ bank_name: "HDFC Bank", account_name: "John Doe", account_number: "", ifsc: "", upi_id: "" });
        fetchBanks();
      } catch (err) {
        console.error("Failed to link bank", err);
      } finally {
        setIsLinking(false);
      }
    }, 1500);
  };

  const handleRemove = async (id) => {
    if (confirm("Remove this bank account?")) {
      try {
        await removeBank(id);
        fetchBanks();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) return null; // Skeleton in real app

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className={cls("text-2xl font-bold tracking-tight", T.text(dark))}>Bank Accounts</h1>
          <p className={cls("mt-1 text-sm font-medium", T.muted(dark))}>Manage linked accounts for funding your offline wallet</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <PlusCircle className="w-5 h-5 mr-1" /> Add Bank
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <AnimatePresence>
          {banks.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="lg:col-span-2">
              <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                <div className={cls("w-16 h-16 rounded-full flex items-center justify-center mb-4", dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500")}>
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className={cls("text-lg font-bold mb-1", T.text(dark))}>No banks linked</h3>
                <p className={cls("text-sm max-w-sm mb-6", T.muted(dark))}>Link a bank account via UPI or Account Number to start loading funds into your offline AURA wallet.</p>
                <Button variant="secondary" onClick={() => setShowAddModal(true)}>Link your first bank</Button>
              </Card>
            </motion.div>
          )}

          {banks.map(bank => (
            <motion.div key={bank.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
              <Card className="p-6 overflow-hidden relative group">
                {/* Background Decor */}
                <div className={cls("absolute -right-10 -top-10 w-40 h-40 rounded-full blur-3xl opacity-20 pointer-events-none",
                  bank.is_primary ? "bg-indigo-500" : "bg-slate-500"
                )} />

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div className={cls("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner", dark ? "bg-slate-800" : "bg-white border")}>
                      <Building2 className={cls("w-6 h-6", bank.is_primary ? "text-indigo-500" : T.subtle(dark))} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className={cls("text-[17px] font-bold tracking-tight", T.text(dark))}>{bank.bank_name}</p>
                        {bank.is_primary && <Badge variant="success" size="sm">Primary</Badge>}
                      </div>
                      <p className={cls("text-[13px] font-medium mt-0.5 font-mono", T.muted(dark))}>{bank.account_number_masked}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleRemove(bank.id)} className={cls("p-2 rounded-lg text-red-500 transition-colors", dark ? "hover:bg-red-500/10" : "hover:bg-red-50")}>
                      Remove
                    </button>
                  </div>
                </div>

                <div className={cls("mt-6 pt-5 border-t flex items-center justify-between text-sm relative z-10", T.divider(dark))}>
                  <div className="flex items-center gap-2 text-emerald-500 font-medium">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </div>
                  <span className={cls("font-medium", T.subtle(dark))}>{bank.account_name}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add Bank Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isLinking && setShowAddModal(false)} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className={cls("relative w-full max-w-md rounded-2xl p-6 shadow-2xl overflow-hidden", dark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200")}>
               
               <button onClick={() => setShowAddModal(false)} className={cls("absolute top-4 right-4 p-2 rounded-full", dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}>
                 <X className="w-5 h-5" />
               </button>

               <div className="flex items-center gap-3 mb-6">
                 <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center", dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
                   <ShieldCheck className="w-5 h-5" />
                 </div>
                 <div>
                   <h2 className={cls("text-lg font-bold", T.text(dark))}>Secure Bank Link</h2>
                   <p className={cls("text-xs font-medium content", T.muted(dark))}>256-bit Encrypted connection</p>
                 </div>
               </div>

               <div className={cls("flex p-1 mb-6 rounded-lg", dark ? "bg-slate-800" : "bg-slate-100")}>
                 <button type="button" onClick={() => setLinkMethod("upi")} className={cls("flex-1 py-1.5 text-sm font-semibold rounded-md transition-all", linkMethod === "upi" ? (dark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-900 shadow") : (dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"))}>UPI ID</button>
                 <button type="button" onClick={() => setLinkMethod("account")} className={cls("flex-1 py-1.5 text-sm font-semibold rounded-md transition-all", linkMethod === "account" ? (dark ? "bg-slate-700 text-white shadow" : "bg-white text-slate-900 shadow") : (dark ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-900"))}>Bank Account</button>
               </div>

               <form onSubmit={handleLink} className="space-y-4">
                 <div>
                     <label className={cls("block text-sm font-medium mb-1.5", T.text(dark))}>Select Bank</label>
                     <select 
                       value={formData.bank_name} onChange={e => setFormData({...formData, bank_name: e.target.value})}
                       className={cls("w-full h-11 px-4 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow appearance-none font-medium", dark ? "bg-slate-800/50 border-slate-700/50 text-white" : "bg-white border-slate-200 text-slate-900")}
                     >
                       <option>HDFC Bank</option>
                       <option>ICICI Bank</option>
                       <option>State Bank of India</option>
                       <option>Axis Bank</option>
                       <option>Kotak Mahindra</option>
                     </select>
                 </div>

                 {linkMethod === "upi" ? (
                    <Input label="UPI ID" placeholder="example@okhdfcbank" value={formData.upi_id} onChange={e => setFormData({...formData, upi_id: e.target.value})} required />
                 ) : (
                    <>
                      <Input label="Account Number" placeholder="0000 0000 0000" type="text" inputMode="numeric" pattern="[0-9]{9,18}" minLength={9} maxLength={18} required value={formData.account_number} onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 18) val = val.slice(0, 18);
                        setFormData({...formData, account_number: val});
                      }} />
                      <Input label="IFSC Code" placeholder="HDFC0001234" pattern="^[A-Z]{4}0[A-Z0-9]{6}$" minLength={11} maxLength={11} required value={formData.ifsc} onChange={e => {
                        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (val.length > 11) val = val.slice(0, 11);
                        setFormData({...formData, ifsc: val});
                      }} />
                    </>
                 )}

                 <div className="pt-2">
                   <Button variant="primary" type="submit" className="w-full h-12 text-[15px] group" disabled={isLinking}>
                     {isLinking ? (
                       <span className="flex items-center justify-center gap-2">
                         <span className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                         Verifying with Bank...
                       </span>
                     ) : (
                       "Link Bank Account"
                     )}
                   </Button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
