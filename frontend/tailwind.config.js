import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // DESIGN TOKENS - PREMIUM COLOR PALETTE
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#06b6d4",
          600: "#0891b2",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
        },
        slate: {
          0: "#0B1120",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#111827",
        },
        glass: {
          light: "rgba(241, 245, 249, 0.08)",
          medium: "rgba(241, 245, 249, 0.12)",
          dark: "rgba(241, 245, 249, 0.06)",
        },
      },
      // PREMIUM BACKGROUNDS
      backgroundColor: {
        "surface-primary": "#0B1120",
        "surface-secondary": "#111827",
        "surface-tertiary": "#1E293B",
        "surface-glass": "rgba(17, 24, 39, 0.6)",
        "surface-glass-light": "rgba(30, 41, 59, 0.4)",
      },
      // TEXT COLORS
      textColor: {
        "primary": "#F8FAFC",
        "secondary": "#94A3B8",
        "tertiary": "#64748B",
      },
      // BORDER COLORS
      borderColor: {
        "divider": "rgba(241, 245, 249, 0.08)",
        "focus": "#06B6D4",
      },
      // SHADOWS - PREMIUM SOFT SHADOWS
      boxShadow: {
        "xs": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.1)",
        "glass-hover": "0 12px 48px rgba(0, 0, 0, 0.15)",
        "glow": "0 0 20px rgba(6, 182, 212, 0.2)",
        "glow-blue": "0 0 20px rgba(59, 130, 246, 0.2)",
      },
      // TYPOGRAPHY
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px", letterSpacing: "0.4px" }],
        sm: ["14px", { lineHeight: "20px", letterSpacing: "0.25px" }],
        base: ["16px", { lineHeight: "24px", letterSpacing: "0.15px" }],
        lg: ["18px", { lineHeight: "28px", letterSpacing: "0.1px" }],
        xl: ["20px", { lineHeight: "28px", letterSpacing: "0px" }],
        "2xl": ["24px", { lineHeight: "32px", letterSpacing: "0px" }],
        "3xl": ["30px", { lineHeight: "36px", letterSpacing: "0px" }],
        "4xl": ["36px", { lineHeight: "40px", letterSpacing: "0px" }],
      },
      fontWeight: {
        thin: "100",
        extralight: "200",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
      // SPACING - 8px BASE UNIT
      spacing: {
        0.5: "2px",
        1: "4px",
        1.5: "6px",
        2: "8px",
        2.5: "10px",
        3: "12px",
        3.5: "14px",
        4: "16px",
        5: "20px",
        6: "24px",
        7: "28px",
        8: "32px",
        9: "36px",
        10: "40px",
        12: "48px",
        14: "56px",
        16: "64px",
        20: "80px",
        24: "96px",
        28: "112px",
        32: "128px",
        36: "144px",
        40: "160px",
        44: "176px",
        48: "192px",
        52: "208px",
        56: "224px",
        60: "240px",
        64: "256px",
        72: "288px",
        80: "320px",
        96: "384px",
      },
      // BORDER RADIUS
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
        full: "9999px",
      },
      // ANIMATIONS
      animation: {
        "border": "border 4s linear infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-in",
        "slide-in-up": "slide-in-up 0.3s ease-out",
        "slide-in-down": "slide-in-down 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "bounce-subtle": "bounce-subtle 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "message-enter": "message-enter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "reaction-pop": "reaction-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "typing-pulse": "typing-pulse 0.6s ease-in-out infinite",
      },
      keyframes: {
        border: {
          to: { "--border-angle": "360deg" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "slide-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-down": {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "bounce-subtle": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "message-enter": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "reaction-pop": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "typing-pulse": {
          "0%, 100%": { transform: "translateY(0)", opacity: "0.6" },
          "50%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      // TRANSITIONS
      transitionDuration: {
        150: "150ms",
        200: "200ms",
        300: "300ms",
        400: "400ms",
        500: "500ms",
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "elastic": "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
      },
      // BACKDROP BLUR
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      // MAX WIDTH
      maxWidth: {
        chat: "56rem",
        sidebar: "20rem",
        "sidebar-lg": "24rem",
        "right-panel": "22.5rem",
      },
      // WIDTH
      width: {
        sidebar: "20rem",
        "sidebar-lg": "24rem",
        "right-panel": "22.5rem",
      },
      // HEIGHT
      height: {
        "chat-header": "70px",
        "message-input": "120px",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: false,
  },
};
