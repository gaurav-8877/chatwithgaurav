import { MessageSquare, Users, Bot, Settings, LogOut, User } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const NAV_ITEMS = [
  { id: "dms", icon: MessageSquare, label: "Messages" },
  { id: "groups", icon: Users, label: "Groups" },
  { id: "ai", icon: Bot, label: "AI Assistant" },
  { id: "settings", icon: Settings, label: "Settings" },
];

export default function IconSidebar({ activeSection, onSectionChange }) {
  const { authUser, logout } = useAuthStore();
  const { chats, allContacts } = useChatStore();

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="w-16 flex-shrink-0 h-full bg-slate-950 border-r border-white/5 flex flex-col items-center py-3 gap-1 z-10">
      {/* App logo */}
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center mb-3 shadow-lg shadow-brand-500/20 flex-shrink-0">
        <MessageSquare className="w-5 h-5 text-white" />
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 w-full px-2 flex-1">
        {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeSection === id;
          const showBadge = id === "dms" && totalUnread > 0;

          return (
            <button
              key={id}
              onClick={() => onSectionChange(id)}
              title={label}
              className={`relative w-full h-11 flex items-center justify-center rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-brand-500/20 text-brand-400"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              {/* Active bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-400 rounded-r-full -ml-2" />
              )}

              <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-105"}`} />

              {/* Unread badge */}
              {showBadge && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}

              {/* Tooltip */}
              <div className="absolute left-14 px-2 py-1 bg-slate-800 border border-white/10 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 shadow-lg z-50">
                {label}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom: avatar + logout */}
      <div className="flex flex-col items-center gap-2 mt-auto px-2">
        <button
          onClick={logout}
          title="Log out"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
          {authUser?.profilePic ? (
            <img src={authUser.profilePic} alt={authUser.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-brand-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
