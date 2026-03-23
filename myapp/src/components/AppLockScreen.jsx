import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";
import { Lock, Fingerprint, Delete } from "lucide-react";
import { motion } from "framer-motion";

/**
 * AppLockScreen — renders a full-screen PIN/biometric gate.
 * Props:
 *   onUnlock: () => void — called when the user enters the correct PIN
 */
export default function AppLockScreen({ onUnlock }) {
  const { dark } = useTheme();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    tick();
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, []);

  const handlePress = (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(false);
      if (newPin.length === 6) {
        setTimeout(() => {
          // For demo, accept any 6-digit PIN
          onUnlock();
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className={cls(
      "fixed inset-0 z-[200] flex flex-col items-center justify-center",
      dark ? "bg-slate-950" : "bg-white"
    )}>
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={cls("absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-20", dark ? "bg-indigo-600" : "bg-indigo-200")}
          style={{ top: "-15%", left: "50%", transform: "translateX(-50%)" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        {/* Time */}
        <p className={cls("text-5xl font-black tracking-tight mb-2", T.text(dark))}>{time}</p>
        <p className={cls("text-sm font-medium mb-12", T.muted(dark))}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>

        {/* Lock icon */}
        <motion.div 
          animate={error ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          className={cls("w-16 h-16 rounded-full flex items-center justify-center mb-6", dark ? "bg-slate-800/80 border border-slate-700" : "bg-slate-100 border border-slate-200")}
        >
          <Lock className={cls("w-7 h-7", dark ? "text-slate-400" : "text-slate-500")} />
        </motion.div>

        <p className={cls("text-sm font-semibold mb-8", T.muted(dark))}>Enter PIN to unlock AURA</p>

        {/* Dots */}
        <div className="flex gap-3 mb-10">
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div 
              key={i}
              animate={error ? { x: [-5, 5, -5, 5, 0] } : {}}
              className={cls(
                "w-3 h-3 rounded-full transition-all duration-200",
                i < pin.length 
                  ? (dark ? "bg-indigo-500 scale-125" : "bg-indigo-600 scale-125") 
                  : (dark ? "bg-slate-700" : "bg-slate-300")
              )}
            />
          ))}
        </div>

        {error && <p className="text-red-500 text-sm font-medium mb-4 -mt-6">Incorrect PIN</p>}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handlePress(num.toString())}
              className={cls(
                "h-16 rounded-full text-2xl font-medium transition-all active:scale-90 flex items-center justify-center",
                dark ? "bg-slate-800/60 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
              )}
            >
              {num}
            </button>
          ))}
          
          {/* Biometric button */}
          <button
            onClick={() => onUnlock()} // Simulated biometric success
            className={cls(
              "h-16 rounded-full transition-all active:scale-90 flex items-center justify-center",
              dark ? "hover:bg-slate-800 text-indigo-400" : "hover:bg-slate-100 text-indigo-600"
            )}
            aria-label="Unlock with biometrics"
          >
            <Fingerprint className="w-7 h-7" />
          </button>
          
          <button
            onClick={() => handlePress("0")}
            className={cls(
              "h-16 rounded-full text-2xl font-medium transition-all active:scale-90 flex items-center justify-center",
              dark ? "bg-slate-800/60 hover:bg-slate-700 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-900"
            )}
          >
            0
          </button>
          
          <button
            onClick={handleDelete}
            className={cls(
              "h-16 rounded-full transition-all active:scale-90 flex items-center justify-center",
              dark ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"
            )}
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
