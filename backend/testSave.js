import mongoose from "mongoose";
import dotenv from "dotenv";
import Exam from "./models/Exam.js";

dotenv.config();

const test = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/Mini-Project');
    
    const exam = await Exam.findOne();
    if (!exam) {
      console.log("No exams found");
      process.exit(1);
    }
    
    exam.questions.push({
      question: "Test question?",
      options: [
        { optionText: "A", isCorrect: true },
        { optionText: "B", isCorrect: false },
        { optionText: "C", isCorrect: false },
        { optionText: "D", isCorrect: false }
      ]
    });
    
    await exam.save();
    console.log("Question saved successfully!");
  } catch (err) {
    console.error("Error saving question:", err);
  } finally {
    mongoose.disconnect();
  }
};

test();
