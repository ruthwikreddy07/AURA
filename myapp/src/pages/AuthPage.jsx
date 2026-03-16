import { useTheme } from "../context/ThemeContext";
import { T } from "../theme/themeTokens";
import { cls } from "../utils/cls";

import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock } from "lucide-react";
import { registerUser, loginUser } from "../api/api";

export default function AuthPage({ onLogin }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("login");
  // FIX: Controlled state for every field so typed text is visible
  const [fields, setFields] = useState({ name: "", email: "", password: "", confirm: "" });
  const set = (k) => (e) => setFields(p => ({ ...p, [k]: e.target.value }));
  
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    let user;

    if (tab === "register") {
      user = await registerUser({
        email: fields.email,
        password: fields.password,
        full_name: fields.name
      });

      console.log("Registered:", user);
    }

    if (tab === "login") {
      user = await loginUser({
        email: fields.email,
        password: fields.password
      });

      console.log("Logged in:", user);
    }

    if (user?.id) {
      localStorage.setItem("user_id", user.id);
    }
    if (user?.access_token) {
      localStorage.setItem("auth_token", user.access_token);
    }

    navigate("/app/overview");

  } catch (err) {
    console.error("Auth error:", err);
  }
};

  // Reset fields when switching tabs
  const switchTab = (id) => { setTab(id); setFields({ name: "", email: "", password: "", confirm: "" }); };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] bg-emerald-100 rounded-full blur-3xl opacity-40" />
      </div>

      <motion.main initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: "easeOut" }} className="relative w-full max-w-md z-10" role="main">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-200/50" aria-hidden="true">
            <span className="text-white text-2xl font-black">Ω</span>
          </div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight">Welcome to OffPay</h1>
          <p className="text-slate-500 text-[15px] font-medium mt-1">Offline-first digital payments</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] p-8">
          <div className="flex bg-slate-100 rounded-2xl p-1.5 mb-7" role="tablist" aria-label="Authentication options">
            {[{ id: "login", label: "Sign In" }, { id: "register", label: "Sign Up" }].map(({ id, label }) => (
              <button
                key={id} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`}
                onClick={() => switchTab(id)}
                className={cls("flex-1 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 active:scale-95",
                  tab === id ? "bg-white shadow-[0_2px_10px_rgba(0,0,0,0.06)] text-slate-900" : "text-slate-500 hover:text-slate-700")}
              >{label}</button>
            ))}
          </div>

          <div id={`panel-${tab}`} role="tabpanel">
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {tab === "register" && (
                // FIX: Inline input with explicit visible text color — not using T.inputBg which can clash with white card
                <div className="space-y-1.5">
                  <label htmlFor="auth-name" className="text-sm font-medium text-slate-600">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><User className="w-4 h-4" /></span>
                    <input id="auth-name" type="text" autoComplete="name" placeholder="Arjun Kumar" value={fields.name} onChange={set("name")}
                      className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-[15px] font-medium text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="auth-email" className="text-sm font-medium text-slate-600">Email</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Mail className="w-4 h-4" /></span>
                  <input id="auth-email" type="email" autoComplete="email" placeholder="you@example.com" value={fields.email} onChange={set("email")} required
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-[15px] font-medium text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="auth-password" className="text-sm font-medium text-slate-600">Password</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Lock className="w-4 h-4" /></span>
                  <input id="auth-password" type="password" autoComplete="current-password" placeholder="••••••••" value={fields.password} onChange={set("password")} required
                    className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-[15px] font-medium text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
                </div>
              </div>

              {tab === "register" && (
                <div className="space-y-1.5">
                  <label htmlFor="auth-confirm" className="text-sm font-medium text-slate-600">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"><Lock className="w-4 h-4" /></span>
                    <input id="auth-confirm" type="password" autoComplete="new-password" placeholder="••••••••" value={fields.confirm} onChange={set("confirm")}
                      className="w-full border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-[15px] font-medium text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={!fields.email.trim() || !fields.password.trim()}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-[15px] rounded-xl py-3.5 transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 shadow-md shadow-indigo-200/60"
              >
                {tab === "login" ? "Sign In →" : "Create Account →"}
              </button>
            </form>

            <div className="relative flex items-center gap-3 my-6" aria-hidden="true">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-[13px] font-semibold text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button" aria-label="Continue with Google" onClick={() => navigate("/app/overview")}
              className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3 text-[14px] font-bold text-slate-700 hover:bg-slate-50 transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
            >
              <span className="font-black text-blue-500 text-lg">G</span> Continue with Google
            </button>

            {tab === "login" && (
              <p className="text-center text-[13px] font-medium text-slate-400 mt-6">
                Any email + password will sign you in ·{" "}
                <a href="#" className="text-indigo-500 font-semibold hover:text-indigo-600 transition-colors focus:outline-none focus-visible:underline rounded">Forgot password?</a>
              </p>
            )}
          </div>
        </div>
      </motion.main>
    </div>
  );
}