import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import NoChatsFound from "./NoChatsFound";
import { useAuthStore } from "../store/useAuthStore";
import { MessageCircle } from "lucide-react";

function ChatsList({ searchTerm = "" }) {
  const { getMyChatPartners, chats, isUsersLoading, setSelectedUser, selectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();

  useEffect(() => {
    getMyChatPartners();
  }, [getMyChatPartners]);

  const filteredChats = chats.filter((chat) =>
    chat.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort chats by last message timestamp (newest first)
  const sortedChats = [...filteredChats].sort((a, b) => {
    const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  const getLastMessagePreview = (chat) => {
    if (!chat.lastMessage) return "No messages yet";

    const { lastMessage } = chat;
    const isFromMe = lastMessage.senderId === authUser._id;

    let preview = lastMessage.text || (lastMessage.image ? "📷 Image" : "");

    // Truncate long messages
    if (preview.length > 50) {
      preview = preview.substring(0, 50) + "...";
    }

    return isFromMe ? `You: ${preview}` : preview;
  };

  const formatTimeAgo = (date) => {
    if (!date) return "";
    const now = new Date();
    const time = new Date(date);
    const diff = now - time;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return time.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (isUsersLoading) return <UsersLoadingSkeleton />;
  if (chats.length === 0) return <NoChatsFound />;
  if (filteredChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <MessageCircle className="w-8 h-8 text-tertiary mb-3 opacity-50" />
        <p className="text-sm text-tertiary">No chats found</p>
      </div>
    );
  }

  return (
    <>
      {sortedChats.map((chat) => {
        const isActive = selectedUser?._id === chat._id;
        const isOnline = onlineUsers.includes(chat._id);

        return (
          <div
            key={chat._id}
            onClick={() => setSelectedUser(chat)}
            className={`group relative rounded-lg cursor-pointer transition-all duration-200 p-3 border ${
              isActive
                ? "bg-surface-tertiary border-brand-500/50 shadow-glow"
                : "bg-surface-tertiary/50 border-divider hover:bg-surface-tertiary hover:border-divider/80"
            }`}
          >
            {/* Active indicator bar */}
            {isActive && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand-500 to-brand-600 rounded-l-lg" />
            )}

            <div className="flex items-center gap-3 pl-2">
              {/* Avatar with status */}
              <div className="relative flex-shrink-0">
                <img
                  src={chat.profilePic || "/avatar.png"}
                  alt={chat.fullName}
                  className="w-12 h-12 rounded-full object-cover ring-2 ring-surface-secondary group-hover:ring-brand-500/30 transition-all"
                />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-secondary transition-all ${
                    isOnline
                      ? "bg-green-500 animate-pulse-glow"
                      : "bg-slate-500"
                  }`}
                />
              </div>

              {/* Chat info */}
              <div className="flex-1 min-w-0">
                {/* Name and time */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-primary truncate">
                    {chat.fullName}
                  </h4>
                  <span className="text-xs text-tertiary flex-shrink-0">
                    {formatTimeAgo(chat.lastMessage?.createdAt)}
                  </span>
                </div>

                {/* Last message preview */}
                <p className="text-xs text-secondary truncate line-clamp-1">
                  {getLastMessagePreview(chat)}
                </p>
              </div>

              {/* Unread badge */}
              {chat.unreadCount > 0 && (
                <div className="flex-shrink-0 ml-auto">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold animate-pulse-glow">
                    {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                  </div>
                </div>
              )}
            </div>

            {/* Hover overlay */}
            {!isActive && (
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            )}
          </div>
        );
      })}
    </>
  );
}

export default ChatsList;
