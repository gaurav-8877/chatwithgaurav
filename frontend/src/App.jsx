import { Navigate, Route, Routes } from "react-router";
import { useAuthStore }  from "./store/useAuthStore";
import { useCallStore }  from "./store/useCallStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect }     from "react";
import { Toaster }       from "react-hot-toast";

import ChatPage      from "./pages/ChatPage";
import LoginPage     from "./pages/LoginPage";
import SignUpPage    from "./pages/SignUpPage";
import PhoneAuthPage from "./pages/PhoneAuthPage";
import PageLoader    from "./components/PageLoader";
import { CallOverlay, IncomingCallBanner } from "./components/CallOverlay";

export default function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();
  const { subscribeToCallEvents, unsubscribeFromCallEvents } = useCallStore();
  const { syncFromServer } = useThemeStore();

  useEffect(() => { checkAuth(); }, [checkAuth]);

  // Wire call events whenever socket is ready
  useEffect(() => {
    if (!authUser) return;
    subscribeToCallEvents();
    // Sync theme from user profile
    if (authUser.theme) syncFromServer(authUser.theme);
    return () => unsubscribeFromCallEvents();
  }, [authUser, subscribeToCallEvents, unsubscribeFromCallEvents, syncFromServer]);

  if (isCheckingAuth) return <PageLoader />;

  return (
    <div className="h-screen overflow-hidden" style={{ background: "var(--bg)", color: "var(--t1)" }}>
      <Routes>
        <Route path="/"           element={authUser ? <ChatPage />      : <Navigate to="/login" />} />
        <Route path="/login"      element={!authUser ? <LoginPage />    : <Navigate to="/" />} />
        <Route path="/signup"     element={!authUser ? <SignUpPage />   : <Navigate to="/" />} />
        <Route path="/phone-auth" element={!authUser ? <PhoneAuthPage />: <Navigate to="/" />} />
      </Routes>

      {/* Global call UI */}
      <IncomingCallBanner />
      <CallOverlay />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "var(--s3)",
            color: "var(--t1)",
            border: "1px solid var(--border-2)",
            borderRadius: 14,
            fontSize: 13,
          },
        }}
      />
    </div>
  );
}
