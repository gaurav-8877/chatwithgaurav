import cloudinary from "../lib/cloudinary.js";
import Group from "../models/Group.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { io, getGroupRoomId } from "../lib/socket.js";

// ─── Create ──────────────────────────────────────────────────────────────────

export const createGroup = async (req, res) => {
  try {
    const { name, description, memberIds, avatar } = req.body;
    const creatorId = req.user._id;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required." });
    }
    if (!memberIds || memberIds.length < 1) {
      return res.status(400).json({ message: "Add at least one other member." });
    }

    // Validate members exist
    const validMembers = await User.find({ _id: { $in: memberIds } }).select("_id");
    const validMemberIds = validMembers.map((u) => u._id.toString());

    // Always include creator
    const uniqueMembers = [...new Set([creatorId.toString(), ...validMemberIds])];

    let avatarUrl = "";
    if (avatar) {
      const upload = await cloudinary.uploader.upload(avatar, { folder: "group_avatars" });
      avatarUrl = upload.secure_url;
    }

    const group = await Group.create({
      name: name.trim(),
      description: description?.trim() || "",
      avatar: avatarUrl,
      members: uniqueMembers,
      admins: [creatorId],
      createdBy: creatorId,
    });

    const populated = await group.populate([
      { path: "members", select: "_id fullName email profilePic" },
      { path: "admins", select: "_id fullName" },
      { path: "createdBy", select: "_id fullName" },
    ]);

    // Notify all new members in real-time
    populated.members.forEach((member) => {
      const socketId = global.userSocketMap?.[member._id.toString()];
      if (socketId) {
        io.to(socketId).emit("addedToGroup", populated);
      }
    });

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in createGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "_id fullName email profilePic")
      .populate("admins", "_id fullName")
      .populate("createdBy", "_id fullName")
      .populate({
        path: "lastMessage",
        select: "text image senderId createdAt",
        populate: { path: "senderId", select: "fullName" },
      })
      .sort({ lastMessageAt: -1, createdAt: -1 });

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error in getMyGroups:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupById = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId)
      .populate("members", "_id fullName email profilePic")
      .populate("admins", "_id fullName")
      .populate("createdBy", "_id fullName");

    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m._id.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this group." });

    res.status(200).json(group);
  } catch (error) {
    console.error("Error in getGroupById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;
    const { before, limit = 50 } = req.query;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this group." });

    const query = { groupId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate("senderId", "_id fullName profilePic")
      .populate({
        path: "replyTo",
        select: "text image senderId",
        populate: { path: "senderId", select: "fullName" },
      });

    res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Error in getGroupMessages:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, avatar } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isAdmin = group.admins.some((a) => a.toString() === userId.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can update the group." });

    const updates = {};
    if (name && name.trim()) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (avatar) {
      const upload = await cloudinary.uploader.upload(avatar, { folder: "group_avatars" });
      updates.avatar = upload.secure_url;
    }

    const updated = await Group.findByIdAndUpdate(groupId, updates, { new: true }).populate(
      "members",
      "_id fullName email profilePic"
    );

    io.to(getGroupRoomId(groupId)).emit("groupUpdated", updated);

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in updateGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberIds } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isAdmin = group.admins.some((a) => a.toString() === userId.toString());
    if (!isAdmin) return res.status(403).json({ message: "Only admins can add members." });

    const existingIds = group.members.map((m) => m.toString());
    const newIds = memberIds.filter((id) => !existingIds.includes(id));

    await Group.findByIdAndUpdate(groupId, { $addToSet: { members: { $each: newIds } } });

    const updated = await Group.findById(groupId).populate("members", "_id fullName email profilePic");

    // Notify newly added members
    newIds.forEach((id) => {
      const socketId = global.userSocketMap?.[id];
      if (socketId) {
        io.to(socketId).emit("addedToGroup", updated);
      }
    });

    io.to(getGroupRoomId(groupId)).emit("groupUpdated", updated);

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in addMembers:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isAdmin = group.admins.some((a) => a.toString() === userId.toString());
    const isSelf = memberId === userId.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ message: "Not authorized." });
    }

    // Creator cannot be removed
    if (memberId === group.createdBy.toString() && !isSelf) {
      return res.status(400).json({ message: "Cannot remove the group creator." });
    }

    await Group.findByIdAndUpdate(groupId, {
      $pull: { members: memberId, admins: memberId },
    });

    const targetSocketId = global.userSocketMap?.[memberId];
    if (targetSocketId) {
      io.to(targetSocketId).emit("removedFromGroup", { groupId });
    }

    const updated = await Group.findById(groupId).populate("members", "_id fullName email profilePic");
    io.to(getGroupRoomId(groupId)).emit("groupUpdated", updated);

    res.status(200).json({ message: isSelf ? "Left group." : "Member removed.", group: updated });
  } catch (error) {
    console.error("Error in removeMember:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the creator can delete this group." });
    }

    await Message.deleteMany({ groupId });
    await Group.findByIdAndDelete(groupId);

    io.to(getGroupRoomId(groupId)).emit("groupDeleted", { groupId });

    res.status(200).json({ message: "Group deleted." });
  } catch (error) {
    console.error("Error in deleteGroup:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// ─── Group Messaging ──────────────────────────────────────────────────────────

export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image, replyTo } = req.body;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Text or image is required." });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    const isMember = group.members.some((m) => m.toString() === senderId.toString());
    if (!isMember) return res.status(403).json({ message: "Not a member of this group." });

    let imageUrl;
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    const message = await Message.create({
      senderId,
      groupId,
      text: text?.trim() || undefined,
      image: imageUrl,
      replyTo: replyTo || null,
    });

    const populated = await message.populate([
      { path: "senderId", select: "_id fullName profilePic" },
      {
        path: "replyTo",
        select: "text image senderId",
        populate: { path: "senderId", select: "fullName" },
      },
    ]);

    // Update group's lastMessage
    await Group.findByIdAndUpdate(groupId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    });

    // Broadcast to group room
    io.to(getGroupRoomId(groupId)).emit("newGroupMessage", populated);

    res.status(201).json(populated);
  } catch (error) {
    console.error("Error in sendGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const addGroupReaction = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || !message.groupId) return res.status(404).json({ message: "Group message not found." });

    const alreadyReacted = message.reactions.find(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (!alreadyReacted) {
      message.reactions.push({ userId, emoji });
      await message.save();
    }

    const populated = await message.populate("senderId", "_id fullName profilePic");
    io.to(getGroupRoomId(message.groupId.toString())).emit("groupReactionAdded", {
      messageId,
      message: populated.toObject(),
    });

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in addGroupReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const removeGroupReaction = async (req, res) => {
  try {
    const { messageId, emoji } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || !message.groupId) return res.status(404).json({ message: "Group message not found." });

    message.reactions = message.reactions.filter(
      (r) => !(r.userId.toString() === userId.toString() && r.emoji === emoji)
    );
    await message.save();

    const populated = await message.populate("senderId", "_id fullName profilePic");
    io.to(getGroupRoomId(message.groupId.toString())).emit("groupReactionRemoved", {
      messageId,
      message: populated.toObject(),
    });

    res.status(200).json(populated);
  } catch (error) {
    console.error("Error in removeGroupReaction:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteFor } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message || !message.groupId) return res.status(404).json({ message: "Group message not found." });

    if (deleteFor === "everyone" && message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the sender can delete for everyone." });
    }

    if (deleteFor === "everyone") {
      await Message.findByIdAndUpdate(messageId, {
        deletedForEveryone: true,
        text: "This message was deleted",
        image: null,
      });

      io.to(getGroupRoomId(message.groupId.toString())).emit("groupMessageDeleted", {
        messageId,
        deleteFor: "everyone",
      });
    } else {
      await Message.findByIdAndUpdate(messageId, { $addToSet: { deletedFor: userId } });
    }

    res.status(200).json({ message: "Deleted.", messageId, deleteFor });
  } catch (error) {
    console.error("Error in deleteGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const editGroupMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!text?.trim()) return res.status(400).json({ message: "Text is required." });

    const message = await Message.findById(messageId);
    if (!message || !message.groupId) return res.status(404).json({ message: "Group message not found." });

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the sender can edit this message." });
    }

    const updated = await Message.findByIdAndUpdate(
      messageId,
      { text: text.trim(), isEdited: true },
      { new: true }
    );

    io.to(getGroupRoomId(message.groupId.toString())).emit("groupMessageEdited", {
      messageId,
      text: text.trim(),
      updatedAt: updated.updatedAt,
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error in editGroupMessage:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const makeAdmin = async (req, res) => {
  try {
    const { groupId, memberId } = req.params;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found." });

    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Only the creator can promote admins." });
    }

    await Group.findByIdAndUpdate(groupId, { $addToSet: { admins: memberId } });
    res.status(200).json({ message: "Admin added." });
  } catch (error) {
    console.error("Error in makeAdmin:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
