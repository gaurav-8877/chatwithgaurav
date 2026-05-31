import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Phone, ArrowLeft, Loader2, MessageSquare,
  RefreshCw, CheckCircle, User,
} from "lucide-react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth }            from "../lib/firebase";
import { useAuthStore }    from "../store/useAuthStore";
import toast               from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────────────────
   Country codes (common ones + India first)
───────────────────────────────────────────────────────────────────────── */
const COUNTRIES = [
  { code: "+91",  flag: "🇮🇳", name: "India"          },
  { code: "+1",   flag: "🇺🇸", name: "USA"            },
  { code: "+44",  flag: "🇬🇧", name: "UK"             },
  { code: "+971", flag: "🇦🇪", name: "UAE"            },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia"   },
  { code: "+65",  flag: "🇸🇬", name: "Singapore"      },
  { code: "+61",  flag: "🇦🇺", name: "Australia"      },
  { code: "+49",  flag: "🇩🇪", name: "Germany"        },
  { code: "+33",  flag: "🇫🇷", name: "France"         },
  { code: "+81",  flag: "🇯🇵", name: "Japan"          },
  { code: "+86",  flag: "🇨🇳", name: "China"          },
  { code: "+55",  flag: "🇧🇷", name: "Brazil"         },
  { code: "+7",   flag: "🇷🇺", name: "Russia"         },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan"       },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh"     },
];

/* ─────────────────────────────────────────────────────────────────────────
   Shared card wrapper
───────────────────────────────────────────────────────────────────────── */
function Card({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Brand panel — desktop */}
      <aside
        className="hidden lg:flex flex-col justify-between flex-shrink-0 p-12"
        style={{ width: 420, background: "var(--s1)", borderRight: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--accent)" }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold" style={{ color: "var(--t1)" }}>Chatify</span>
        </div>

        <div className="space-y-6">
          {[
            { e: "🔐", t: "One-tap login",        s: "No passwords. Just your number." },
            { e: "📱", t: "OTP via SMS",           s: "Secure 6-digit code to your phone." },
            { e: "⚡", t: "Instant access",        s: "Verified in seconds, chat immediately." },
            { e: "🌍", t: "Works worldwide",       s: "220+ country codes supported." },
          ].map(({ e, t, s }) => (
            <div key={t} className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: "var(--s2)" }}>{e}</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{t}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--t3)" }}>{s}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs" style={{ color: "var(--t3)" }}>© 2026 Chatify · Free phone auth via Firebase</p>
      </aside>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full" style={{ maxWidth: 400 }}>
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--accent)" }}>
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: "var(--t1)" }}>Chatify</span>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold" style={{ color: "var(--t1)" }}>{title}</h1>
            <p className="text-sm mt-1.5" style={{ color: "var(--t3)" }}>{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   reCAPTCHA Singleton — module level pe rakhte hain
   Component re-render pe dobara nahi banega
───────────────────────────────────────────────────────────────────────── */
let appVerifier = null;

function clearRecaptcha() {
  if (appVerifier) {
    try { appVerifier.clear(); } catch {}
    appVerifier = null;
  }
  // DOM container bhi reset karo
  const container = document.getElementById("recaptcha-container");
  if (container) container.innerHTML = "";
}

/* ─────────────────────────────────────────────────────────────────────────
   Step 1 — Phone number input
───────────────────────────────────────────────────────────────────────── */
function StepPhone({ onSent }) {
  const [country,  setCountry]  = useState(COUNTRIES[0]);
  const [phone,    setPhone]    = useState("");
  const [showDrop, setShowDrop] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const fullNumber = `${country.code}${phone.replace(/\D/g, "")}`;

  // Component mount pe ek baar reCAPTCHA banao
  useEffect(() => {
    // Pehle purana clear karo
    clearRecaptcha();

    // Naya banao
    try {
      appVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          clearRecaptcha();
          toast.error("reCAPTCHA expired. Please try again.");
        },
      });
      appVerifier.render().catch(() => {});
    } catch (e) {
      console.error("reCAPTCHA init error:", e);
    }

    // Component unmount pe cleanup
    return () => { clearRecaptcha(); };
  }, []);

  const handleSend = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      toast.error("Valid phone number enter karo");
      return;
    }

    if (!appVerifier) {
      toast.error("reCAPTCHA ready nahi hai, page refresh karo");
      return;
    }

    setLoading(true);
    try {
      const confirmation = await signInWithPhoneNumber(auth, fullNumber, appVerifier);
      toast.success(`OTP bheja ${fullNumber} pe`);
      onSent({ confirmation, phoneNumber: fullNumber });
    } catch (err) {
      console.error("OTP send error:", err.code, err.message);

      // Error pe reCAPTCHA reset karo
      clearRecaptcha();
      // Dobara banao
      try {
        appVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
          size: "invisible",
          callback: () => {},
        });
        await appVerifier.render();
      } catch {}

      // User ko sahi error batao
      if (err.code === "auth/invalid-phone-number") {
        toast.error("Phone number format galat hai (example: +918887704702)");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("Bahut zyada attempts. Thodi der baad try karo.");
      } else if (err.code === "auth/api-key-not-valid" || err.code === "auth/invalid-api-key") {
        toast.error("Firebase API key galat hai — .env check karo");
      } else if (err.code === "auth/network-request-failed") {
        toast.error("Internet connection check karo");
      } else {
        toast.error(err.message || "OTP bhejne mein error");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase = {
    background: "var(--s3)",
    border: "1px solid var(--border-2)",
    color: "var(--t1)",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  return (
    <Card title="Enter your number" subtitle="We'll send a one-time password to verify your identity">
      <div className="space-y-4">
        {/* Country + phone row */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "var(--t2)" }}>
            Phone Number
          </label>
          <div className="flex gap-2">
            {/* Country selector */}
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowDrop(!showDrop)}
                className="flex items-center gap-2 h-12 px-3 rounded-2xl text-sm font-semibold"
                style={{ ...inputBase, borderRadius: 16, minWidth: 90, justifyContent: "center" }}
              >
                <span className="text-lg">{country.flag}</span>
                <span style={{ color: "var(--t1)" }}>{country.code}</span>
              </button>

              {showDrop && (
                <div
                  className="absolute top-full left-0 mt-1 z-50 rounded-2xl overflow-hidden"
                  style={{ background: "var(--s3)", border: "1px solid var(--border-2)", boxShadow: "0 16px 48px rgba(0,0,0,0.5)", width: 220, maxHeight: 300, overflowY: "auto" }}
                >
                  {COUNTRIES.map(c => (
                    <button
                      key={c.code + c.name}
                      onClick={() => { setCountry(c); setShowDrop(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors"
                      style={{ color: "var(--t1)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span style={{ color: "var(--t3)", fontSize: 12 }}>{c.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Number input */}
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^\d\s\-()]/g, ""))}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="8887704702"
              className="flex-1 h-12 px-4"
              style={{ ...inputBase, borderRadius: 16 }}
              onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-m)"; }}
              onBlur={e =>  { e.target.style.borderColor = "var(--border-2)"; e.target.style.boxShadow = "none"; }}
              autoFocus
            />
          </div>

          {phone && (
            <p className="text-xs mt-2" style={{ color: "var(--t3)" }}>
              Sending to: <span style={{ color: "var(--accent)" }}>{fullNumber}</span>
            </p>
          )}
        </div>

        {/* Send OTP button */}
        <button
          onClick={handleSend}
          disabled={loading || phone.replace(/\D/g, "").length < 8}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--accent)", boxShadow: "0 4px 24px var(--accent-m)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
          {loading ? "Sending OTP…" : "Send OTP"}
        </button>

        {/* reCAPTCHA invisible container */}
        <div id="recaptcha-container" />

        {/* Email login link */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-xs" style={{ color: "var(--t3)" }}>or</span>
          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>
        <a href="/login"
          className="block w-full text-center py-3 rounded-2xl text-sm font-semibold transition-all"
          style={{ background: "var(--s2)", color: "var(--t2)", border: "1px solid var(--border-2)" }}>
          Login with Email
        </a>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Step 2 — OTP input (6 boxes)
───────────────────────────────────────────────────────────────────────── */
function StepOTP({ confirmation, phoneNumber, onVerified, onBack }) {
  const [otp,      setOtp]      = useState(["", "", "", "", "", ""]);
  const [loading,  setLoading]  = useState(false);
  const [resendIn, setResendIn] = useState(60);
  const inputRefs = Array.from({ length: 6 }, () => useRef(null));

  // Countdown timer
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs[idx + 1]?.current?.focus();
    if (next.every(d => d) && next.join("").length === 6) {
      verify(next.join(""));
    }
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs[idx - 1]?.current?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      inputRefs[5]?.current?.focus();
      verify(text);
    }
  };

  const verify = async (code) => {
    setLoading(true);
    try {
      const result = await confirmation.confirm(code);
      const idToken = await result.user.getIdToken();
      onVerified(idToken);
    } catch (err) {
      toast.error(err.code === "auth/invalid-verification-code" ? "Wrong OTP. Try again." : err.message);
      setOtp(["", "", "", "", "", ""]);
      inputRefs[0]?.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const boxStyle = (filled) => ({
    width: 48, height: 56,
    borderRadius: 14,
    background: "var(--s3)",
    border: `2px solid ${filled ? "var(--accent)" : "var(--border-2)"}`,
    color: "var(--t1)",
    fontSize: 22, fontWeight: 700,
    textAlign: "center",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  });

  return (
    <Card title="Enter OTP" subtitle={`6-digit code sent to ${phoneNumber}`}>
      <div className="space-y-6">
        {/* 6 boxes */}
        <div className="flex gap-2 justify-center">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              onPaste={handlePaste}
              style={boxStyle(!!digit)}
              onFocus={e => { e.target.style.boxShadow = "0 0 0 3px var(--accent-m)"; e.target.style.borderColor = "var(--accent)"; }}
              onBlur={e  => { e.target.style.boxShadow = "none"; if (!digit) e.target.style.borderColor = "var(--border-2)"; }}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          onClick={() => verify(otp.join(""))}
          disabled={loading || otp.some(d => !d)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--accent)", boxShadow: "0 4px 24px var(--accent-m)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {loading ? "Verifying…" : "Verify OTP"}
        </button>

        {/* Resend */}
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-1 text-sm transition-colors"
            style={{ color: "var(--t3)" }}>
            <ArrowLeft className="w-4 h-4" /> Change number
          </button>
          {resendIn > 0 ? (
            <p className="text-sm" style={{ color: "var(--t3)" }}>
              Resend in <span style={{ color: "var(--accent)", fontWeight: 600 }}>{resendIn}s</span>
            </p>
          ) : (
            <button
              onClick={() => { onBack(); }}
              className="flex items-center gap-1 text-sm font-semibold transition-colors"
              style={{ color: "var(--accent)" }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Step 3 — Name input (new users only)
───────────────────────────────────────────────────────────────────────── */
function StepName({ idToken, phoneNumber, onDone }) {
  const [name,    setName]    = useState("");
  const [loading, setLoading] = useState(false);
  const { phoneLogin } = useAuthStore();

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Enter your name"); return; }
    setLoading(true);
    const result = await phoneLogin({ idToken, fullName: name.trim() });
    setLoading(false);
    if (result?.success) onDone();
  };

  return (
    <Card title="What's your name?" subtitle="Just once — you can change it later in Settings">
      <div className="space-y-4">
        {/* Phone badge */}
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
          style={{ background: "var(--s2)", border: "1px solid var(--border)" }}>
          <Phone className="w-4 h-4 flex-shrink-0" style={{ color: "var(--accent)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--t1)" }}>{phoneNumber}</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold text-white"
            style={{ background: "var(--accent)" }}>✓ Verified</span>
        </div>

        {/* Name input */}
        <div>
          <label className="block text-xs font-semibold mb-2" style={{ color: "var(--t2)" }}>Full Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--t3)" }} />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Gaurav Sharma"
              maxLength={60}
              autoFocus
              className="w-full h-12 pl-11 pr-4"
              style={{ background: "var(--s3)", border: "1px solid var(--border-2)", borderRadius: 16, color: "var(--t1)", fontSize: 15, outline: "none" }}
              onFocus={e => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "0 0 0 3px var(--accent-m)"; }}
              onBlur={e =>  { e.target.style.borderColor = "var(--border-2)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !name.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "var(--accent)", boxShadow: "0 4px 24px var(--accent-m)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {loading ? "Creating account…" : "Get Started →"}
        </button>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Main page — orchestrates the 3 steps
───────────────────────────────────────────────────────────────────────── */
export default function PhoneAuthPage() {
  const navigate  = useNavigate();
  const { phoneLogin } = useAuthStore();

  const [step,         setStep]         = useState("phone");   // phone | otp | name
  const [confirmation, setConfirmation] = useState(null);
  const [phoneNumber,  setPhoneNumber]  = useState("");
  const [idToken,      setIdToken]      = useState("");

  const handleSent = ({ confirmation, phoneNumber }) => {
    setConfirmation(confirmation);
    setPhoneNumber(phoneNumber);
    setStep("otp");
  };

  const handleVerified = async (token) => {
    setIdToken(token);
    // Try to login — if user exists, done; if new user, go to name step
    const result = await phoneLogin({ idToken: token });
    if (result?.success) {
      navigate("/");
    } else if (result?.needsName) {
      setStep("name");
    }
  };

  const handleDone = () => navigate("/");

  if (step === "phone") {
    return <StepPhone onSent={handleSent} />;
  }
  if (step === "otp") {
    return (
      <StepOTP
        confirmation={confirmation}
        phoneNumber={phoneNumber}
        onVerified={handleVerified}
        onBack={() => setStep("phone")}
      />
    );
  }
  return (
    <StepName
      idToken={idToken}
      phoneNumber={phoneNumber}
      onDone={handleDone}
    />
  );
}
