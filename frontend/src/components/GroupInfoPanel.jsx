import { useState } from "react";
import { X, Hash, UserMinus, Crown, LogOut, Trash2, UserPlus, Users } from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

export default function GroupInfoPanel({ onClose, onAddMembers }) {
  const { selectedGroup, leaveGroup, deleteGroup, removeMember } = useGroupStore();
  const { authUser } = useAuthStore();

  if (!selectedGroup) return null;

  const isAdmin = selectedGroup.admins?.some((a) => (a._id || a) === authUser._id);
  const isCreator = (selectedGroup.createdBy?._id || selectedGroup.createdBy) === authUser._id;

  return (
    <div className="w-80 flex-shrink-0 h-full bg-slate-900/80 border-l border-white/5 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-[70px] flex items-center justify-between px-4 border-b border-white/5 flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-100">Group Info</h3>
        <button onClick={onClose} className="btn-icon-sm text-slate-400 hover:text-slate-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group avatar & name */}
        <div className="flex flex-col items-center gap-3 py-6 px-4">
          <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center overflow-hidden">
            {selectedGroup.avatar ? (
              <img src={selectedGroup.avatar} alt={selectedGroup.name} className="w-full h-full object-cover" />
            ) : (
              <Hash className="w-9 h-9 text-slate-400" />
            )}
          </div>
          <div className="text-center">
            <h2 className="text-base font-semibold text-slate-100">{selectedGroup.name}</h2>
            {selectedGroup.description && (
              <p className="text-xs text-slate-500 mt-1 max-w-[220px]">{selectedGroup.description}</p>
            )}
            <p className="text-xs text-slate-600 mt-1">{selectedGroup.members?.length} members</p>
          </div>
        </div>

        {/* Members section */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Members</span>
            </div>
            {isAdmin && (
              <button
                onClick={onAddMembers}
                className="flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300 transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add
              </button>
            )}
          </div>

          <div className="space-y-1">
            {selectedGroup.members?.map((member) => {
              const memberId = member._id || member;
              const memberIsAdmin = selectedGroup.admins?.some((a) => (a._id || a) === memberId);
              const memberIsCreator = (selectedGroup.createdBy?._id || selectedGroup.createdBy) === memberId;
              const isSelf = memberId === authUser._id;

              return (
                <div key={memberId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 group transition-colors">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
                    {member.profilePic ? (
                      <img src={member.profilePic} alt={member.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-slate-300">
                        {member.fullName?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-200 truncate">
                        {isSelf ? "You" : member.fullName}
                      </span>
                      {memberIsCreator && (
                        <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" title="Creator" />
                      )}
                      {memberIsAdmin && !memberIsCreator && (
                        <span className="text-[9px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded font-medium">
                          Admin
                        </span>
                      )}
                    </div>
                    {member.email && (
                      <p className="text-xs text-slate-500 truncate">{member.email}</p>
                    )}
                  </div>

                  {/* Admin actions */}
                  {isAdmin && !isSelf && !memberIsCreator && (
                    <button
                      onClick={() => removeMember(selectedGroup._id, memberId)}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded"
                      title="Remove from group"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger zone */}
        <div className="px-4 pb-6 space-y-2">
          <div className="h-px bg-white/5" />
          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mt-3 mb-2">Actions</p>

          {!isCreator && (
            <button
              onClick={() => leaveGroup(selectedGroup._id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Leave Group
            </button>
          )}

          {isCreator && (
            <button
              onClick={() => deleteGroup(selectedGroup._id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Delete Group
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
