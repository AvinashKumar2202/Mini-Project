import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "./models/User.js";
import Exam from "./models/Exam.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Mini-Project');

    const teacher = await User.findOne({ role: "teacher" });
    const exam = await Exam.findOne();
    
    // Generate valid token
    const token = jwt.sign(
      { id: teacher._id, role: teacher.role, name: teacher.name, email: teacher.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    // Do fetch
    const payload = {
      question: "HTTP Fetch Question?",
      options: [
        { optionText: "A", isCorrect: true },
        { optionText: "B", isCorrect: false },
        { optionText: "C", isCorrect: false },
        { optionText: "D", isCorrect: false }
      ],
      examId: exam._id.toString()
    };
    
    const response = await fetch("http://localhost:5000/api/users/exam/questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json().catch(() => ({}));
    console.log("HTTP STATUS:", response.status);
    console.log("RESPONSE DATA:", data);

  } catch (err) {
    console.error("Fetch failed:", err);
  } finally {
    mongoose.disconnect();
  }
};

run();
