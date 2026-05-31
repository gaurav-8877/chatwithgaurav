import { useState, useCallback } from "react";
import { Search, Edit, Hash, Filter } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";

/* ── helpers ──────────────────────────────────────────────────────────────── */
const fmtTime = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000)  return "now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
  if (diff < 86400000) return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (diff < 604800000) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

/* ── Avatar with optional online ring ────────────────────────────────────── */
function Avatar({ src, name, size = 11, online = false }) {
  return (
    <div className={`relative flex-shrink-0 w-${size} h-${size} rounded-full`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full rounded-full object-cover" />
      ) : (
        <div
          className="w-full h-full rounded-full flex items-center justify-center text-sm font-semibold text-white"
          style={{ background: `hsl(${(name?.charCodeAt(0) || 65) * 7 % 360}, 60%, 42%)` }}
        >
          {name?.[0]?.toUpperCase()}
        </div>
      )}
      {online && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{ background: "#22C55E", borderColor: "#18181B" }}
        />
      )}
    </div>
  );
}

/* ── DM Conversation Card ─────────────────────────────────────────────────── */
function DmCard({ chat, isSelected, onSelect }) {
  const { onlineUsers } = useAuthStore();
  const { isTyping, typingUser } = useChatStore();

  const isOnline   = onlineUsers.includes(chat._id);
  const isTypingNow = isTyping && typingUser?.senderId === chat._id;
  const lastMsg    = chat.lastMessage;
  const preview    = lastMsg?.image ? "📷 Photo" : lastMsg?.text || "No messages yet";
  const time       = fmtTime(lastMsg?.createdAt);
  const unread     = chat.unreadCount || 0;

  return (
    <button
      className={`conv-card w-full text-left ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(chat)}
    >
      <Avatar src={chat.profilePic} name={chat.fullName} size={11} online={isOnline} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white truncate">{chat.fullName}</span>
          {time && (
            <span className="text-2xs flex-shrink-0" style={{ color: unread ? "#6D5DFC" : "#52525B" }}>
              {time}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs truncate" style={{ color: "#71717A" }}>
            {isTypingNow ? (
              <span style={{ color: "#6D5DFC" }} className="italic">typing…</span>
            ) : (
              preview
            )}
          </span>
          {unread > 0 && <span className="unread-badge flex-shrink-0">{unread > 99 ? "99+" : unread}</span>}
        </div>
      </div>
    </button>
  );
}

/* ── Group Card ───────────────────────────────────────────────────────────── */
function GroupCard({ group, isSelected, onSelect }) {
  const lastMsg = group.lastMessage;
  const preview = lastMsg?.text || (lastMsg?.image ? "📷 Photo" : `${group.members?.length || 0} members`);
  const time    = fmtTime(group.lastMessageAt || group.createdAt);

  return (
    <button
      className={`conv-card w-full text-left ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(group)}
    >
      {/* Group avatar */}
      <div
        className="relative flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center overflow-hidden"
        style={{ background: "#27272A", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        {group.avatar ? (
          <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
        ) : (
          <Hash className="w-5 h-5" style={{ color: "#71717A" }} strokeWidth={1.8} />
        )}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold text-white"
          style={{ background: "#3F3F46", border: "1.5px solid #18181B" }}
        >
          {group.members?.length || 0}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-white truncate">{group.name}</span>
          {time && <span className="text-2xs flex-shrink-0" style={{ color: "#52525B" }}>{time}</span>}
        </div>
        <span className="text-xs truncate block" style={{ color: "#71717A" }}>{preview}</span>
      </div>
    </button>
  );
}

/* ── Skeleton loader ──────────────────────────────────────────────────────── */
function CardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="skeleton w-11 h-11 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-2.5 w-1/2" />
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ───────────────────────────────────────────────────────── */
export default function ConversationExplorer({
  section, onNewGroup,
}) {
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("all"); // all | unread | groups | contacts

  /* stores */
  const {
    chats, allContacts, isUsersLoading,
    selectedUser, setSelectedUser,
    activeTab, setActiveTab,
    getMyChatPartners,
  } = useChatStore();

  const {
    groups, isGroupsLoading,
    selectedGroup, setSelectedGroup,
    fetchGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages,
  } = useGroupStore();

  /* ── select DM ────────────────────────────────────────────────────────── */
  const selectDm = useCallback((user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
  }, [setSelectedUser, setSelectedGroup]);

  /* ── select Group ─────────────────────────────────────────────────────── */
  const selectGroup = useCallback(async (group) => {
    setSelectedUser(null);
    setSelectedGroup(group);
    unsubscribeFromGroupMessages();
    await fetchGroupMessages(group._id);
    subscribeToGroupMessages(group._id);
  }, [setSelectedUser, setSelectedGroup, fetchGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages]);

  /* ── derived lists ────────────────────────────────────────────────────── */
  const q = search.toLowerCase();

  const filteredChats = chats.filter(c =>
    c.fullName.toLowerCase().includes(q) &&
    (filter === "all" || (filter === "unread" && c.unreadCount > 0))
  );

  const filteredContacts = allContacts.filter(c =>
    (c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) &&
    !chats.find(ch => ch._id === c._id)   // only show contacts not already in chats
  );

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(q));

  const isDms = section === "dms";
  const isGroupsSection = section === "groups";

  return (
    <div
      className="flex flex-col h-full flex-shrink-0"
      style={{ width: 360, background: "#111827", borderRight: "1px solid rgba(255,255,255,0.05)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white">
            {isDms ? "Messages" : isGroupsSection ? "Groups" : section === "ai" ? "AI Assistant" : "Settings"}
          </h2>
          {isDms && (
            <button className="icon-btn" title="New message">
              <Edit className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
          {isGroupsSection && (
            <button className="icon-btn" onClick={onNewGroup} title="New group">
              <Edit className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: "#52525B" }}
            strokeWidth={1.8}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isDms ? "Search messages…" : isGroupsSection ? "Search groups…" : "Search…"}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-2xl text-white placeholder-zinc-600 focus:outline-none transition-all duration-150"
            style={{
              background: "#18181B",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            onFocus={e => { e.target.style.borderColor = "rgba(109,93,252,0.4)"; }}
            onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.06)"; }}
          />
        </div>

        {/* Filter pills — DMs only */}
        {isDms && (
          <div className="flex gap-1.5">
            {[
              { id: "all",      label: "All"     },
              { id: "unread",   label: "Unread"  },
              { id: "contacts", label: "Contacts"},
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`tab-pill ${filter === id ? "active" : ""}`}
              >
                {label}
                {id === "unread" && chats.reduce((n, c) => n + (c.unreadCount || 0), 0) > 0 && (
                  <span className="ml-1.5 unread-badge" style={{ minWidth: 16, height: 16, fontSize: 9 }}>
                    {chats.reduce((n, c) => n + (c.unreadCount || 0), 0)}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">

        {/* DMs */}
        {isDms && (
          <>
            {isUsersLoading ? (
              Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
            ) : filter === "contacts" ? (
              filteredContacts.length === 0 ? (
                <Empty label="No contacts found" />
              ) : filteredContacts.map(u => (
                <DmCard
                  key={u._id}
                  chat={u}
                  isSelected={selectedUser?._id === u._id}
                  onSelect={selectDm}
                />
              ))
            ) : filteredChats.length === 0 ? (
              <Empty label={filter === "unread" ? "No unread messages" : "No conversations yet"} />
            ) : (
              filteredChats.map(c => (
                <DmCard
                  key={c._id}
                  chat={c}
                  isSelected={selectedUser?._id === c._id}
                  onSelect={selectDm}
                />
              ))
            )}
          </>
        )}

        {/* Groups */}
        {isGroupsSection && (
          <>
            {isGroupsLoading ? (
              Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-12 text-center px-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "#18181B" }}
                >
                  <Hash className="w-7 h-7" style={{ color: "#52525B" }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#A1A1AA" }}>No groups yet</p>
                  <p className="text-xs mt-1" style={{ color: "#52525B" }}>Create one to get started</p>
                </div>
                <button
                  onClick={onNewGroup}
                  className="px-4 py-2 text-sm font-semibold rounded-xl text-white transition-all"
                  style={{ background: "#6D5DFC" }}
                >
                  New Group
                </button>
              </div>
            ) : (
              filteredGroups.map(g => (
                <GroupCard
                  key={g._id}
                  group={g}
                  isSelected={selectedGroup?._id === g._id}
                  onSelect={selectGroup}
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <p className="text-sm" style={{ color: "#52525B" }}>{label}</p>
    </div>
  );
}
