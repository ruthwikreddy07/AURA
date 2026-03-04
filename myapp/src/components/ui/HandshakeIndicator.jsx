import { cls } from "../../utils/cls";
import { Wifi, Search, Check } from "lucide-react";

export default function HandshakeIndicator({ state }) { // state: searching | connecting | handshake
  const isSearching = state === 'searching';
  const isConnecting = state === 'connecting';
  const isHandshake = state === 'handshake';

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {(isSearching || isConnecting) && [0, 1, 2].map(i => (
        <div
          key={i}
          className="absolute inset-0 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20"
          style={{ animation: `pulse 2.5s ${i * 0.4}s infinite cubic-bezier(0.4, 0, 0.6, 1)` }}
        />
      ))}

      <div className={cls("relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 z-10", isHandshake ? "bg-emerald-500" : "bg-indigo-600")}>
        {isSearching && <Search className="w-10 h-10 text-white animate-pulse" />}
        {isConnecting && <Wifi className="w-10 h-10 text-white animate-pulse" />}
        {isHandshake && <Check className="w-12 h-12 text-white" />}
      </div>

      <style>{` @keyframes pulse { 0% { transform: scale(0.6); opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } } `}</style>
    </div>
  );
}