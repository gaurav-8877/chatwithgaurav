import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare, Users, Bot, Settings,
  Search, Sun, Moon, Volume2, VolumeX, LogOut,
  Pencil, Bell, Shield, Ban, X, Loader2,
} from "lucide-react";
import { axiosInstance }    from "../lib/axios";
import { useChatStore }     from "../store/useChatStore";
import { useGroupStore }    from "../store/useGroupStore";
import { useAuthStore }     from "../store/useAuthStore";
import { useThemeStore }    from "../store/useThemeStore";

import WorkspaceRail        from "../components/WorkspaceRail";
import ConversationExplorer from "../components/ConversationExplorer";
import ChatContainer        from "../components/ChatContainer";
import GroupChatContainer   from "../components/GroupChatContainer";
import SmartProfilePanel    from "../components/SmartProfilePanel";
import GroupInfoPanel       from "../components/GroupInfoPanel";
import CreateGroupModal     from "../components/CreateGroupModal";
import EditProfileModal     from "../components/EditProfileModal";
import toast                from "react-hot-toast";

/* ══════════════════════════════════════════════════════════════════════════
   AI PANEL
   ══════════════════════════════════════════════════════════════════════════ */
function AiPanel() {
  const [msgs,    setMsgs]    = useState([{ role: "assistant", text: "Hi! I can summarise chats, draft replies, translate messages, or answer questions. What do you need?" }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = React.useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const q = input.trim(); setInput("");
    setMsgs(p => [...p, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await axiosInstance.post("/messages/ai", { text: q });
      setMsgs(p => [...p, { role: "assistant", text: res.data?.reply || "I'm not sure about that." }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", text: "Sorry, the AI service is unavailable right now." }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      <div className="flex items-center gap-3 px-5 h-[66px] flex-shrink-0"
        style={{ background: "var(--s2)", borderBottom: "1px solid var(--border)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "var(--grad)" }}>
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>AI Assistant</p>
          <p className="text-[10px]" style={{ color: "var(--t3)" }}>Powered by Claude</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ scrollbarWidth: "none" }}>
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="text-sm leading-relaxed px-4 py-2.5 max-w-[85%]"
              style={{
                background: m.role === "user" ? "var(--bubble-sent)" : "var(--s2)",
                color: "var(--t1)",
                borderRadius: m.role === "user" ? "20px 20px 5px 20px" : "20px 20px 20px 5px",
                border: m.role === "assistant" ? "1px solid var(--border)" : "none",
              }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 px-4 py-3 rounded-[20px_20px_20px_5px]"
              style={{ background: "var(--s2)", border: "1px solid var(--border)" }}>
              {[0,1,2].map(i => (
                <span key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--t3)", animation: `typingBounce 1.2s ease-in-out ${i*0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="px-4 pb-5 pt-2" style={{ background: "var(--bg)" }}>
        <div className="composer">
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Ask anything…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: "var(--t1)" }}
          />
          <button onClick={send} disabled={!input.trim() || loading} className="send-btn">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   GLOBAL SEARCH PANEL
   ══════════════════════════════════════════════════════════════════════════ */
function GlobalSearch({ onClose, onSelectUser }) {
  const [q,       setQ]       = useState("");
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query) => {
    if (!query.trim()) { setUsers([]); return; }
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/auth/search?q=${encodeURIComponent(query)}`);
      setUsers(res.data);
    } catch { toast.error("Search failed"); }
    finally   { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(q), 300);
    return () => clearTimeout(t);
  }, [q, search]);

  return (
    <div className="absolute inset-0 z-30 flex flex-col" style={{ background: "var(--s1)" }}>
      <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "var(--t3)" }} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search users, contacts…"
          className="flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: "var(--t1)" }}
          autoFocus
        />
        <button className="icon-btn-sm" onClick={onClose}><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--accent)" }} /></div>
        ) : users.length === 0 && q ? (
          <p className="text-center py-8 text-sm" style={{ color: "var(--t3)" }}>No users found</p>
        ) : (
          <div className="px-2 py-2 space-y-0.5">
            {users.map(u => (
              <button key={u._id} onClick={() => { onSelectUser(u); onClose(); }}
                className="conv-card w-full">
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: "var(--s3)" }}>
                    {u.profilePic ? <img src={u.profilePic} alt="" className="w-full h-full object-cover" /> : null}
                  </div>
                  {u.status === "online" && <span className="online-dot" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--t1)" }}>{u.fullName}</p>
                  <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   SETTINGS PANEL
   ══════════════════════════════════════════════════════════════════════════ */
function SettingsPanel() {
  const { isSoundEnabled, toggleSound } = useChatStore();
  const { authUser, logout }            = useAuthStore();
  const { theme, toggleTheme }          = useThemeStore();
  const [showEdit,    setShowEdit]      = useState(false);
  const [blockedList, setBlockedList]   = useState([]);
  const [activeTab,   setActiveTab]     = useState("general");

  useEffect(() => {
    if (activeTab === "privacy") {
      axiosInstance.get("/auth/blocked").then(r => setBlockedList(r.data)).catch(() => {});
    }
  }, [activeTab]);

  const unblock = async (id) => {
    try {
      await axiosInstance.delete(`/auth/block/${id}`);
      setBlockedList(p => p.filter(u => u._id !== id));
      toast.success("Unblocked");
    } catch { toast.error("Failed"); }
  };

  const tabs = [
    { id: "general",  label: "General"  },
    { id: "privacy",  label: "Privacy"  },
    { id: "security", label: "Security" },
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 h-[66px] flex-shrink-0"
        style={{ background: "var(--s2)", borderBottom: "1px solid var(--border)" }}>
        <Settings className="w-5 h-5" style={{ color: "var(--t3)" }} />
        <p className="text-sm font-semibold" style={{ color: "var(--t1)" }}>Settings</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ scrollbarWidth: "none" }}>
        {/* Profile card */}
        <div className="flex items-center gap-4 p-4 rounded-2xl mb-4 cursor-pointer transition-colors"
          style={{ background: "var(--s2)", border: "1px solid var(--border)" }}
          onClick={() => setShowEdit(true)}>
          <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0"
            style={{ border: "2px solid var(--border-2)" }}>
            {authUser?.profilePic
              ? <img src={authUser.profilePic} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white"
                  style={{ background: "var(--accent)" }}>
                  {authUser?.fullName?.[0]}
                </div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate" style={{ color: "var(--t1)" }}>{authUser?.fullName}</p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--t3)" }}>
              {authUser?.bio || "Add a bio…"}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--t3)" }}>{authUser?.email}</p>
          </div>
          <Pencil className="w-4 h-4 flex-shrink-0" style={{ color: "var(--t3)" }} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`tab-pill ${activeTab === t.id ? "active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <div className="space-y-1.5">
            {/* Dark mode */}
            <button onClick={toggleTheme}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-colors"
              style={{ background: "var(--s2)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--s3)" }}>
                {theme === "dark" ? <Moon className="w-4 h-4" style={{ color: "var(--t2)" }} /> : <Sun className="w-4 h-4" style={{ color: "var(--t2)" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </p>
                <p className="text-xs" style={{ color: "var(--t3)" }}>Toggle app theme</p>
              </div>
              <div className="relative flex-shrink-0 w-10 h-5 rounded-full transition-all duration-200"
                style={{ background: theme === "dark" ? "var(--accent)" : "var(--s4)" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: theme === "dark" ? "calc(100% - 18px)" : 2 }} />
              </div>
            </button>

            {/* Sounds */}
            <button onClick={toggleSound}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-left transition-colors"
              style={{ background: "var(--s2)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--s3)" }}>
                {isSoundEnabled
                  ? <Volume2 className="w-4 h-4" style={{ color: "var(--t2)" }} />
                  : <VolumeX className="w-4 h-4" style={{ color: "var(--t2)" }} />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>Sounds</p>
                <p className="text-xs" style={{ color: "var(--t3)" }}>Message notification sounds</p>
              </div>
              <div className="relative flex-shrink-0 w-10 h-5 rounded-full transition-all duration-200"
                style={{ background: isSoundEnabled ? "var(--accent)" : "var(--s4)" }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                  style={{ left: isSoundEnabled ? "calc(100% - 18px)" : 2 }} />
              </div>
            </button>
          </div>
        )}

        {activeTab === "privacy" && (
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--t3)" }}>Blocked Users</p>
            {blockedList.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: "var(--t3)" }}>No blocked users</p>
            ) : blockedList.map(u => (
              <div key={u._id} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: "var(--s2)" }}>
                <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0" style={{ background: "var(--s3)" }}>
                  {u.profilePic && <img src={u.profilePic} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--t1)" }}>{u.fullName}</p>
                  <p className="text-xs truncate" style={{ color: "var(--t3)" }}>{u.email}</p>
                </div>
                <button onClick={() => unblock(u._id)}
                  className="text-xs font-semibold px-3 py-1 rounded-xl transition-colors"
                  style={{ background: "var(--s3)", color: "var(--accent)" }}>
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === "security" && (
          <div className="space-y-3">
            <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--s2)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>Session</p>
              <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>JWT-based authentication with secure HTTP-only cookies.</p>
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: "var(--s2)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--t1)" }}>Rate Limiting</p>
              <p className="text-xs mt-1" style={{ color: "var(--t3)" }}>Protected by Arcjet rate limiting on all API routes.</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button onClick={logout}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl mt-4 transition-colors"
          style={{ background: "rgba(239,68,68,0.08)", color: "var(--danger)" }}>
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>

      {showEdit && <EditProfileModal onClose={() => setShowEdit(false)} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ══════════════════════════════════════════════════════════════════════════ */
function EmptyState({ section }) {
  const labels = {
    dms:    { icon: "💬", title: "Select a conversation", sub: "Choose a chat to start messaging" },
    groups: { icon: "#",  title: "Select a group",        sub: "Open a group from the list"      },
  };
  const l = labels[section] || labels.dms;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-12 text-center"
      style={{ background: "var(--bg)" }}>
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
        style={{ background: "var(--s2)", border: "1px solid var(--border)" }}>{l.icon}</div>
      <div>
        <p className="text-base font-semibold" style={{ color: "var(--t1)" }}>{l.title}</p>
        <p className="text-sm mt-1.5" style={{ color: "var(--t3)" }}>{l.sub}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV
   ══════════════════════════════════════════════════════════════════════════ */
const BOT_NAV = [
  { id: "dms",    icon: MessageSquare, label: "Chats"   },
  { id: "groups", icon: Users,         label: "Groups"  },
  { id: "search", icon: Search,        label: "Search"  },
  { id: "ai",     icon: Bot,           label: "AI"      },
  { id: "settings", icon: Settings,   label: "Settings" },
];

function MobileBottomNav({ active, onChange, unread }) {
  return (
    <nav className="md:hidden flex-shrink-0 flex items-center"
      style={{ background: "var(--s2)", borderTop: "1px solid var(--border)", height: 60 }}>
      {BOT_NAV.map(({ id, icon: Icon, label }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}>
            <div className="relative">
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
              {id === "dms" && unread > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 flex items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ background: "var(--accent)" }}>
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: 600 }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   CHAT PAGE
   ══════════════════════════════════════════════════════════════════════════ */
import React from "react";

export default function ChatPage() {
  const [section,         setSection]         = useState("dms");
  const [showProfile,     setShowProfile]     = useState(false);
  const [showGroupInfo,   setShowGroupInfo]   = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGlobalSearch,setShowGlobalSearch]= useState(false);

  const { selectedUser, setSelectedUser, getMyChatPartners, getAllContacts, chats } = useChatStore();
  const { selectedGroup, setSelectedGroup, fetchGroups, subscribeToGroupMessages, unsubscribeFromGroupMessages, fetchGroupMessages } = useGroupStore();

  useEffect(() => {
    getMyChatPartners();
    getAllContacts();
    fetchGroups();
  }, [getMyChatPartners, getAllContacts, fetchGroups]);

  const totalUnread = chats.reduce((n, c) => n + (c.unreadCount || 0), 0);

  const changeSection = useCallback((s) => {
    if (s === "search") { setShowGlobalSearch(true); return; }
    setSection(s);
    if (s !== "dms")    { setSelectedUser(null); setShowProfile(false); }
    if (s !== "groups") { setSelectedGroup(null); setShowGroupInfo(false); }
  }, [setSelectedUser, setSelectedGroup]);

  const selectUser = useCallback((user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    setSection("dms");
  }, [setSelectedUser, setSelectedGroup]);

  const selectGroup = useCallback(async (group) => {
    setSelectedUser(null);
    setSelectedGroup(group);
    unsubscribeFromGroupMessages();
    await fetchGroupMessages(group._id);
    subscribeToGroupMessages(group._id);
    setSection("groups");
  }, [setSelectedUser, setSelectedGroup, fetchGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  const hasChat  = section === "dms"    && !!selectedUser;
  const hasGroup = section === "groups" && !!selectedGroup;
  const showRight= (hasChat && showProfile) || (hasGroup && showGroupInfo);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="flex flex-1 overflow-hidden">

        {/* ── WorkspaceRail (72px, desktop) ─────────────────────────────── */}
        <div className="hidden md:flex">
          <WorkspaceRail active={section} onChange={changeSection} />
        </div>

        {/* ── ConversationExplorer (360px, desktop) ─────────────────────── */}
        {(section === "dms" || section === "groups") && (
          <div className="hidden md:flex relative">
            {showGlobalSearch && (
              <GlobalSearch
                onClose={() => setShowGlobalSearch(false)}
                onSelectUser={selectUser}
              />
            )}
            <ConversationExplorer
              section={section}
              onNewGroup={() => setShowCreateGroup(true)}
            />
          </div>
        )}

        {/* ── Main content ─────────────────────────────────────────────── */}
        <div className="flex-1 flex min-w-0 overflow-hidden relative">

          {/* Mobile: global search overlay */}
          {showGlobalSearch && (
            <div className="absolute inset-0 z-30">
              <GlobalSearch
                onClose={() => setShowGlobalSearch(false)}
                onSelectUser={selectUser}
              />
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {hasChat && <ChatContainer />}
            {hasGroup && <GroupChatContainer onShowInfo={() => setShowGroupInfo(true)} />}
            {section === "ai"       && !hasChat && !hasGroup && <AiPanel />}
            {section === "settings" && <SettingsPanel />}
            {!hasChat && !hasGroup && section !== "ai" && section !== "settings" && (
              <>
                {/* Desktop: show explorer + empty state */}
                <div className="hidden md:flex flex-1">
                  <EmptyState section={section} />
                </div>
                {/* Mobile: show explorer inline */}
                <div className="md:hidden flex-1 relative overflow-hidden">
                  <ConversationExplorer section={section} onNewGroup={() => setShowCreateGroup(true)} />
                </div>
              </>
            )}
          </div>

          {/* Right panel */}
          {showRight && (
            hasChat
              ? <SmartProfilePanel onClose={() => setShowProfile(false)} />
              : <GroupInfoPanel onClose={() => setShowGroupInfo(false)} />
          )}

          {/* Profile tab */}
          {hasChat && !showProfile && (
            <button onClick={() => setShowProfile(true)}
              className="hidden md:flex w-5 items-center justify-center flex-shrink-0 cursor-pointer"
              style={{ background: "var(--s1)", borderLeft: "1px solid var(--border)" }}>
              <div className="w-1 h-8 rounded-full" style={{ background: "var(--accent-m)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileBottomNav active={section} onChange={changeSection} unread={totalUnread} />

      {showCreateGroup && <CreateGroupModal onClose={() => setShowCreateGroup(false)} />}
    </div>
  );
}
