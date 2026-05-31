import { Pin, Trash2 } from "lucide-react";

export default function PinnedMessages({ selectedUser }) {
  // Mock pinned messages
  const pinnedMessages = [
    {
      id: 1,
      text: "Don't forget the meeting tomorrow at 2 PM",
      author: "You",
      time: "2 days ago",
    },
    {
      id: 2,
      text: "Project deadline extended to next Friday",
      author: selectedUser?.fullName,
      time: "1 week ago",
    },
  ];

  if (pinnedMessages.length === 0) {
    return (
      <div className="text-center py-6">
        <Pin className="w-8 h-8 text-tertiary mx-auto mb-2 opacity-50" />
        <p className="text-sm text-tertiary">No pinned messages</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {pinnedMessages.map((message) => (
        <div
          key={message.id}
          className="p-3 bg-surface-tertiary/50 rounded-lg border border-divider hover:bg-surface-tertiary/80 transition-colors group"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-secondary">
                  {message.author}
                </p>
                <span className="text-xs text-tertiary">{message.time}</span>
              </div>
              <p className="text-sm text-primary line-clamp-3">{message.text}</p>
            </div>
            <button className="btn-icon-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <Trash2 className="w-4 h-4 text-tertiary hover:text-red-400" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
