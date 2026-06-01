import { sendWelcomeEmail }      from "../emails/emailHandlers.js";
import { generateToken }          from "../lib/utils.js";
import { verifyFirebaseIdToken }  from "../lib/firebaseVerify.js";
import User                       from "../models/User.js";
import bcrypt                     from "bcryptjs";
import { ENV }                    from "../lib/env.js";
import cloudinary                 from "../lib/cloudinary.js";

/* ── Helpers ────────────────────────────────────────────────────────────── */
const PUBLIC_FIELDS = "-password -callHistory";

/* ── Signup ─────────────────────────────────────────────────────────────── */
export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password)
      return res.status(400).json({ message: "All fields are required" });
    if (password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ message: "Invalid email format" });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const savedUser = await new User({ fullName, email, password: hashedPassword }).save();
    generateToken(savedUser._id, res);

    sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL)
      .catch((e) => console.error("[Auth] Email error:", e));

    res.status(201).json({
      _id: savedUser._id,
      fullName: savedUser.fullName,
      email: savedUser.email,
      profilePic: savedUser.profilePic,
      bio: savedUser.bio,
      status: savedUser.status,
      theme: savedUser.theme,
      notifications: savedUser.notifications,
      privacy: savedUser.privacy,
    });
  } catch (error) {
    console.error("signup:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Login ──────────────────────────────────────────────────────────────── */
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ message: "Invalid credentials" });

    // Update lastSeen + status on login
    user.status  = "online";
    user.lastSeen = new Date();
    await user.save();

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      bio: user.bio,
      status: user.status,
      lastSeen: user.lastSeen,
      theme: user.theme,
      notifications: user.notifications,
      privacy: user.privacy,
    });
  } catch (error) {
    console.error("login:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Logout ─────────────────────────────────────────────────────────────── */
export const logout = async (req, res) => {
  const isProd = ENV.NODE_ENV !== "development";
  const cookieOpts = {
    maxAge: 0,
    httpOnly: true,
    sameSite: isProd ? "none" : "strict",
    secure: isProd,
  };
  try {
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        status: "offline",
        lastSeen: new Date(),
      });
    }
    res.cookie("jwt", "", cookieOpts);
    res.status(200).json({ message: "Logged out successfully" });
  } catch {
    res.cookie("jwt", "", cookieOpts);
    res.status(200).json({ message: "Logged out successfully" });
  }
};

/* ── Update profile ──────────────────────────────────────────────────────── */
export const updateProfile = async (req, res) => {
  try {
    const { profilePic, fullName, bio } = req.body;
    const userId = req.user._id;

    if (!profilePic && !fullName && bio === undefined)
      return res.status(400).json({ message: "Nothing to update." });

    const updates = {};
    if (fullName?.trim()) updates.fullName = fullName.trim();
    if (bio !== undefined)  updates.bio     = bio.trim().slice(0, 200);

    if (profilePic) {
      const upload = await cloudinary.uploader.upload(profilePic, {
        folder: "profile_pics",
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      });
      updates.profilePic = upload.secure_url;
    }

    const updated = await User.findByIdAndUpdate(userId, updates, { new: true }).select(PUBLIC_FIELDS);
    res.status(200).json(updated);
  } catch (error) {
    console.error("updateProfile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Update settings ────────────────────────────────────────────────────── */
export const updateSettings = async (req, res) => {
  try {
    const { theme, notifications, privacy, status } = req.body;
    const userId = req.user._id;
    const updates = {};

    if (theme && ["dark", "light"].includes(theme))       updates.theme  = theme;
    if (status && ["online","away","busy"].includes(status)) updates.status = status;
    if (notifications) updates.notifications = notifications;
    if (privacy)       updates.privacy       = privacy;

    const updated = await User.findByIdAndUpdate(userId, updates, { new: true }).select(PUBLIC_FIELDS);
    res.status(200).json(updated);
  } catch (error) {
    console.error("updateSettings:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Block / Unblock user ───────────────────────────────────────────────── */
export const blockUser = async (req, res) => {
  try {
    const userId   = req.user._id;
    const { targetId } = req.params;

    if (userId.toString() === targetId)
      return res.status(400).json({ message: "Cannot block yourself." });

    await User.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: targetId } });
    res.status(200).json({ message: "User blocked." });
  } catch (error) {
    console.error("blockUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const userId   = req.user._id;
    const { targetId } = req.params;

    await User.findByIdAndUpdate(userId, { $pull: { blockedUsers: targetId } });
    res.status(200).json({ message: "User unblocked." });
  } catch (error) {
    console.error("unblockUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBlockedUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("blockedUsers", "_id fullName profilePic email")
      .select("blockedUsers");
    res.status(200).json(user.blockedUsers);
  } catch (error) {
    console.error("getBlockedUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Search users ───────────────────────────────────────────────────────── */
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 1)
      return res.status(400).json({ message: "Search query required." });

    const regex = new RegExp(q.trim(), "i");
    const users = await User.find({
      _id: { $ne: req.user._id },
      $or: [{ fullName: regex }, { email: regex }],
    })
      .select("_id fullName email profilePic status lastSeen")
      .limit(20);

    res.status(200).json(users);
  } catch (error) {
    console.error("searchUsers:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Update last seen (heartbeat from client) ────────────────────────────── */
export const updateLastSeen = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { lastSeen: new Date(), status: "online" });
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Get call history ────────────────────────────────────────────────────── */
export const getCallHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("callHistory.withUser", "_id fullName profilePic")
      .select("callHistory");

    const history = (user.callHistory || [])
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
      .slice(0, 50);

    res.status(200).json(history);
  } catch (error) {
    console.error("getCallHistory:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Record call in history ──────────────────────────────────────────────── */
export const recordCall = async (req, res) => {
  try {
    const { withUserId, type, status, duration } = req.body;
    const userId = req.user._id;

    const callEntry = { withUser: withUserId, type, status, duration: duration || 0, startedAt: new Date() };

    await User.findByIdAndUpdate(userId, { $push: { callHistory: callEntry } });
    // Also record for the other party
    await User.findByIdAndUpdate(withUserId, { $push: { callHistory: { ...callEntry, withUser: userId } } });

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("recordCall:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* ── Firebase Phone Login ────────────────────────────────────────────────── */
/**
 * POST /api/auth/phone-login
 * Body: { idToken, fullName? }
 *
 * Flow:
 *  1. Client does Firebase Phone Auth → gets Firebase idToken
 *  2. Client sends idToken (+ fullName for new users) here
 *  3. We verify with Google, find/create user, issue JWT cookie
 */
export const phoneLogin = async (req, res) => {
  try {
    const { idToken, fullName } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "Firebase ID token is required." });
    }

    // 1. Verify token with Google
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseIdToken(idToken);
    } catch (err) {
      return res.status(401).json({ message: `Token verification failed: ${err.message}` });
    }

    const { localId: firebaseUid, phoneNumber } = firebaseUser;

    if (!phoneNumber) {
      return res.status(400).json({ message: "No phone number associated with this Firebase account." });
    }

    // 2. Find existing user by phone
    let user = await User.findOne({ phone: phoneNumber });

    if (user) {
      // ── Existing user: login ─────────────────────────────────────────────
      user.status   = "online";
      user.lastSeen = new Date();
      await user.save();

      generateToken(user._id, res);

      return res.status(200).json({
        _id:           user._id,
        fullName:      user.fullName,
        email:         user.email,
        phone:         user.phone,
        profilePic:    user.profilePic,
        bio:           user.bio,
        status:        user.status,
        lastSeen:      user.lastSeen,
        theme:         user.theme,
        notifications: user.notifications,
        privacy:       user.privacy,
        isNewUser:     false,
      });
    }

    // ── New user: create account ─────────────────────────────────────────
    if (!fullName || !fullName.trim()) {
      // Tell client we need their name
      return res.status(200).json({
        isNewUser:   true,
        phoneNumber,
        firebaseUid,
        message: "New user — provide fullName to complete registration",
      });
    }

    // Auto-generate a placeholder email so the existing unique constraint is satisfied
    const placeholderEmail = `${phoneNumber.replace(/\+/g, "").replace(/\s/g, "")}@phone.chatify`;

    // Check if placeholder email already exists (edge case)
    const emailExists = await User.findOne({ email: placeholderEmail });
    if (emailExists) {
      // Attach phone to the existing account
      emailExists.phone     = phoneNumber;
      emailExists.status    = "online";
      emailExists.lastSeen  = new Date();
      await emailExists.save();
      generateToken(emailExists._id, res);
      return res.status(200).json({ ...emailExists.toObject(), isNewUser: false });
    }

    const newUser = await User.create({
      fullName:    fullName.trim(),
      email:       placeholderEmail,
      phone:       phoneNumber,
      firebaseUid,
      password:    await import("bcryptjs").then(m => m.default.hash(Math.random().toString(36), 10)), // unusable random password
      status:      "online",
      lastSeen:    new Date(),
    });

    generateToken(newUser._id, res);

    return res.status(201).json({
      _id:           newUser._id,
      fullName:      newUser.fullName,
      email:         newUser.email,
      phone:         newUser.phone,
      profilePic:    newUser.profilePic,
      bio:           newUser.bio,
      status:        newUser.status,
      theme:         newUser.theme,
      notifications: newUser.notifications,
      privacy:       newUser.privacy,
      isNewUser:     true,
    });
  } catch (error) {
    console.error("phoneLogin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
