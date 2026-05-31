import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

const saved = typeof window !== "undefined"
  ? localStorage.getItem("chatify-theme") || "dark"
  : "dark";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("chatify-theme", theme);
}

// Apply immediately on load
if (typeof window !== "undefined") applyTheme(saved);

export const useThemeStore = create((set, get) => ({
  theme: saved,   // "dark" | "light"

  setTheme: async (theme) => {
    applyTheme(theme);
    set({ theme });
    // Persist to backend (best-effort)
    try {
      await axiosInstance.put("/auth/settings", { theme });
    } catch { /* silent */ }
  },

  toggleTheme: () => {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },

  // Sync from server after login
  syncFromServer: (serverTheme) => {
    if (serverTheme && serverTheme !== get().theme) {
      applyTheme(serverTheme);
      set({ theme: serverTheme });
    }
  },
}));
