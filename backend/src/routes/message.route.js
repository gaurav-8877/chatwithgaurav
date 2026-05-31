import express from "express";
import {
  getAllContacts, getChatPartners, getMessagesByUserId, sendMessage,
  markMessagesAsRead, getUnreadCount, deleteMessage, editMessage,
  addReaction, removeReaction,
  // new
  getAIReply, searchMessages, pinMessage, getPinnedMessages, forwardMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

// Lists
router.get("/contacts",   getAllContacts);
router.get("/chats",      getChatPartners);
router.get("/unread/count", getUnreadCount);

// Search
router.get("/search", searchMessages);

// AI
router.post("/ai", getAIReply);

// Conversation messages (cursor pagination: ?before=ISO_DATE&limit=50)
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.post("/read/mark", markMessagesAsRead);

// Pin
router.get("/pinned/:userId",     getPinnedMessages);
router.patch("/:messageId/pin",   pinMessage);

// Edit / Delete
router.put("/:messageId",         editMessage);
router.delete("/:messageId",      deleteMessage);

// Reactions
router.post("/:messageId/reaction",          addReaction);
router.delete("/:messageId/reaction/:emoji", removeReaction);

// Forward
router.post("/:messageId/forward", forwardMessage);

export default router;
