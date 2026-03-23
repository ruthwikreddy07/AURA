import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Delete, ArrowRight } from "lucide-react";

export default function PinSetupPage() {
  const navigate = useNavigate();
  const { dark } = useTheme();
  
  const [step, setStep] = useState(1); // 1 = create, 2 = confirm
  const [pin1, setPin1] = useState("");
  const [pin2, setPin2] = useState("");
  const [error, setError] = useState("");

  const currentPin = step === 1 ? pin1 : pin2;

  const handlePress = (num) => {
    if (currentPin.length < 6) {
      if (step === 1) {
        setPin1(pin1 + num);
        if (pin1.length === 5) setTimeout(() => setStep(2), 300);
      } else {
        setPin2(pin2 + num);
        if (pin2.length === 5) setTimeout(() => handleConfirm(pin2 + num), 300);
      }
    }
  };

  const handleDelete = () => {
    if (step === 1) {
      setPin1(pin1.slice(0, -1));
    } else {
      setPin2(pin2.slice(0, -1));
    }
    setError("");
  };

  const handleConfirm = async (finalPin2) => {
    if (pin1 !== finalPin2) {
      setError("PINs do not match. Try again.");
      setStep(1);
      setPin1("");
      setPin2("");
      return;
    }
    
    // In a real app we hit the API: await setPin({ pin: pin1 });
    navigate("/app/overview");
  };

  return (
    <div className={cls("min-h-screen flex items-center justify-center p-4", dark ? "bg-[#0B0F19]" : "bg-slate-50")}>
      <Card className="w-full max-w-md p-8 flex flex-col items-center">
        
        <div className={cls("w-16 h-16 rounded-2xl flex items-center justify-center mb-6", dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h2 className={cls("text-2xl font-bold text-center mb-2", T.text(dark))}>Set Transaction PIN</h2>
        <p className={cls("text-center mb-8", T.muted(dark))}>
          {step === 1 ? "Create a 6-digit PIN to secure your offline transfers." : "Confirm your 6-digit PIN."}
        </p>

        {/* Dots */}
        <div className="flex gap-3 mb-10 h-4">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div 
              key={i}
              animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
              className={cls(
                "w-3.5 h-3.5 rounded-full transition-all duration-300",
                i < currentPin.length 
                  ? (dark ? "bg-indigo-500 scale-110" : "bg-indigo-600 scale-110") 
                  : (dark ? "bg-slate-800" : "bg-slate-200")
              )}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm font-medium mb-4 -mt-4 text-center">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handlePress(num.toString())}
              className={cls(
                "h-16 rounded-full text-2xl font-medium transition-all active:scale-95 flex items-center justify-center",
                dark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              )}
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handlePress("0")}
            className={cls(
              "h-16 rounded-full text-2xl font-medium transition-all active:scale-95 flex items-center justify-center",
              dark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            )}
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className={cls(
              "h-16 rounded-full text-xl transition-all active:scale-95 flex items-center justify-center",
              dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            <Delete className="w-7 h-7" />
          </button>
        </div>

      </Card>
    </div>
  );
}
