import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

// the middlewares execute in order - so requests get rate-limited first, then authenticated.
// this is actually more efficient since unauthenticated requests get blocked by rate limiting before hitting the auth middleware.
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/unread/count", getUnreadCount);
router.get("/:id", getMessagesByUserId);
router.post("/send/:id", sendMessage);
router.post("/read/mark", markMessagesAsRead);
router.put("/:messageId", editMessage);
router.delete("/:messageId", deleteMessage);
router.post("/:messageId/reaction", addReaction);
router.delete("/:messageId/reaction/:emoji", removeReaction);

export default router;
