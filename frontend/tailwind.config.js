/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // ── COLOUR SYSTEM ─────────────────────────────────────────────────────
      colors: {
        // Surfaces  (zinc-based from spec)
        app: {
          bg:   "#09090B",   // primary background
          s1:   "#111827",   // secondary surface (gray-900)
          s2:   "#18181B",   // card surface      (zinc-900)
          s3:   "#27272A",   // elevated           (zinc-800)
          s4:   "#3F3F46",   // high-elevated      (zinc-700)
        },
        // Primary accent  #6D5DFC  (indigo-violet)
        accent: {
          DEFAULT: "#6D5DFC",
          hover:   "#7C6FFD",
          light:   "#8B5CF6",
          muted:   "rgba(109,93,252,0.15)",
          ring:    "rgba(109,93,252,0.35)",
        },
        // Text
        t1: "#FFFFFF",
        t2: "#A1A1AA",   // zinc-400
        t3: "#71717A",   // zinc-500
        // Status
        online:  "#22C55E",
        caution: "#F59E0B",
        danger:  "#EF4444",
        // Legacy brand aliases → accent (keeps old components building)
        brand: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#6D5DFC",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        // Border utility shorthands
        line: {
          DEFAULT: "rgba(255,255,255,0.06)",
          subtle:  "rgba(255,255,255,0.04)",
          strong:  "rgba(255,255,255,0.12)",
        },
      },

      // ── BACKGROUND ────────────────────────────────────────────────────────
      backgroundColor: {
        "surface-primary":      "#09090B",
        "surface-secondary":    "#111827",
        "surface-tertiary":     "#18181B",
        "surface-glass":        "rgba(24,24,27,0.8)",
        "surface-glass-light":  "rgba(39,39,42,0.6)",
      },

      // ── TEXT ──────────────────────────────────────────────────────────────
      textColor: {
        primary:    "#FFFFFF",
        secondary:  "#A1A1AA",
        tertiary:   "#71717A",
        muted:      "#52525B",
      },

      // ── BORDER ────────────────────────────────────────────────────────────
      borderColor: {
        divider: "rgba(255,255,255,0.06)",
        focus:   "#6D5DFC",
        strong:  "rgba(255,255,255,0.12)",
      },

      // ── SHADOWS ───────────────────────────────────────────────────────────
      boxShadow: {
        xs:         "0 1px 2px rgba(0,0,0,0.3)",
        sm:         "0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)",
        md:         "0 4px 6px rgba(0,0,0,0.4)",
        lg:         "0 10px 20px rgba(0,0,0,0.5)",
        xl:         "0 20px 40px rgba(0,0,0,0.5)",
        "2xl":      "0 25px 60px rgba(0,0,0,0.6)",
        glass:      "0 8px 32px rgba(0,0,0,0.4)",
        glow:       "0 0 24px rgba(109,93,252,0.25)",
        "glow-sm":  "0 0 12px rgba(109,93,252,0.20)",
        "glow-lg":  "0 0 48px rgba(109,93,252,0.30)",
        card:       "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      },

      // ── TYPOGRAPHY ────────────────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      fontWeight: {
        medium:   "500",
        semibold: "600",
        bold:     "700",
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs:    ["12px", { lineHeight: "16px", letterSpacing: "0.3px" }],
        sm:    ["13px", { lineHeight: "20px" }],
        base:  ["15px", { lineHeight: "24px" }],
        lg:    ["17px", { lineHeight: "26px" }],
        xl:    ["20px", { lineHeight: "28px" }],
        "2xl": ["24px", { lineHeight: "32px" }],
        "3xl": ["30px", { lineHeight: "38px" }],
      },

      // ── SPACING ───────────────────────────────────────────────────────────
      spacing: {
        4.5:  "18px",
        13:   "52px",
        18:   "72px",  // rail width
        22:   "88px",
        90:   "360px", // explorer width
      },

      // ── BORDER RADIUS ─────────────────────────────────────────────────────
      borderRadius: {
        xs:   "4px",
        sm:   "6px",
        md:   "10px",
        lg:   "14px",
        xl:   "18px",
        "2xl":"22px",
        "3xl":"28px",  // composer
        "4xl":"32px",
        bubble: "20px",
      },

      // ── ANIMATIONS ────────────────────────────────────────────────────────
      animation: {
        "fade-in":        "fadeIn 200ms ease-out",
        "fade-up":        "fadeUp 220ms ease-out",
        "scale-in":       "scaleIn 180ms cubic-bezier(0.34,1.56,0.64,1)",
        "slide-right":    "slideRight 220ms ease-out",
        "slide-left":     "slideLeft 220ms ease-out",
        "msg-in-sent":    "msgInSent 240ms cubic-bezier(0.34,1.36,0.64,1)",
        "msg-in-recv":    "msgInRecv 240ms cubic-bezier(0.34,1.36,0.64,1)",
        "shimmer":        "shimmer 1.8s linear infinite",
        "pulse-glow":     "pulseGlow 2.5s ease-in-out infinite",
        "typing-bounce":  "typingBounce 1.2s ease-in-out infinite",
        "spin-slow":      "spin 2s linear infinite",
        "border-rotate":  "borderRotate 4s linear infinite",
      },
      keyframes: {
        fadeIn:       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeUp:       { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        scaleIn:      { "0%": { opacity: "0", transform: "scale(0.88)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        slideRight:   { "0%": { opacity: "0", transform: "translateX(-12px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        slideLeft:    { "0%": { opacity: "0", transform: "translateX(12px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
        msgInSent:    { "0%": { opacity: "0", transform: "translateX(16px) scale(0.95)" }, "100%": { opacity: "1", transform: "translateX(0) scale(1)" } },
        msgInRecv:    { "0%": { opacity: "0", transform: "translateX(-16px) scale(0.95)" }, "100%": { opacity: "1", transform: "translateX(0) scale(1)" } },
        shimmer:      { "0%": { backgroundPosition: "-600px 0" }, "100%": { backgroundPosition: "600px 0" } },
        pulseGlow:    { "0%,100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(34,197,94,0.4)" }, "50%": { opacity: "0.85", boxShadow: "0 0 0 5px rgba(34,197,94,0)" } },
        typingBounce: { "0%,80%,100%": { transform: "translateY(0)" }, "40%": { transform: "translateY(-6px)" } },
        borderRotate: { to: { "--border-angle": "360deg" } },
      },

      // ── BACKDROP ──────────────────────────────────────────────────────────
      backdropBlur: { xs: "4px", sm: "8px", md: "16px", lg: "24px", xl: "40px" },

      // ── SIZES ─────────────────────────────────────────────────────────────
      width: {
        rail:     "72px",
        explorer: "360px",
        profile:  "320px",
      },
      minWidth: {
        explorer: "320px",
      },
      maxWidth: {
        "chat-bubble": "72%",
      },
    },
  },
  plugins: [],
};
