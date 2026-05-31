import { UserPlus, MoreVertical } from "lucide-react";

export default function ConversationMembers({ selectedUser }) {
  // Mock members data (for group chats)
  const members = [
    {
      id: 1,
      name: "You",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop",
      role: "Owner",
      status: "online",
    },
    {
      id: 2,
      name: "John Doe",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop",
      role: "Member",
      status: "online",
    },
    {
      id: 3,
      name: "Jane Smith",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop",
      role: "Member",
      status: "offline",
    },
  ];

  // For direct messages, show just the recipient
  if (selectedUser && !selectedUser.isGroup) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-surface-tertiary/50 rounded-lg">
          <div className="flex items-center gap-3">
            <img
              src={selectedUser.profilePic}
              alt={selectedUser.fullName}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-primary">
                {selectedUser.fullName}
              </p>
              <p className="text-xs text-tertiary">Active now</p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>
    );
  }

  // For group chats
  return (
    <div className="space-y-3">
      {/* Add member button */}
      <button className="w-full px-3 py-2 bg-brand-500/20 text-brand-300 rounded-lg hover:bg-brand-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium border border-brand-500/30">
        <UserPlus className="w-4 h-4" />
        Add member
      </button>

      {/* Members list */}
      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-tertiary/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={member.avatar}
                  alt={member.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div
                  className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-surface-secondary ${
                    member.status === "online" ? "bg-green-500" : "bg-slate-500"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-primary">{member.name}</p>
                <p className="text-xs text-tertiary">{member.role}</p>
              </div>
            </div>
            <button className="btn-icon-sm opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
