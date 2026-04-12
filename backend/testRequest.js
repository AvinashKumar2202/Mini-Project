import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.js";
import Exam from "./models/Exam.js";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Mini-Project');

    // Find any teacher
    const teacher = await User.findOne({ role: "teacher" });
    if (!teacher) {
      console.log("No teacher found");
      process.exit(0);
    }
    
    // Find an exam
    const exam = await Exam.findOne();
    if (!exam) {
      console.log("No exam found");
      process.exit(0);
    }

    // Mock token and req, res
    const { createQuestion } = await import("./controllers/examController.js");
    
    const req = {
      user: { id: teacher._id },
      body: {
        question: "Frontend payload test?",
        options: [
          { optionText: "Option 1", isCorrect: true },
          { optionText: "Option 2", isCorrect: false },
          { optionText: "Option 3", isCorrect: false },
          { optionText: "Option 4", isCorrect: false }
        ],
        examId: exam._id.toString()
      }
    };
    
    const res = {
      status: function(s) {
        this.statusCode = s;
        return this;
      },
      json: function(data) {
        console.log("Response:", this.statusCode, data);
      }
    };
    
    await createQuestion(req, res);

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    mongoose.disconnect();
  }
};

run();
