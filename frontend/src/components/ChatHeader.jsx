import { X, Phone, Video, Search, MoreVertical } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import TypingIndicator from "./TypingIndicator";

function ChatHeader() {
  const { selectedUser, setSelectedUser, isTyping } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [lastSeen, setLastSeen] = useState(null);
  const [showMenu, setShowMenu] = useState(false);

  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    if (isOnline) {
      setLastSeen(null);
    } else {
      setLastSeen(new Date(Date.now() - Math.random() * 3600000));
    }
  }, [isOnline]);

  const formatLastSeen = (date) => {
    if (!date) return "";
    const minutes = Math.floor((Date.now() - new Date(date)) / 60000);
    if (minutes < 1) return "last seen just now";
    if (minutes < 60) return `last seen ${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `last seen ${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `last seen ${days}d ago`;
  };

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="flex-shrink-0 h-chat-header bg-surface-secondary border-b border-divider px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
      {/* Left: User info */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Close button (mobile only) */}
        <button
          onClick={() => setSelectedUser(null)}
          className="md:hidden btn-icon text-secondary"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <img
            src={selectedUser.profilePic || "/avatar.png"}
            alt={selectedUser.fullName}
            className="w-10 sm:w-12 h-10 sm:h-12 rounded-full object-cover"
          />
          <div
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-secondary ${
              isOnline ? "bg-green-500 animate-pulse-glow" : "bg-slate-500"
            }`}
          />
        </div>

        {/* User details */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-primary truncate">
            {selectedUser.fullName}
          </h3>
          <div className="text-xs sm:text-sm text-secondary truncate">
            {isTyping ? (
              <span className="inline-flex items-center gap-1">
                <span className="animate-pulse">typing</span>
              </span>
            ) : (
              <span className={isOnline ? "text-green-400" : "text-secondary"}>
                {isOnline ? "Active now" : formatLastSeen(lastSeen)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Action buttons */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Voice call */}
        <button className="btn-icon text-secondary hover:text-primary hover:bg-surface-tertiary/50">
          <Phone className="w-5 h-5" />
        </button>

        {/* Video call */}
        <button className="btn-icon text-secondary hover:text-primary hover:bg-surface-tertiary/50">
          <Video className="w-5 h-5" />
        </button>

        {/* Search (desktop only) */}
        <button className="hidden sm:flex btn-icon text-secondary hover:text-primary hover:bg-surface-tertiary/50">
          <Search className="w-5 h-5" />
        </button>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="btn-icon text-secondary hover:text-primary hover:bg-surface-tertiary/50"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-surface-tertiary border border-divider rounded-lg shadow-glass p-2 space-y-1 z-50 animate-fade-in">
              <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-surface-primary/50 rounded transition-colors">
                View profile
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-surface-primary/50 rounded transition-colors">
                Search messages
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-surface-primary/50 rounded transition-colors">
                Mute conversation
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-surface-primary/50 rounded transition-colors">
                Clear chat
              </button>
              <div className="h-px bg-divider my-1" />
              <button className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded transition-colors">
                Block user
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatHeader;
