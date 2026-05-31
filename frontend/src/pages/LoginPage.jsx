import { useState } from "react";
import { Link } from "react-router";
import { Mail, Lock, Eye, EyeOff, Loader2, MessageSquare } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function LoginPage() {
  const [form,     setForm]     = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const { login, isLoggingIn }  = useAuthStore();

  const change = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => { e.preventDefault(); await login(form); };

  const inputStyle = {
    background: "#18181B",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    color: "#FAFAFA",
    fontSize: 14,
    outline: "none",
    width: "100%",
    padding: "12px 16px 12px 44px",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const focusIn  = (e) => { e.target.style.borderColor = "rgba(109,93,252,0.5)"; e.target.style.boxShadow = "0 0 0 3px rgba(109,93,252,0.10)"; };
  const focusOut = (e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; e.target.style.boxShadow = "none"; };

  return (
    <div className="min-h-screen flex" style={{ background: "#09090B" }}>

      {/* Brand panel — desktop only */}
      <aside
        className="hidden lg:flex flex-col justify-between flex-shrink-0 p-12"
        style={{ width: 480, background: "#111827", borderRight: "1px solid rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)" }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Chatify</span>
        </div>

        <div className="space-y-6">
          {[
            { e: "⚡", t: "Real-time messaging",   s: "Messages delivered instantly with typing indicators"     },
            { e: "🔒", t: "Secure by design",       s: "JWT auth, Arcjet rate-limiting, secure cookie sessions" },
            { e: "🤖", t: "AI-powered assistant",   s: "Summarise chats, draft replies, translate messages"     },
            { e: "👥", t: "Groups & communities",   s: "Create groups, manage members, and chat together"       },
          ].map(({ e, t, s }) => (
            <div key={t} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "#18181B" }}>{e}</div>
              <div>
                <p className="text-sm font-semibold text-white">{t}</p>
                <p className="text-xs mt-0.5" style={{ color: "#52525B" }}>{s}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: "#3F3F46" }}>© 2026 Chatify</p>
      </aside>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div style={{ width: "100%", maxWidth: 400 }}>

          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)" }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Chatify</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
            <p className="text-sm mt-1.5" style={{ color: "#71717A" }}>Sign in to continue to Chatify</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#A1A1AA" }}>Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#52525B" }} strokeWidth={1.8} />
                <input type="email" value={form.email} onChange={change("email")} required
                  placeholder="you@example.com"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                  className="placeholder-zinc-600" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold" style={{ color: "#A1A1AA" }}>Password</label>
                <button type="button" className="text-xs transition-colors"
                  style={{ color: "#6D5DFC" }}>Forgot password?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#52525B" }} strokeWidth={1.8} />
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={change("password")} required placeholder="Min. 6 characters"
                  style={{ ...inputStyle, paddingRight: 44 }} onFocus={focusIn} onBlur={focusOut}
                  className="placeholder-zinc-600" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:text-white"
                  style={{ color: "#52525B" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoggingIn}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-2xl transition-all duration-150 disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)", boxShadow: "0 4px 24px rgba(109,93,252,0.30)" }}>
              {isLoggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoggingIn ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Phone login */}
          <Link to="/phone-auth"
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: "rgba(0,168,132,0.12)", color: "#00A884", border: "1px solid rgba(0,168,132,0.25)" }}>
            📱 Continue with Phone (OTP)
          </Link>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs" style={{ color: "#3F3F46" }}>New here?</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <Link to="/signup"
            className="block w-full text-center py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
            style={{ background: "#18181B", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.08)" }}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
