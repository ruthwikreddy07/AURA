import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import { getUserWallets, getUserBanks, fundWallet, withdrawWallet } from "../api/api";
import { useEffect, useState } from "react";

import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

import { Wallet, AlertTriangle, PlusCircle, ArrowUp, ArrowDown } from "lucide-react";
import usePageLoad from "../hooks/usePageLoad";
import { Skeleton } from "../components/ui/Skeleton";
import PinEntryModal from "../components/PinEntryModal";
// ─────────────────────────────────────────────────────────────
// PAGE: WALLET
// ─────────────────────────────────────────────────────────────
export default function WalletPage() {
  const { dark } = useTheme();
  const loading = usePageLoad();
  const [wallets, setWallets] = useState([]);
  const [allocation, setAllocation] = useState(40);
  
  // Funding state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [fundingAmount, setFundingAmount] = useState(1000);
  const [actionType, setActionType] = useState(null); // 'fund' or 'withdraw'
  const [banks, setBanks] = useState([]);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", msg: "" });

  const LIMIT = 50000;
  const allocated = Math.round((allocation / 100) * LIMIT);

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance || 0), 0);
  useEffect(() => {
    const userId = localStorage.getItem("user_id");

    if (!userId) return;

    getUserWallets(userId)
      .then(data => setWallets(data))
      .catch(err => console.error(err));

    getUserBanks(userId)
      .then(data => {
         setBanks(data);
         if(data.length > 0) setSelectedBankId(data[0].id);
      })
      .catch(err => console.error("Could not fetch banks", err));
  }, []);
  const walletIconCls = ["bg-indigo-50 text-indigo-600", "bg-emerald-50 text-emerald-600", "bg-amber-50 text-amber-600"];

  if (loading) return (
    <div className="p-6 grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2"><Skeleton className="h-96 rounded-2xl" /></div>
      <div className="space-y-4"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
    </div>
  );

  const handleActionClick = (type) => {
    setFeedback({ type: "", msg: "" });
    if (!selectedBankId) {
      setFeedback({ type: "error", msg: "Please link a bank account from the Banks page first." });
      return;
    }
    if (!fundingAmount || fundingAmount <= 0) return;
    setActionType(type);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = async (pin) => {
    setIsPinModalOpen(false);
    setIsProcessing(true);
    
    try {
      if (actionType === 'fund') {
        await fundWallet({
          wallet_id: wallets[0].id,
          amount: fundingAmount,
          bank_account_id: selectedBankId,
          pin: pin
        });
        setFeedback({ type: "success", msg: `Successfully added ₹${fundingAmount} to your wallet!` });
      } else {
        await withdrawWallet({
          wallet_id: wallets[0].id,
          amount: fundingAmount,
          bank_account_id: selectedBankId,
          pin: pin
        });
        setFeedback({ type: "success", msg: `Successfully withdrawn ₹${fundingAmount} to your bank account!` });
      }
      
      // Refresh wallet explicitly
      const userId = localStorage.getItem("user_id");
      const updatedWallets = await getUserWallets(userId);
      setWallets(updatedWallets);
    } catch(err) {
      console.error(err);
      setFeedback({ type: "error", msg: err.message || "Invalid PIN or insufficient balance" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="grid lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 p-7" glow>
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className={cls("text-sm font-medium", T.muted(dark))}>Primary Wallet Balance</p>
              <p className={cls("text-[40px] font-bold mt-1 tracking-tight", T.text(dark))}>
                ₹{totalBalance.toLocaleString()}
              </p>
              <p className={cls("text-sm mt-1", T.subtle(dark))}>Available for allocation</p>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className={cls("text-[15px] font-semibold", T.text(dark))}>Offline Token Allocation</p>
              <p className="text-[15px] font-bold text-indigo-600 dark:text-indigo-400">₹{allocated.toLocaleString("en-IN")}</p>
            </div>
            <input
              type="range" min="0" max="100" value={allocation}
              onChange={e => setAllocation(Number(e.target.value))}
              aria-label="Token allocation percentage"
              className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-indigo-600 bg-slate-200 dark:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            />
            <div className="flex justify-between text-xs font-medium">
              <span className={T.subtle(dark)}>₹0</span>
              <span className={cls(T.muted(dark))}>{allocation}% allocated</span>
              <span className={T.subtle(dark)}>₹{LIMIT.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className={cls("mt-8 p-4 border rounded-xl flex items-start gap-3 backdrop-blur-sm", dark ? "bg-amber-900/20 border-amber-500/20" : "bg-amber-50 border-amber-200")}>
            <AlertTriangle className="text-amber-500 w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className={cls("text-sm font-semibold", dark ? "text-amber-400" : "text-amber-800")}>Security Notice</p>
              <p className={cls("text-xs mt-1 leading-relaxed", dark ? "text-amber-200/80" : "text-amber-700")}>Offline tokens exceeding ₹50,000 require biometric re-authorization on your registered device.</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="primary" size="lg">Apply Allocation</Button>
            <Button variant="secondary" size="lg">Reset to Default</Button>
          </div>
        </Card>

        <div className="space-y-4">
          {wallets.map((w, i) => (
            <Card key={i} className="p-5 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cls("w-10 h-10 rounded-xl flex items-center justify-center text-sm flex-shrink-0 shadow-inner", walletIconCls[i])} aria-hidden="true"><Wallet className="w-5 h-5" /></div>
                  <div>
                    <p className={cls("text-[15px] font-semibold", T.text(dark))}>{w.wallet_type}</p>
                    <p className={cls("text-sm font-medium mt-0.5", T.muted(dark))}>₹{w.balance}</p>
                  </div>
                </div>
                <Badge variant={w.badge}>
                  {w.tag ? w.tag.charAt(0).toUpperCase() + w.tag.slice(1) : "Unknown"}
                </Badge>
              </div>
            </Card>
          ))}
          
          <Card className="p-5 border-dashed bg-transparent" glow={false}>
            <p className={cls("text-sm font-semibold mb-3", T.text(dark))}>Wallet Actions</p>
            
            {feedback.msg && (
              <div className={cls("mb-4 p-3 rounded-lg text-sm font-medium", feedback.type === "error" ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400")}>
                {feedback.msg}
              </div>
            )}
            
            <div className="mb-4">
              <label className={cls("block text-[13px] font-medium mb-1.5", T.muted(dark))}>Funding Source / Destination</label>
              <select 
                value={selectedBankId} onChange={(e) => setSelectedBankId(e.target.value)}
                className={cls("w-full h-10 px-3 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none", dark ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-300 text-slate-900")}
              >
                {banks.length === 0 ? <option value="">No linked banks</option> : banks.map(b => (
                  <option key={b.id} value={b.id}>{b.bank_name} (••{b.account_number_masked.slice(-4)})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <span className={cls("text-xl font-bold rounded-lg px-3 py-1 bg-slate-100 dark:bg-slate-800", T.text(dark))}>₹</span>
              <input 
                 type="number" 
                 value={fundingAmount}
                 onChange={(e) => setFundingAmount(Number(e.target.value))}
                 className={cls("flex-1 h-10 w-full bg-transparent border-b focus:outline-none focus:border-indigo-500 font-bold text-lg transition-colors", T.text(dark), dark ? "border-slate-700" : "border-slate-300")}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="primary" className="flex-1 shadow-sm" onClick={() => handleActionClick('fund')} disabled={isProcessing}>
                {isProcessing && actionType === 'fund' ? "Processing..." : <><ArrowDown className="w-4 h-4 mr-1" /> Add</>}
              </Button>
              <Button variant="secondary" className="flex-1 shadow-sm" onClick={() => handleActionClick('withdraw')} disabled={isProcessing}>
                {isProcessing && actionType === 'withdraw' ? "Processing..." : <><ArrowUp className="w-4 h-4 mr-1" /> Withdraw</>}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <PinEntryModal 
        isOpen={isPinModalOpen} 
        onClose={() => setIsPinModalOpen(false)} 
        onSuccess={handlePinSuccess}
        title={actionType === 'fund' ? "Authorize Bank Transfer" : "Authorize Withdrawal"}
        amount={fundingAmount}
      />
    </div>
  );
}