import express from "express";
import {
  createGroup,
  getMyGroups,
  getGroupById,
  getGroupMessages,
  updateGroup,
  addMembers,
  removeMember,
  deleteGroup,
  sendGroupMessage,
  addGroupReaction,
  removeGroupReaction,
  deleteGroupMessage,
  editGroupMessage,
  makeAdmin,
} from "../controllers/group.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

// Group CRUD
router.post("/", createGroup);
router.get("/", getMyGroups);
router.get("/:groupId", getGroupById);
router.put("/:groupId", updateGroup);
router.delete("/:groupId", deleteGroup);

// Membership
router.post("/:groupId/members", addMembers);
router.delete("/:groupId/members/:memberId", removeMember);
router.post("/:groupId/admins/:memberId", makeAdmin);

// Messages
router.get("/:groupId/messages", getGroupMessages);
router.post("/:groupId/messages", sendGroupMessage);
router.put("/:groupId/messages/:messageId", editGroupMessage);
router.delete("/:groupId/messages/:messageId", deleteGroupMessage);
router.post("/:groupId/messages/:messageId/reaction", addGroupReaction);
router.delete("/:groupId/messages/:messageId/reaction/:emoji", removeGroupReaction);

export default router;
