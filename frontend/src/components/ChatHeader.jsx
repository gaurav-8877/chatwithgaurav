import { Phone, Video, Search, MoreVertical, ArrowLeft, Pin, UserX, BellOff } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCallStore } from "../store/useCallStore";
import { useState, useEffect } from "react";

function fmtLastSeen(date) {
  if (!date) return "";
  const m = Math.floor((Date.now() - new Date(date)) / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function ChatHeader({ onShowProfile, onShowSearch, onShowPinned }) {
  const { selectedUser, setSelectedUser, isTyping } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { initiateCall } = useCallStore();
  const [showMenu, setShowMenu] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);

  const isOnline = onlineUsers.includes(selectedUser?._id);

  useEffect(() => {
    setLastSeen(selectedUser?.lastSeen ? new Date(selectedUser.lastSeen) : new Date(Date.now() - Math.random() * 3_600_000));
  }, [isOnline, selectedUser]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setSelectedUser(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedUser]);

  if (!selectedUser) return null;

  const handleCall  = () => initiateCall(selectedUser, "audio");
  const handleVideo = () => initiateCall(selectedUser, "video");

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-4 sm:px-5 h-[66px]"
      style={{ background: "var(--s2)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={() => setSelectedUser(null)} className="md:hidden icon-btn">
          <ArrowLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onShowProfile}
          className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="relative flex-shrink-0">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
              className="w-10 h-10 rounded-full object-cover"
              style={{ border: `2px solid ${isOnline ? "var(--online)" : "var(--border-2)"}` }}
            />
            {isOnline && <span className="online-dot" />}
          </div>

          <div className="min-w-0 text-left">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>
              {selectedUser.fullName}
            </p>
            <p className="text-xs leading-tight truncate" style={{ color: isOnline ? "var(--online)" : "var(--t3)" }}>
              {isTyping ? (
                <span style={{ color: "var(--accent)" }} className="italic">typing…</span>
              ) : isOnline ? "Online" : lastSeen ? `last seen ${fmtLastSeen(lastSeen)}` : "offline"}
            </p>
          </div>
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button className="icon-btn" onClick={handleCall}  title="Voice call">
          <Phone className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <button className="icon-btn" onClick={handleVideo} title="Video call">
          <Video className="w-4 h-4" strokeWidth={1.8} />
        </button>
        <button className="hidden sm:flex icon-btn" onClick={onShowSearch} title="Search messages">
          <Search className="w-4 h-4" strokeWidth={1.8} />
        </button>

        {/* More menu */}
        <div className="relative">
          <button className="icon-btn" onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical className="w-4 h-4" strokeWidth={1.8} />
          </button>
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-2xl py-1.5 z-50 animate-fade-in"
              style={{ background: "var(--s3)", border: "1px solid var(--border-2)", boxShadow: "0 16px 48px rgba(0,0,0,0.4)" }}
              onClick={() => setShowMenu(false)}
            >
              {[
                { label: "View profile",    icon: null, action: onShowProfile  },
                { label: "Search messages", icon: null, action: onShowSearch   },
                { label: "Pinned messages", icon: null, action: onShowPinned   },
              ].map(({ label, action }) => (
                <button key={label} onClick={action}
                  className="w-full flex items-center px-4 py-2 text-sm text-left transition-colors"
                  style={{ color: "var(--t2)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--border)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  {label}
                </button>
              ))}
              <div className="divider mx-4 my-1" />
              <button className="w-full flex items-center px-4 py-2 text-sm text-left transition-colors"
                style={{ color: "var(--danger)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                Block user
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
