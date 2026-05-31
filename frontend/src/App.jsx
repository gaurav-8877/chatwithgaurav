import { Navigate, Route, Routes } from "react-router";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";

import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { isDarkMode } = useChatStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Apply dark mode class to document (always on)
    document.documentElement.classList.add("dark");
  }, []);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="min-h-screen bg-surface-primary text-primary dark relative overflow-hidden">
      {/* Premium Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-surface-primary via-surface-secondary to-surface-primary" />
        
        {/* Glow orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-600 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-5 animate-pulse" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to={"/login"} />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to={"/"} />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />} />
        </Routes>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1E293B",
              color: "#F8FAFC",
              border: "1px solid rgba(148, 163, 184, 0.2)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
            },
          }}
        />
      </div>
    </div>
  );
}

export default App;
