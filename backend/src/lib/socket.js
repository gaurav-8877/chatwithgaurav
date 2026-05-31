import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ENV } from "./env.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import Message from "../models/Message.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [ENV.CLIENT_URL],
    credentials: true,
  },
});

// apply authentication middleware to all socket connections
io.use(socketAuthMiddleware);

// we will use this function to check if the user is online or not
export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// this is for storig online users
const userSocketMap = {}; // {userId:socketId}

io.on("connection", (socket) => {
  console.log("A user connected", socket.user.fullName);

  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Listen for delivery confirmations from receiver
  socket.on("messageDelivered", async ({ messageId, senderId }) => {
    try {
      // Update message in database as delivered
      await Message.findByIdAndUpdate(messageId, {
        delivered: true,
        deliveredAt: new Date(),
      });

      // Send delivery confirmation back to sender
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit("messagesDelivered", {
          messageIds: [messageId],
        });
      }
    } catch (error) {
      console.log("Error processing delivery confirmation:", error.message);
    }
  });

  // Listen for typing indicator
  socket.on("userTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", {
        senderId,
        receiverId,
      });
    }
  });

  // Listen for stopped typing indicator
  socket.on("userStoppedTyping", ({ senderId, receiverId }) => {
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userStoppedTyping", {
        senderId,
        receiverId,
      });
    }
  });

  // with socket.on we listen for events from clients
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
