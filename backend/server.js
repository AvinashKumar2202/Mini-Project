import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import examRoutes from  "./routes/examRoutes.js";
import cors from 'cors'


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

// test route
app.get("/", (req, res) => {
  res.send("Server running successfully");
});

// start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
