import { Users, Plus, Hash } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export default function GroupList({ onCreateGroup, searchTerm = "" }) {
  const { groups, selectedGroup, setSelectedGroup, fetchGroupMessages, subscribeToGroupMessages, unsubscribeFromGroupMessages, isGroupsLoading } = useGroupStore();
  const { authUser } = useAuthStore();
  const { setSelectedUser } = useChatStore();

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = async (group) => {
    // Deselect DM chat when selecting a group
    setSelectedUser(null);
    setSelectedGroup(group);
    unsubscribeFromGroupMessages();
    await fetchGroupMessages(group._id);
    subscribeToGroupMessages(group._id);
  };

  if (isGroupsLoading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-slate-800 animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-slate-800 rounded animate-pulse w-2/3" />
              <div className="h-2.5 bg-slate-800 rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Create group button */}
      <button
        onClick={onCreateGroup}
        className="mx-3 mb-2 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 text-brand-400 text-sm font-medium transition-all duration-200 group"
      >
        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
        New Group
      </button>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/50 flex items-center justify-center">
            <Users className="w-7 h-7 text-slate-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-400">
              {searchTerm ? "No groups match" : "No groups yet"}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {!searchTerm && "Create one to get started"}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 px-2">
          {filtered.map((group) => {
            const isSelected = selectedGroup?._id === group._id;
            const lastMsg = group.lastMessage;
            const lastMsgText = lastMsg?.text || (lastMsg?.image ? "📷 Photo" : "");
            const senderName = lastMsg?.senderId?.fullName === authUser?.fullName
              ? "You"
              : lastMsg?.senderId?.fullName;

            return (
              <button
                key={group._id}
                onClick={() => handleSelect(group)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-150 group ${
                  isSelected
                    ? "bg-brand-500/15 border border-brand-500/20"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/5">
                    {group.avatar ? (
                      <img src={group.avatar} alt={group.name} className="w-full h-full object-cover" />
                    ) : (
                      <Hash className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-slate-700 rounded-full border border-slate-600 flex items-center justify-center">
                    <span className="text-[8px] text-slate-400 font-bold">{group.members?.length}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold truncate ${isSelected ? "text-brand-300" : "text-slate-200"}`}>
                      {group.name}
                    </span>
                    {group.lastMessageAt && (
                      <span className="text-[10px] text-slate-500 flex-shrink-0">
                        {formatTime(group.lastMessageAt)}
                      </span>
                    )}
                  </div>

                  {lastMsgText ? (
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {senderName ? `${senderName}: ` : ""}{lastMsgText}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {group.members?.length} members
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
