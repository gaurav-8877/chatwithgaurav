import express from "express";
import {
  signup, login, logout,
  updateProfile, updateSettings,
  blockUser, unblockUser, getBlockedUsers,
  searchUsers, updateLastSeen,
  getCallHistory, recordCall,
  phoneLogin,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();

router.use(arcjetProtection);

// Public
router.post("/signup",       signup);
router.post("/login",        login);
router.post("/phone-login",  phoneLogin);   // Firebase Phone Auth
router.post("/logout", protectRoute, logout);

// Auth check
router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));

// Profile
router.put("/update-profile", protectRoute, updateProfile);
router.put("/settings",       protectRoute, updateSettings);
router.patch("/last-seen",    protectRoute, updateLastSeen);

// Block/Unblock
router.post("/block/:targetId",   protectRoute, blockUser);
router.delete("/block/:targetId", protectRoute, unblockUser);
router.get("/blocked",            protectRoute, getBlockedUsers);

// Search
router.get("/search", protectRoute, searchUsers);

// Call history
router.get("/calls",  protectRoute, getCallHistory);
router.post("/calls", protectRoute, recordCall);

export default router;
