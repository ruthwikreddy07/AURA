import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import { Lock, X, Delete } from "lucide-react";

export default function PinEntryModal({ isOpen, onClose, onSuccess, title = "Enter Transaction PIN", amount = null }) {
  const { dark } = useTheme();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError(false);
    }
  }, [isOpen]);

  const handlePress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 6) {
        // Auto-submit when 6 digits are reached
        setTimeout(() => submitPin(newPin), 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const submitPin = async (currentPin) => {
    try {
      // In a real app we'd call the API here:
      // await verifyPin({ pin: currentPin });
      
      // For now we just succeed and let the parent handle the API call
      onSuccess(currentPin);
    } catch (err) {
      setError(true);
      setPin("");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={cls(
            "relative w-full max-w-sm rounded-[32px] sm:rounded-3xl p-6 sm:p-8 flex flex-col items-center",
            dark ? "bg-slate-900 border border-slate-800" : "bg-white border border-slate-200"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={onClose}
            className={cls("absolute top-5 right-5 p-2 rounded-full", dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500")}
          >
            <X className="w-5 h-5" />
          </button>

          <div className={cls("w-14 h-14 rounded-2xl flex items-center justify-center mb-5", dark ? "bg-indigo-500/20 text-indigo-400" : "bg-indigo-50 text-indigo-600")}>
            <Lock className="w-7 h-7" />
          </div>

          <h3 className={cls("text-xl font-bold text-center mb-2", T.text(dark))}>{title}</h3>
          
          {amount && (
            <p className={cls("text-sm font-medium mb-6 text-center", T.muted(dark))}>
              Securely verify your identity to transfer <span className={cls("font-bold text-lg", dark ? "text-indigo-400" : "text-indigo-600")}>₹{amount}</span>
            </p>
          )}

          {/* Dots */}
          <div className="flex gap-3 mb-8 h-4">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <motion.div 
                key={i}
                animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={cls(
                  "w-3.5 h-3.5 rounded-full transition-all duration-300",
                  i < pin.length 
                    ? (dark ? "bg-indigo-500 scale-110" : "bg-indigo-600 scale-110") 
                    : (dark ? "bg-slate-800" : "bg-slate-200")
                )}
              />
            ))}
          </div>
          
          {error && <p className="text-red-500 text-sm font-medium mb-4 -mt-4">Incorrect PIN. Try again.</p>}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full px-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                onClick={() => handlePress(num.toString())}
                className={cls(
                  "h-14 rounded-full text-2xl font-medium transition-colors flex items-center justify-center",
                  dark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                )}
              >
                {num}
              </button>
            ))}
            <div /> {/* Empty space bottom left */}
            <button
              onClick={() => handlePress("0")}
              className={cls(
                "h-14 rounded-full text-2xl font-medium transition-colors flex items-center justify-center",
                dark ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              )}
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className={cls(
                "h-14 rounded-full text-xl transition-colors flex items-center justify-center",
                dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
              )}
            >
              <Delete className="w-7 h-7" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
