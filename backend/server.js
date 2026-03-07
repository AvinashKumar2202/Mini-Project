import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import cors from 'cors'
import { ExpressPeerServer } from 'peer';


// Load environment variables and connect to the database
dotenv.config();
//console.log("MONGO_URI =", process.env.MONGO_URI); // Debugging line to check if MONGO_URI is loaded correctly
connectDB();

const app = express();
app.use(cors());
const port = process.env.PORT;

// basic middleware
app.use(express.json());

//Routes
app.use("/api/users", userRoutes);
app.use("/api/users/exam", examRoutes);

import os from 'os';

// test route
app.get("/", (req, res) => {
  res.send("Server running successfully");
});

// local ip route (for QR code generation so phones can connect)
app.get("/api/config/ip", (req, res) => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return res.json({ ip: iface.address });
      }
    }
  }
  res.json({ ip: 'localhost' });
});

// start server
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Configure PeerJS server
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});

app.use('/peerjs', peerServer);
