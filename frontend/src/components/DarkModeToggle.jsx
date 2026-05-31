import { Moon, Sun } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

function DarkModeToggle() {
  const { isDarkMode, toggleDarkMode } = useChatStore();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
      title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      )}
    </button>
  );
}

export default DarkModeToggle;
