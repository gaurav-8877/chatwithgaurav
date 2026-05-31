import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { XIcon } from "lucide-react";
import { useState } from "react";

function MessageReactions({ message, onReact }) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const { authUser } = useAuthStore();
  const { removeReaction } = useChatStore();

  const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏"];

  if (!message.reactions || message.reactions.length === 0) {
    return null;
  }

  // Group reactions by emoji
  const groupedReactions = {};
  message.reactions.forEach((reaction) => {
    if (!groupedReactions[reaction.emoji]) {
      groupedReactions[reaction.emoji] = [];
    }
    groupedReactions[reaction.emoji].push(reaction.userId);
  });

  return (
    <div className="flex flex-wrap gap-1 mt-2 items-center">
      {Object.entries(groupedReactions).map(([emoji, userIds]) => {
        const userReacted = userIds.some((id) => id.toString() === authUser._id.toString());
        return (
          <div
            key={emoji}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
              userReacted
                ? "bg-cyan-500/30 border border-cyan-500/50"
                : "bg-slate-700/30 border border-slate-700/50 hover:bg-slate-700/50"
            }`}
            onClick={() => {
              if (userReacted) {
                removeReaction(message._id, emoji);
              } else {
                onReact(emoji);
              }
            }}
            title={userIds.length > 0 ? `Reacted by ${userIds.length}` : ""}
          >
            <span>{emoji}</span>
            {userIds.length > 1 && <span className="text-slate-400">{userIds.length}</span>}
          </div>
        );
      })}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-700/30 hover:bg-slate-700/50 text-xs transition-colors"
          title="Add reaction"
        >
          +
        </button>

        {showReactionPicker && (
          <div className="absolute bottom-full right-0 mb-2 bg-slate-800 rounded-lg shadow-2xl p-2 z-50 flex gap-1">
            {reactionEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(emoji);
                  setShowReactionPicker(false);
                }}
                className="text-xl hover:bg-slate-700 rounded p-1 transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageReactions;
