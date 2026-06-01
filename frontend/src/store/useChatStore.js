import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isSoundEnabled: JSON.parse(localStorage.getItem("isSoundEnabled")) === true,
  isDarkMode: JSON.parse(localStorage.getItem("isDarkMode")) !== false,
  isTyping: false,
  typingUser: null,
  replyingTo: null,
  editingMessage: null,
  onlineUsers: [],

  toggleSound: () => {
    localStorage.setItem("isSoundEnabled", !get().isSoundEnabled);
    set({ isSoundEnabled: !get().isSoundEnabled });
  },

  toggleDarkMode: () => {
    const newDarkMode = !get().isDarkMode;
    localStorage.setItem("isDarkMode", newDarkMode);
    set({ isDarkMode: newDarkMode });
  },

  setReplyingTo: (message) => set({ replyingTo: message }),
  setEditingMessage: (message) => set({ editingMessage: message }),
  setTyping: (isTyping) => set({ isTyping }),
  setTypingUser: (user) => set({ typingUser: user }),
  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedUser: async (selectedUser) => {
    if (selectedUser?._id) {
      sessionStorage.setItem("selectedUserId", selectedUser._id);
    } else {
      sessionStorage.removeItem("selectedUserId");
    }
    set({ selectedUser });

    // Mark messages as read when user opens a chat
    if (selectedUser?._id) {
      try {
        console.log("[useChatStore] Marking messages as read for:", selectedUser._id);
        await axiosInstance.post("/messages/read/mark", { userId: selectedUser._id });
        
        // Refresh chats to clear unread badge
        const res = await axiosInstance.get("/messages/chats");
        set({ chats: res.data });
        console.log("[useChatStore] Unread messages marked as read and chats refreshed");
      } catch (error) {
        console.error("[useChatStore] Error marking messages as read:", error);
      }
    }
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },
  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    if (!userId) {
      console.error("[useChatStore] getMessagesByUserId: userId is missing!");
      return;
    }

    set({ isMessagesLoading: true });
    try {
      console.log("[useChatStore] Fetching messages for userId:", userId);
      const res = await axiosInstance.get(`/messages/${userId}`);
      
      console.log("[useChatStore] Messages fetched successfully, count:", res.data.length);
      
      // Sort messages by timestamp to maintain chronological order
      const sortedMessages = res.data.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      set({ messages: sortedMessages });
    } catch (error) {
      console.error("[useChatStore] Error fetching messages:", error);
      toast.error(error.response?.data?.message || "Failed to load messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, replyingTo, editingMessage } = get();
    const { authUser } = useAuthStore.getState();

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      replyTo: replyingTo?._id || null,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      delivered: false,
      isRead: false,
      deletedForEveryone: false,
      deletedFor: [],
      reactions: [],
      isEdited: false,
    };
    
    // Add optimistic message immediately
    set({ messages: [...get().messages, optimisticMessage], replyingTo: null });

    try {
      const payload = {
        ...messageData,
        replyTo: replyingTo?._id || null,
      };
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, payload);
      // Replace optimistic message with real one and sort by timestamp
      const messagesWithReal = get().messages.map((msg) =>
        msg._id === tempId ? res.data : msg
      );
      // Sort by createdAt to maintain chronological order
      messagesWithReal.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      set({ messages: messagesWithReal, editingMessage: null });

      // Refresh chat list to show updated last message
      get().getMyChatPartners();
    } catch (error) {
      // Remove optimistic message on failure
      set({ messages: get().messages.filter((msg) => msg._id !== tempId) });
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  editMessage: async (messageId, newText) => {
    try {
      const res = await axiosInstance.put(`/messages/${messageId}`, { text: newText });
      
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId
            ? { ...msg, text: newText, isEdited: true, updatedAt: res.data.updatedAt }
            : msg
        ),
        editingMessage: null,
      });

      toast.success("Message edited");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to edit message");
    }
  },

  addReaction: async (messageId, emoji) => {
    const { authUser } = useAuthStore.getState();
    try {
      const res = await axiosInstance.post(`/messages/${messageId}/reaction`, { emoji });
      
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      });
    } catch (error) {
      console.error("Failed to add reaction:", error);
    }
  },

  removeReaction: async (messageId, emoji) => {
    try {
      const res = await axiosInstance.delete(`/messages/${messageId}/reaction/${emoji}`);
      
      set({
        messages: get().messages.map((msg) =>
          msg._id === messageId ? res.data : msg
        ),
      });
    } catch (error) {
      console.error("Failed to remove reaction:", error);
    }
  },

  deleteMessage: async (messageId, deleteFor) => {
    const { selectedUser } = get();
    
    try {
      console.log("Deleting message:", { messageId, deleteFor });
      
      const res = await axiosInstance.delete(`/messages/${messageId}`, {
        data: { deleteFor },
      });

      console.log("Delete response:", res.data);

      if (deleteFor === "everyone") {
        // Update message in store to show deleted state
        set({
          messages: get().messages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  deletedForEveryone: true,
                  text: "This message was deleted",
                  image: null,
                }
              : msg
          ),
        });

        toast.success("Message deleted for everyone");
      } else if (deleteFor === "me") {
        // Remove message from current user's view
        set({
          messages: get().messages.filter((msg) => msg._id !== messageId),
        });

        toast.success("Message deleted for you");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to delete message");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, isSoundEnabled } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const setup = () => {
      // Remove any existing listeners first to prevent duplicates
      socket.off("newMessage");
      socket.off("messagesDelivered");
      socket.off("messagesRead");
      socket.off("messageDeleted");
      socket.off("userTyping");
      socket.off("userStoppedTyping");
      socket.off("onlineUsers");
      socket.off("messageEdited");
      socket.off("reactionAdded");
      socket.off("reactionRemoved");

    // Listen for messages received from others
    socket.on("newMessage", (newMessage) => {
      const isMessageSentFromSelectedUser = newMessage.senderId.toString() === selectedUser._id.toString();
      if (!isMessageSentFromSelectedUser) return;

      const currentMessages = get().messages;
      
      // Check if message already exists to avoid duplicates
      const messageExists = currentMessages.some(
        (msg) => msg._id.toString() === newMessage._id.toString()
      );
      
      if (!messageExists) {
        // Add new message and sort by timestamp
        const updatedMessages = [...currentMessages, newMessage];
        updatedMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        set({ messages: updatedMessages, typingUser: null });

        // Emit delivery confirmation back to sender
        socket.emit("messageDelivered", {
          messageId: newMessage._id,
          senderId: newMessage.senderId,
        });
      }

      if (isSoundEnabled) {
        const notificationSound = new Audio("/sounds/notification.mp3");
        notificationSound.currentTime = 0;
        notificationSound.play().catch((e) => console.log("Audio play failed:", e));
      }

      // Refresh chat list to show updated last message
      get().getMyChatPartners();
    });

    // Listen for delivery confirmations
    socket.on("messagesDelivered", ({ messageIds }) => {
      set({
        messages: get().messages.map((msg) =>
          messageIds.some((id) => id.toString() === msg._id.toString())
            ? { ...msg, delivered: true }
            : msg
        ),
      });
    });

    // Listen for read confirmations
    socket.on("messagesRead", ({ userId, senderId }) => {
      set({
        messages: get().messages.map((msg) =>
          msg.senderId.toString() === senderId.toString() && !msg.isRead
            ? { ...msg, isRead: true }
            : msg
        ),
      });
    });

    // Listen for message deletion events
    socket.on("messageDeleted", ({ messageId, deleteFor }) => {
      if (deleteFor === "everyone") {
        // Update message to show deleted state
        set({
          messages: get().messages.map((msg) =>
            msg._id === messageId
              ? {
                  ...msg,
                  deletedForEveryone: true,
                  text: "This message was deleted",
                  image: null,
                }
              : msg
          ),
        });
      } else if (deleteFor === "me") {
        // Remove message from current user's view
        set({
          messages: get().messages.filter((msg) => msg._id !== messageId),
        });
      }
    });

    // Listen for typing indicator
    socket.on("userTyping", (data) => {
      if (data.senderId.toString() === selectedUser._id.toString()) {
        set({ isTyping: true, typingUser: data });
      }
    });

    socket.on("userStoppedTyping", (data) => {
      if (data.senderId.toString() === selectedUser._id.toString()) {
        set({ isTyping: false, typingUser: null });
      }
    });

    // Listen for online users
    socket.on("onlineUsers", (users) => {
      set({ onlineUsers: users });
    });

    // Listen for message edits
    socket.on("messageEdited", (data) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, text: data.text, isEdited: true, updatedAt: data.updatedAt }
            : msg
        ),
      });
    });

    // Listen for reactions
    socket.on("reactionAdded", (data) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === data.messageId ? data.message : msg
        ),
      });
    });

    socket.on("reactionRemoved", (data) => {
      set({
        messages: get().messages.map((msg) =>
          msg._id === data.messageId ? data.message : msg
        ),
      });
    });
    }; // end setup

    // If socket already connected — setup immediately
    // If not yet connected — wait for connect event then setup
    if (socket.connected) {
      setup();
    } else {
      socket.once("connect", setup);
    }
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;
    socket.off("newMessage");
    socket.off("messagesDelivered");
    socket.off("messagesRead");
    socket.off("messageDeleted");
    socket.off("userTyping");
    socket.off("userStoppedTyping");
    socket.off("onlineUsers");
    socket.off("messageEdited");
    socket.off("reactionAdded");
    socket.off("reactionRemoved");
  },
}));
