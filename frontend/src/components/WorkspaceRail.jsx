import { MessageSquare, Users, Bot, Settings, LogOut, Bell } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const NAV = [
  { id: "dms",      icon: MessageSquare, label: "Messages"    },
  { id: "groups",   icon: Users,         label: "Groups"      },
  { id: "ai",       icon: Bot,           label: "AI Assistant"},
  { id: "settings", icon: Settings,      label: "Settings"    },
];

export default function WorkspaceRail({ active, onChange }) {
  const { authUser, logout } = useAuthStore();
  const { chats } = useChatStore();

  const totalUnread = chats.reduce((n, c) => n + (c.unreadCount || 0), 0);

  return (
    <aside
      className="flex-shrink-0 flex flex-col items-center py-4 gap-1"
      style={{ width: 72, background: "#09090B", borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Logo mark */}
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 flex-shrink-0 shadow-glow-sm"
        style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)" }}
      >
        <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 w-full px-2 flex-1">
        {NAV.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          const showBadge = id === "dms" && totalUnread > 0;

          return (
            <button
              key={id}
              title={label}
              onClick={() => onChange(id)}
              className={`rail-item w-full ${isActive ? "active" : ""}`}
            >
              {/* Active left bar */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                  style={{ width: 3, height: 22, background: "#6D5DFC", marginLeft: -8 }}
                />
              )}

              <Icon
                className="w-5 h-5"
                strokeWidth={isActive ? 2.2 : 1.8}
              />

              {/* Unread badge */}
              {showBadge && (
                <span
                  className="absolute top-1.5 right-1.5 w-[18px] h-[18px] flex items-center justify-center
                             rounded-full text-[9px] font-bold text-white"
                  style={{ background: "#6D5DFC" }}
                >
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}

              {/* Tooltip */}
              <span
                className="pointer-events-none absolute left-14 px-2.5 py-1.5 rounded-xl text-xs font-medium
                           text-white whitespace-nowrap opacity-0 group-hover:opacity-100 z-50 transition-opacity"
                style={{ background: "#27272A", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: logout + avatar */}
      <div className="flex flex-col items-center gap-2 px-2 mt-auto">
        <button
          onClick={logout}
          title="Log out"
          className="rail-item w-full hover:text-danger hover:bg-danger/10"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.8} />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
          style={{ border: "2px solid rgba(255,255,255,0.10)" }}
        >
          {authUser?.profilePic ? (
            <img
              src={authUser.profilePic}
              alt={authUser.fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#6D5DFC,#8B5CF6)" }}
            >
              {authUser?.fullName?.[0]?.toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
