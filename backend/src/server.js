import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import authRoutes   from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import groupRoutes   from "./routes/group.route.js";
import { connectDB } from "./lib/db.js";
import { ENV }       from "./lib/env.js";
import { app, server } from "./lib/socket.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

// ── CORS ────────────────────────────────────────────────────────────────────
// Allowed origins: local dev + Render frontend URL (set CLIENT_URL in Render dashboard)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

// Accept any *.onrender.com origin automatically
if (ENV.CLIENT_URL) allowedOrigins.push(ENV.CLIENT_URL);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, mobile apps, same-origin)
    if (!origin) return cb(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".onrender.com") ||
      origin.endsWith(".vercel.app")
    ) {
      return cb(null, true);
    }
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups",   groupRoutes);

// ── Production static (only if frontend is served from same Express server) ─
if (ENV.NODE_ENV === "production") {
  const distPath = path.join(__dirname, "../frontend/dist");
  app.use(express.static(distPath));
  app.get("*", (_, res) => res.sendFile(path.join(distPath, "index.html")));
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
