import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { generateAIReply } from "../lib/anthropic.js";

export const getAllContacts = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.log("Error in getAllContacts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessagesByUserId = async (req, res) => {
  try {
    const myId = req.user._id;
    const { id: userToChatId } = req.params;

    const messages = await Message.find({
      groupId: { $in: [null, undefined] },
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // Filter out messages deleted for current user
    const visibleMessages = messages.filter((msg) => {
      // Show if not deleted for everyone
      if (!msg.deletedForEveryone) {
        // And not deleted for current user
        return !msg.deletedFor || !msg.deletedFor.some((userId) => userId.toString() === myId.toString());
      }
      return msg.deletedForEveryone; // Always show if deleted for everyone (shows placeholder)
    });

    // Only mark undelivered messages from OTHER user as delivered
    const undeliveredMessages = visibleMessages.filter(
      (msg) =>
        msg.senderId.toString() === userToChatId.toString() &&
        msg.delivered === false
    );

    if (undeliveredMessages.length > 0) {
      // Mark as delivered in database (one-time operation)
      await Message.updateMany(
        {
          senderId: userToChatId,
          receiverId: myId,
          delivered: false,
        },
        {
          $set: { delivered: true, deliveredAt: new Date() },
        }
      );

      // Notify SENDER (userToChatId) that their messages were delivered to THIS user (myId)
      const senderSocketId = getReceiverSocketId(userToChatId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesDelivered", {
          userId: myId,
          messageIds: undeliveredMessages.map((msg) => msg._id),
        });
      }

      // Re-fetch and re-filter updated messages to return with delivered status
      const updatedAllMessages = await Message.find({
        groupId: { $in: [null, undefined] },
        $or: [
          { senderId: myId, receiverId: userToChatId },
          { senderId: userToChatId, receiverId: myId },
        ],
      }).sort({ createdAt: 1 });

      const updatedMessages = updatedAllMessages.filter((msg) => {
        if (!msg.deletedForEveryone) {
          return !msg.deletedFor || !msg.deletedFor.some((userId) => userId.toString() === myId.toString());
        }
        return msg.deletedForEveryone;
      });

      return res.status(200).json(updatedMessages);
    }

    // If no undelivered messages, return filtered messages
    res.status(200).json(visibleMessages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }
    if (senderId.equals(receiverId)) {
      return res.status(400).json({ message: "Cannot send messages to yourself." });
    }
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found." });
    }

    let imageUrl;
    if (image) {
      // upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      isRead: false,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // Emit to receiver (message stays as "sent" status)
      io.to(receiverSocketId).emit("newMessage", newMessage);
      // When receiver loads chat or processes the message, it will be marked as "delivered"
    }

    // Return message with "sent" status
    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatPartners = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    // Only DM messages (groupId must be null/unset)
    const messages = await Message.find({
      groupId: { $in: [null, undefined] },
      $or: [{ senderId: loggedInUserId }, { receiverId: loggedInUserId }],
    });

    const chatPartnerIds = [
      ...new Set(
        messages.map((msg) =>
          msg.senderId.toString() === loggedInUserId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        )
      ),
    ];

    const chatPartners = await User.find({ _id: { $in: chatPartnerIds } }).select("-password");

    // Get unread count and last message for each partner
    const partnersWithUnread = await Promise.all(
      chatPartners.map(async (partner) => {
        // Get unread count (messages FROM partner TO me that are not read)
        const unreadCount = await Message.countDocuments({
          senderId: partner._id,
          receiverId: loggedInUserId,
          isRead: false,
        });

        // Get last message in the conversation (in either direction)
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: loggedInUserId, receiverId: partner._id },
            { senderId: partner._id, receiverId: loggedInUserId },
          ],
        })
          .sort({ createdAt: -1 })
          .select("text image senderId createdAt");

        return {
          ...partner.toObject(),
          unreadCount,
          lastMessage: lastMessage || null,
        };
      })
    );

    res.status(200).json(partnersWithUnread);
  } catch (error) {
    console.error("Error in getChatPartners: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { userId: senderId } = req.body;
    const receiverId = req.user._id;

    await Message.updateMany(
      {
        senderId,
        receiverId,
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    // Notify sender that messages were read
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("messagesRead", { userId: receiverId, senderId });
    }

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadCount = await Message.countDocuments({
      groupId: { $in: [null, undefined] },
      receiverId: userId,
      isRead: false,
    });

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Only sender can delete for everyone
    if (deleteFor === "everyone" && message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the sender can delete for everyone." });
    }

    if (deleteFor === "everyone") {
      // Delete for everyone - mark the message as deleted for everyone
      await Message.findByIdAndUpdate(
        messageId,
        {
          deletedForEveryone: true,
          text: "This message was deleted",
          image: null,
        },
        { new: true }
      );

      // Notify both sender and receiver via socket
      const senderSocketId = getReceiverSocketId(message.senderId);
      const receiverSocketId = getReceiverSocketId(message.receiverId);

      if (senderSocketId) {
        io.to(senderSocketId).emit("messageDeleted", {
          messageId,
          deleteFor: "everyone",
        });
      }

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageDeleted", {
          messageId,
          deleteFor: "everyone",
        });
      }

      return res.status(200).json({
        message: "Message deleted for everyone",
        messageId,
        deleteFor: "everyone",
      });
    } else if (deleteFor === "me") {
      // Delete for me only - add current user to deletedFor array
      await Message.findByIdAndUpdate(
        messageId,
        { $addToSet: { deletedFor: userId } },
        { new: true }
      );

      // Notify only the current user (locally on their device)
      return res.status(200).json({
        message: "Message deleted for you",
        messageId,
        deleteFor: "me",
      });
    }

    res.status(400).json({ message: "Invalid deleteFor option" });
  } catch (error) {
    console.log("Error in deleteMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required." });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Only sender can edit
    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the sender can edit this message." });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        text: text.trim(),
        isEdited: true,
      },
      { new: true }
    );

    // Notify receiver via socket
    const receiverSocketId = getReceiverSocketId(message.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", {
        messageId,
        text: text.trim(),
        updatedAt: updatedMessage.updatedAt,
      });
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    console.log("Error in editMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required." });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (!existingReaction) {
      message.reactions.push({ userId, emoji });
      await message.save();
    }

    // Notify both users via socket
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("reactionAdded", {
        messageId,
        message: message.toObject(),
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("reactionAdded", {
        messageId,
        message: message.toObject(),
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in addReaction controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found." });
    }

    // Remove reaction
    message.reactions = message.reactions.filter(
      (r) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );
    await message.save();

    // Notify both users via socket
    const senderSocketId = getReceiverSocketId(message.senderId);
    const receiverSocketId = getReceiverSocketId(message.receiverId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("reactionRemoved", {
        messageId,
        message: message.toObject(),
      });
    }

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("reactionRemoved", {
        messageId,
        message: message.toObject(),
      });
    }

    res.status(200).json(message);
  } catch (error) {
    console.log("Error in removeReaction controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── AI Reply ─────────────────────────────────────────────────────────────── */
export const getAIReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Text is required." });

    const reply = await generateAIReply(text, req.user.fullName);
    res.status(200).json({ reply });
  } catch (error) {
    console.error("getAIReply:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Search messages ──────────────────────────────────────────────────────── */
export const searchMessages = async (req, res) => {
  try {
    const { q, withUserId } = req.query;
    const myId = req.user._id;

    if (!q?.trim()) return res.status(400).json({ message: "Query required." });

    const query = {
      groupId: { $in: [null, undefined] },
      deletedForEveryone: { $ne: true },
      text: { $regex: q.trim(), $options: "i" },
    };

    if (withUserId) {
      query.$or = [
        { senderId: myId, receiverId: withUserId },
        { senderId: withUserId, receiverId: myId },
      ];
    } else {
      query.$or = [{ senderId: myId }, { receiverId: myId }];
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(40)
      .populate("senderId", "_id fullName profilePic");

    res.status(200).json(messages);
  } catch (error) {
    console.error("searchMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Pin / Unpin message ──────────────────────────────────────────────────── */
export const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found." });

    const isPinned = !message.isPinned;
    await Message.findByIdAndUpdate(messageId, { isPinned });

    // Notify both parties
    const otherId = message.senderId.toString() === req.user._id.toString()
      ? message.receiverId
      : message.senderId;

    const otherSocket = getReceiverSocketId(otherId);
    if (otherSocket) io.to(otherSocket).emit("messagePinned", { messageId, isPinned });

    res.status(200).json({ messageId, isPinned });
  } catch (error) {
    console.error("pinMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPinnedMessages = async (req, res) => {
  try {
    const { userId: withUserId } = req.params;
    const myId = req.user._id;

    const pins = await Message.find({
      groupId: { $in: [null, undefined] },
      isPinned: true,
      $or: [
        { senderId: myId, receiverId: withUserId },
        { senderId: withUserId, receiverId: myId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("senderId", "_id fullName");

    res.status(200).json(pins);
  } catch (error) {
    console.error("getPinnedMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

/* ── Forward message ──────────────────────────────────────────────────────── */
export const forwardMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { toUserIds = [] } = req.body;    // array of user IDs
    const senderId = req.user._id;

    const original = await Message.findById(messageId);
    if (!original) return res.status(404).json({ message: "Message not found." });
    if (original.deletedForEveryone) return res.status(400).json({ message: "Cannot forward deleted message." });

    const forwarded = await Promise.all(
      toUserIds.map(async (receiverId) => {
        const msg = await Message.create({
          senderId,
          receiverId,
          text: original.text,
          image: original.image,
          isForwarded: true,
        });

        const receiverSocket = getReceiverSocketId(receiverId);
        if (receiverSocket) io.to(receiverSocket).emit("newMessage", msg);

        return msg;
      })
    );

    res.status(201).json(forwarded);
  } catch (error) {
    console.error("forwardMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
