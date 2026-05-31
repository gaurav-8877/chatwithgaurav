import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,
  groupTypingMap: {}, // { groupId: { senderId, senderName } | null }
  replyingTo: null,
  editingMessage: null,

  setSelectedGroup: (group) => {
    set({ selectedGroup: group, groupMessages: [], replyingTo: null, editingMessage: null });
  },

  setReplyingTo: (msg) => set({ replyingTo: msg }),
  setEditingMessage: (msg) => set({ editingMessage: msg }),

  // ─── Fetch ────────────────────────────────────────────────────────────────

  fetchGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  fetchGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  // ─── Create / Update / Delete ─────────────────────────────────────────────

  createGroup: async ({ name, description, memberIds, avatar }) => {
    try {
      const res = await axiosInstance.post("/groups", { name, description, memberIds, avatar });
      set({ groups: [res.data, ...get().groups] });

      const socket = useAuthStore.getState().socket;
      socket?.emit("joinGroupRoom", { groupId: res.data._id });

      toast.success("Group created!");
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
      return null;
    }
  },

  updateGroup: async (groupId, updates) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, updates);
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Group updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update group");
    }
  },

  addMembers: async (groupId, memberIds) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, { memberIds });
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data : g)),
        selectedGroup: get().selectedGroup?._id === groupId ? res.data : get().selectedGroup,
      });
      toast.success("Members added");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add members");
    }
  },

  removeMember: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/members/${memberId}`);
      set({
        groups: get().groups.map((g) => (g._id === groupId ? res.data.group : g)),
        selectedGroup:
          get().selectedGroup?._id === groupId ? res.data.group : get().selectedGroup,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  },

  leaveGroup: async (groupId) => {
    const { authUser } = useAuthStore.getState();
    await get().removeMember(groupId, authUser._id);
    set({
      groups: get().groups.filter((g) => g._id !== groupId),
      selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup,
    });
    toast.success("Left group");
  },

  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);
      set({
        groups: get().groups.filter((g) => g._id !== groupId),
        selectedGroup: get().selectedGroup?._id === groupId ? null : get().selectedGroup,
      });
      toast.success("Group deleted");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete group");
    }
  },

  // ─── Messaging ────────────────────────────────────────────────────────────

  sendGroupMessage: async (groupId, messageData) => {
    const { replyingTo } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      _id: tempId,
      senderId: { _id: authUser._id, fullName: authUser.fullName, profilePic: authUser.profilePic },
      groupId,
      text: messageData.text,
      image: messageData.image,
      replyTo: replyingTo || null,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      reactions: [],
      isEdited: false,
    };

    set({ groupMessages: [...get().groupMessages, optimistic], replyingTo: null });

    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages`, {
        ...messageData,
        replyTo: replyingTo?._id || null,
      });

      set({
        groupMessages: get().groupMessages.map((m) => (m._id === tempId ? res.data : m)),
        editingMessage: null,
        groups: get().groups.map((g) =>
          g._id === groupId
            ? { ...g, lastMessage: res.data, lastMessageAt: res.data.createdAt }
            : g
        ),
      });
    } catch (err) {
      set({ groupMessages: get().groupMessages.filter((m) => m._id !== tempId) });
      toast.error(err.response?.data?.message || "Failed to send message");
    }
  },

  editGroupMessage: async (groupId, messageId, text) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}/messages/${messageId}`, { text });
      set({
        groupMessages: get().groupMessages.map((m) =>
          m._id === messageId ? { ...m, text, isEdited: true, updatedAt: res.data.updatedAt } : m
        ),
        editingMessage: null,
      });
      toast.success("Message edited");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to edit");
    }
  },

  deleteGroupMessage: async (groupId, messageId, deleteFor) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}/messages/${messageId}`, {
        data: { deleteFor },
      });

      if (deleteFor === "everyone") {
        set({
          groupMessages: get().groupMessages.map((m) =>
            m._id === messageId ? { ...m, deletedForEveryone: true, text: "This message was deleted", image: null } : m
          ),
        });
      } else {
        set({ groupMessages: get().groupMessages.filter((m) => m._id !== messageId) });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  },

  addGroupReaction: async (groupId, messageId, emoji) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/messages/${messageId}/reaction`, { emoji });
      set({
        groupMessages: get().groupMessages.map((m) => (m._id === messageId ? res.data : m)),
      });
    } catch (err) {
      console.error("Failed to add group reaction:", err);
    }
  },

  removeGroupReaction: async (groupId, messageId, emoji) => {
    try {
      const res = await axiosInstance.delete(`/groups/${groupId}/messages/${messageId}/reaction/${emoji}`);
      set({
        groupMessages: get().groupMessages.map((m) => (m._id === messageId ? res.data : m)),
      });
    } catch (err) {
      console.error("Failed to remove group reaction:", err);
    }
  },

  // ─── Real-time Socket Subscription ────────────────────────────────────────

  subscribeToGroupMessages: (groupId) => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const { isSoundEnabled } = get();

    socket.off("newGroupMessage");
    socket.off("groupMessageDeleted");
    socket.off("groupMessageEdited");
    socket.off("groupReactionAdded");
    socket.off("groupReactionRemoved");
    socket.off("groupUpdated");
    socket.off("groupDeleted");
    socket.off("addedToGroup");
    socket.off("removedFromGroup");
    socket.off("groupTyping");
    socket.off("groupStoppedTyping");

    socket.on("newGroupMessage", (msg) => {
      if (msg.groupId !== groupId) {
        // Update last message for other groups in sidebar
        set({
          groups: get().groups.map((g) =>
            g._id === msg.groupId
              ? { ...g, lastMessage: msg, lastMessageAt: msg.createdAt }
              : g
          ),
        });
        return;
      }

      const exists = get().groupMessages.some((m) => m._id === msg._id);
      if (!exists) {
        set({ groupMessages: [...get().groupMessages, msg] });
      }

      // Refresh sidebar sort
      set({
        groups: get().groups.map((g) =>
          g._id === groupId ? { ...g, lastMessage: msg, lastMessageAt: msg.createdAt } : g
        ),
      });
    });

    socket.on("groupMessageDeleted", ({ messageId, deleteFor }) => {
      if (deleteFor === "everyone") {
        set({
          groupMessages: get().groupMessages.map((m) =>
            m._id === messageId
              ? { ...m, deletedForEveryone: true, text: "This message was deleted", image: null }
              : m
          ),
        });
      } else {
        set({ groupMessages: get().groupMessages.filter((m) => m._id !== messageId) });
      }
    });

    socket.on("groupMessageEdited", ({ messageId, text, updatedAt }) => {
      set({
        groupMessages: get().groupMessages.map((m) =>
          m._id === messageId ? { ...m, text, isEdited: true, updatedAt } : m
        ),
      });
    });

    socket.on("groupReactionAdded", ({ messageId, message }) => {
      set({
        groupMessages: get().groupMessages.map((m) => (m._id === messageId ? message : m)),
      });
    });

    socket.on("groupReactionRemoved", ({ messageId, message }) => {
      set({
        groupMessages: get().groupMessages.map((m) => (m._id === messageId ? message : m)),
      });
    });

    socket.on("groupUpdated", (updated) => {
      set({
        groups: get().groups.map((g) => (g._id === updated._id ? updated : g)),
        selectedGroup: get().selectedGroup?._id === updated._id ? updated : get().selectedGroup,
      });
    });

    socket.on("groupDeleted", ({ groupId: deletedId }) => {
      set({
        groups: get().groups.filter((g) => g._id !== deletedId),
        selectedGroup: get().selectedGroup?._id === deletedId ? null : get().selectedGroup,
        groupMessages: get().selectedGroup?._id === deletedId ? [] : get().groupMessages,
      });
      if (get().selectedGroup?._id === deletedId) {
        toast("This group was deleted by its creator.");
      }
    });

    socket.on("addedToGroup", (group) => {
      const exists = get().groups.some((g) => g._id === group._id);
      if (!exists) {
        set({ groups: [group, ...get().groups] });
        socket.emit("joinGroupRoom", { groupId: group._id });
        toast.success(`You were added to "${group.name}"`);
      }
    });

    socket.on("removedFromGroup", ({ groupId: removedId }) => {
      set({
        groups: get().groups.filter((g) => g._id !== removedId),
        selectedGroup: get().selectedGroup?._id === removedId ? null : get().selectedGroup,
      });
      toast("You were removed from a group.");
    });

    socket.on("groupTyping", ({ groupId: gId, senderId, senderName }) => {
      if (gId === groupId) {
        set({ groupTypingMap: { ...get().groupTypingMap, [gId]: { senderId, senderName } } });
      }
    });

    socket.on("groupStoppedTyping", ({ groupId: gId }) => {
      const map = { ...get().groupTypingMap };
      delete map[gId];
      set({ groupTypingMap: map });
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newGroupMessage");
    socket.off("groupMessageDeleted");
    socket.off("groupMessageEdited");
    socket.off("groupReactionAdded");
    socket.off("groupReactionRemoved");
    socket.off("groupUpdated");
    socket.off("groupDeleted");
    socket.off("addedToGroup");
    socket.off("removedFromGroup");
    socket.off("groupTyping");
    socket.off("groupStoppedTyping");
  },
}));
