import dotenv from "dotenv";
dotenv.config();

import express from "express";
import http from "http";
import os from "os";
import cors from "cors";
import compression from "compression";
import { ExpressPeerServer } from "peer";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Connect to the database
connectDB();

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/users", userRoutes);
app.use("/api/users/exam", examRoutes);
app.use("/api/chat", chatRoutes);

// Health-check / test route
app.get("/", (req, res) => {
  res.send("Server running successfully");
});

// Local IP route (for QR code generation so phones can connect)
app.get("/api/config/ip", (req, res) => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return res.json({ ip: iface.address });
      }
    }
  }
  res.json({ ip: "localhost" });
});

// ── Server & PeerJS Initialization ───────────────────────────────────────────
const port = process.env.PORT || 5001;

// Create HTTP server to share between Express and PeerJS
const server = http.createServer(app);

const peerServer = ExpressPeerServer(server, {
  debug: false,
  path: "/",
});

// Register the PeerJS middleware
app.use("/peerjs", peerServer);

// ── Global Error Handling ───────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// Start the integrated server
server.listen(port, () => {
  console.log(`Integrated Server running on http://localhost:${port}`);
});

// Robust timeouts
server.keepAliveTimeout = 65000;
server.headersTimeout  = 66000;
// trigger restart
