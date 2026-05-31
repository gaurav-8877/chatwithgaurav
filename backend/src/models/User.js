import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },

    // ── Phone auth ────────────────────────────────────────────────────────
    phone: {
      type: String,
      default: null,
      sparse: true,  // allows multiple null values
    },
    firebaseUid: {
      type: String,
      default: null,
      sparse: true,
    },

    // ── Extended profile ───────────────────────────────────────────────────
    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },
    status: {
      type: String,
      enum: ["online", "away", "busy", "offline"],
      default: "offline",
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    theme: {
      type: String,
      enum: ["dark", "light"],
      default: "dark",
    },

    // ── Social ─────────────────────────────────────────────────────────────
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // ── Privacy ────────────────────────────────────────────────────────────
    privacy: {
      lastSeenVisibility: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      profilePicVisibility: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
    },

    // ── Notification preferences ───────────────────────────────────────────
    notifications: {
      messages:  { type: Boolean, default: true },
      calls:     { type: Boolean, default: true },
      mentions:  { type: Boolean, default: true },
      sounds:    { type: Boolean, default: true },
    },

    // ── Call history ───────────────────────────────────────────────────────
    callHistory: [
      {
        withUser:  { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type:      { type: String, enum: ["audio", "video"] },
        status:    { type: String, enum: ["missed", "answered", "rejected"] },
        duration:  { type: Number, default: 0 }, // seconds
        startedAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });
userSchema.index({ fullName: "text" }); // for search

const User = mongoose.model("User", userSchema);
export default User;
