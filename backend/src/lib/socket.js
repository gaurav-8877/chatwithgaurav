import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";
import Group from "../models/Group.js";
import User from "../models/User.js";

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (
        ["http://localhost:5173", "http://localhost:3000"].includes(origin) ||
        (ENV.CLIENT_URL && origin === ENV.CLIENT_URL) ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".vercel.app")
      ) return cb(null, true);
      cb(new Error(`Socket CORS blocked: ${origin}`));
    },
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const userSocketMap = {};   // { userId: socketId }
global.userSocketMap = userSocketMap;

export function getReceiverSocketId(userId) {
  return userSocketMap[userId?.toString()];
}
export function getGroupRoomId(groupId) {
  return `group:${groupId}`;
}

/* ── Connection ──────────────────────────────────────────────────────────── */
io.on("connection", async (socket) => {
  const userId = socket.userId;
  console.log("Connected:", socket.user.fullName);

  userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Update status in DB
  User.findByIdAndUpdate(userId, { status: "online", lastSeen: new Date() }).exec();

  // Join group rooms
  try {
    const groups = await Group.find({ members: userId }).select("_id");
    groups.forEach(g => socket.join(getGroupRoomId(g._id.toString())));
  } catch (e) { console.error("group room join:", e.message); }

  /* ── DM Events ───────────────────────────────────────────────────────── */
  socket.on("messageDelivered", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { delivered: true, deliveredAt: new Date() });
      const senderSid = userSocketMap[senderId];
      if (senderSid) io.to(senderSid).emit("messagesDelivered", { messageIds: [messageId] });
    } catch (e) { console.error("delivery:", e.message); }
  });

  socket.on("userTyping", ({ senderId, receiverId }) => {
    const sid = userSocketMap[receiverId];
    if (sid) io.to(sid).emit("userTyping", { senderId, receiverId });
  });

  socket.on("userStoppedTyping", ({ senderId, receiverId }) => {
    const sid = userSocketMap[receiverId];
    if (sid) io.to(sid).emit("userStoppedTyping", { senderId, receiverId });
  });

  /* ── Group Events ────────────────────────────────────────────────────── */
  socket.on("groupTyping", ({ groupId, senderId, senderName }) =>
    socket.to(getGroupRoomId(groupId)).emit("groupTyping", { groupId, senderId, senderName })
  );
  socket.on("groupStoppedTyping", ({ groupId, senderId }) =>
    socket.to(getGroupRoomId(groupId)).emit("groupStoppedTyping", { groupId, senderId })
  );
  socket.on("joinGroupRoom",  ({ groupId }) => socket.join(getGroupRoomId(groupId)));
  socket.on("leaveGroupRoom", ({ groupId }) => socket.leave(getGroupRoomId(groupId)));

  /* ── WebRTC Call Signaling ───────────────────────────────────────────── */

  // 1. Caller → Server → Receiver: initiate call
  socket.on("call:initiate", ({ to, callType, offer }) => {
    const callerInfo = {
      _id:        socket.user._id,
      fullName:   socket.user.fullName,
      profilePic: socket.user.profilePic,
    };
    const receiverSid = userSocketMap[to];
    if (receiverSid) {
      io.to(receiverSid).emit("call:incoming", {
        from:     userId,
        fromUser: callerInfo,
        callType,
        offer,
      });
      // Confirm to caller that ring is delivered
      socket.emit("call:ringing", { to });
    } else {
      // Receiver offline
      socket.emit("call:unavailable", { to });
    }
  });

  // 2. Receiver → Server → Caller: accepted with WebRTC answer
  socket.on("call:accept", ({ to, answer }) => {
    const callerSid = userSocketMap[to];
    if (callerSid) io.to(callerSid).emit("call:accepted", { from: userId, answer });
  });

  // 3. Receiver → Server → Caller: rejected
  socket.on("call:reject", ({ to }) => {
    const callerSid = userSocketMap[to];
    if (callerSid) io.to(callerSid).emit("call:rejected", { from: userId });
  });

  // 4. Either side → other side: end call
  socket.on("call:end", ({ to }) => {
    const otherSid = userSocketMap[to];
    if (otherSid) io.to(otherSid).emit("call:ended", { from: userId });
  });

  // 5. ICE candidate exchange
  socket.on("call:ice", ({ to, candidate }) => {
    const otherSid = userSocketMap[to];
    if (otherSid) io.to(otherSid).emit("call:ice", { from: userId, candidate });
  });

  // 6. Busy signal
  socket.on("call:busy", ({ to }) => {
    const callerSid = userSocketMap[to];
    if (callerSid) io.to(callerSid).emit("call:busy", { from: userId });
  });

  /* ── Disconnect ──────────────────────────────────────────────────────── */
  socket.on("disconnect", async () => {
    console.log("Disconnected:", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Update DB
    User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() }).exec();
  });
});

export { io, app, server };
