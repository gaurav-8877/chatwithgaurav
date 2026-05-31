import { useState } from "react";
import { Link } from "react-router";
import { User, Mail, Lock, Eye, EyeOff, Loader2, MessageSquare, Check } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function SignUpPage() {
  const [form,     setForm]     = useState({ fullName: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const { signup, isSigningUp } = useAuthStore();

  const change = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => { e.preventDefault(); await signup(form); };

  const pwStrength = form.password.length >= 8 ? 3 : form.password.length >= 6 ? 2 : form.password.length > 0 ? 1 : 0;
  const pwColors   = ["#EF4444", "#F59E0B", "#22C55E"];
  const pwLabels   = ["Too short", "Weak", "Good"];

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

      {/* Brand panel */}
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

        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Start your journey</h2>
          <p className="text-sm mb-8" style={{ color: "#71717A" }}>
            Join thousands of people already using Chatify to stay connected.
          </p>

          <div className="space-y-4">
            {[
              "Real-time messaging with typing indicators",
              "Group chats with up to 256 members",
              "AI-powered message assistance",
              "Reactions, replies, and rich media",
              "Read receipts and delivery status",
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(34,197,94,0.15)" }}>
                  <Check className="w-3 h-3" style={{ color: "#22C55E" }} />
                </div>
                <span className="text-sm" style={{ color: "#A1A1AA" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "#3F3F46" }}>© 2026 Chatify · Free forever</p>
      </aside>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div style={{ width: "100%", maxWidth: 400 }}>

          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)" }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Chatify</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Create your account</h1>
            <p className="text-sm mt-1.5" style={{ color: "#71717A" }}>Free forever — no credit card required</p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Full name */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#A1A1AA" }}>Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#52525B" }} strokeWidth={1.8} />
                <input type="text" value={form.fullName} onChange={change("fullName")} required
                  placeholder="Jane Smith"
                  style={inputStyle} onFocus={focusIn} onBlur={focusOut}
                  className="placeholder-zinc-600" />
              </div>
            </div>

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
              <label className="block text-xs font-semibold mb-2" style={{ color: "#A1A1AA" }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "#52525B" }} strokeWidth={1.8} />
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={change("password")} required minLength={6}
                  placeholder="Min. 6 characters"
                  style={{ ...inputStyle, paddingRight: 44 }} onFocus={focusIn} onBlur={focusOut}
                  className="placeholder-zinc-600" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-white transition-colors"
                  style={{ color: "#52525B" }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength meter */}
              {form.password.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: n <= pwStrength ? pwColors[pwStrength - 1] : "#27272A" }} />
                    ))}
                  </div>
                  <span className="text-2xs font-semibold"
                    style={{ color: pwStrength > 0 ? pwColors[pwStrength - 1] : "#52525B" }}>
                    {pwStrength > 0 ? pwLabels[pwStrength - 1] : ""}
                  </span>
                </div>
              )}
            </div>

            <button type="submit" disabled={isSigningUp}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white rounded-2xl transition-all duration-150 disabled:opacity-60 mt-2"
              style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)", boxShadow: "0 4px 24px rgba(109,93,252,0.30)" }}>
              {isSigningUp && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSigningUp ? "Creating account…" : "Create account"}
            </button>
          </form>

          {/* Phone login */}
          <Link to="/phone-auth"
            className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: "rgba(0,168,132,0.12)", color: "#00A884", border: "1px solid rgba(0,168,132,0.25)" }}>
            📱 Register with Phone (OTP)
          </Link>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <span className="text-xs" style={{ color: "#3F3F46" }}>Already have an account?</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
          </div>

          <Link to="/login"
            className="block w-full text-center py-3 rounded-2xl text-sm font-semibold transition-all hover:bg-white/5"
            style={{ background: "#18181B", color: "#A1A1AA", border: "1px solid rgba(255,255,255,0.08)" }}>
            Sign in instead
          </Link>
        </div>
      </div>
    </div>
  );
}
