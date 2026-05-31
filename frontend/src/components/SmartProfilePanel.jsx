import { useState } from "react";
import { X, Phone, Video, Bell, BellOff, Image as ImageIcon, Link, File, Users, BarChart2, Clock } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useGroupStore } from "../store/useGroupStore";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "media",    label: "Media"    },
  { id: "files",    label: "Files"    },
  { id: "groups",   label: "Groups"   },
];

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-2xl" style={{ background: "#18181B" }}>
      <Icon className="w-4 h-4" style={{ color: "#71717A" }} strokeWidth={1.6} />
      <span className="text-sm font-bold text-white">{value}</span>
      <span className="text-2xs" style={{ color: "#52525B" }}>{label}</span>
    </div>
  );
}

function ActionPill({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-1 py-3 rounded-2xl transition-all duration-150 hover:bg-white/5"
      style={{ background: "#18181B" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: danger ? "rgba(239,68,68,0.15)" : "rgba(109,93,252,0.15)" }}
      >
        <Icon className="w-4 h-4" style={{ color: danger ? "#EF4444" : "#6D5DFC" }} strokeWidth={1.8} />
      </div>
      <span className="text-xs font-medium" style={{ color: "#A1A1AA" }}>{label}</span>
    </button>
  );
}

export default function SmartProfilePanel({ onClose }) {
  const [tab,    setTab]    = useState("overview");
  const [muted,  setMuted]  = useState(false);

  const { selectedUser, messages } = useChatStore();
  const { onlineUsers }            = useAuthStore();
  const { groups }                 = useGroupStore();

  if (!selectedUser) return null;

  const isOnline   = onlineUsers.includes(selectedUser._id);
  const sharedMedia = messages.filter(m => m.image && !m.deletedForEveryone);
  const mutualGroups = groups.filter(g =>
    g.members?.some(m => (m._id || m) === selectedUser._id)
  );

  return (
    <div
      className="flex-shrink-0 flex flex-col h-full"
      style={{ width: 320, background: "#111827", borderLeft: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-[66px] flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span className="text-sm font-semibold text-white">Profile</span>
        <button className="icon-btn" onClick={onClose}><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>

        {/* Hero */}
        <div className="flex flex-col items-center gap-3 px-5 py-6">
          <div className="relative">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
              className="w-20 h-20 rounded-full object-cover"
              style={{ border: isOnline ? "3px solid #22C55E" : "3px solid rgba(255,255,255,0.08)" }}
            />
            {isOnline && (
              <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full"
                style={{ background: "#22C55E", border: "2.5px solid #111827" }} />
            )}
          </div>
          <div className="text-center">
            <h3 className="text-base font-bold text-white">{selectedUser.fullName}</h3>
            <p className="text-xs mt-0.5" style={{ color: isOnline ? "#22C55E" : "#52525B" }}>
              {isOnline ? "Active now" : "Offline"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "#52525B" }}>{selectedUser.email}</p>
          </div>
        </div>

        {/* Action pills */}
        <div className="flex gap-2 px-4 mb-4">
          <ActionPill icon={Phone}                label="Call"  />
          <ActionPill icon={Video}                label="Video" />
          <ActionPill icon={muted ? BellOff : Bell} label={muted ? "Unmute" : "Mute"}
            onClick={() => setMuted(!muted)} />
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 px-3 mb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 pb-3 text-xs font-semibold transition-all duration-150 relative"
              style={{ color: tab === t.id ? "#6D5DFC" : "#52525B" }}
            >
              {t.label}
              {tab === t.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "#6D5DFC" }} />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-4 pb-8 space-y-4">

          {tab === "overview" && (
            <>
              {/* Stats */}
              <div>
                <SectionLabel>Activity</SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  <StatCard icon={ImageIcon}  label="Photos"   value={sharedMedia.length}   />
                  <StatCard icon={Users}       label="Groups"   value={mutualGroups.length}  />
                  <StatCard icon={BarChart2}   label="Messages" value={messages.length}      />
                </div>
              </div>

              {/* Mutual groups */}
              {mutualGroups.length > 0 && (
                <div>
                  <SectionLabel>Mutual Groups</SectionLabel>
                  <div className="space-y-1">
                    {mutualGroups.slice(0, 3).map(g => (
                      <div key={g._id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                        style={{ background: "#18181B" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "#27272A" }}>
                          {g.avatar
                            ? <img src={g.avatar} alt={g.name} className="w-full h-full object-cover rounded-xl" />
                            : <span className="text-xs" style={{ color: "#71717A" }}>#</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{g.name}</p>
                          <p className="text-2xs" style={{ color: "#52525B" }}>{g.members?.length} members</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {tab === "media" && (
            <div>
              <SectionLabel>Shared Photos</SectionLabel>
              {sharedMedia.length === 0 ? (
                <Empty icon={ImageIcon} label="No photos shared yet" />
              ) : (
                <div className="grid grid-cols-3 gap-1.5">
                  {sharedMedia.map((m, i) => (
                    <div key={m._id || i}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                      <img src={m.image} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "files" && (
            <Empty icon={File} label="No files shared yet" />
          )}

          {tab === "groups" && (
            <div>
              <SectionLabel>Mutual Groups ({mutualGroups.length})</SectionLabel>
              {mutualGroups.length === 0
                ? <Empty icon={Users} label="No mutual groups" />
                : mutualGroups.map(g => (
                  <div key={g._id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1"
                    style={{ background: "#18181B" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ background: "#27272A", color: "#71717A" }}>
                      {g.avatar
                        ? <img src={g.avatar} alt="" className="w-full h-full object-cover rounded-xl" />
                        : "#"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{g.name}</p>
                      <p className="text-2xs" style={{ color: "#52525B" }}>{g.members?.length} members</p>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-2xs font-semibold uppercase tracking-widest mb-2" style={{ color: "#3F3F46" }}>
      {children}
    </p>
  );
}

function Empty({ icon: Icon, label }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#18181B" }}>
        <Icon className="w-5 h-5" style={{ color: "#3F3F46" }} />
      </div>
      <p className="text-xs" style={{ color: "#52525B" }}>{label}</p>
    </div>
  );
}
