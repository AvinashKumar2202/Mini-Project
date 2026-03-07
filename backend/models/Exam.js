import mongoose from "mongoose";

// restructure question schema to match frontend format
const optionSchema = new mongoose.Schema({
  optionText: {
    type: String,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
});

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: [optionSchema],
});

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true
    },
    totalQuestions: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      required: true
    },
    liveDate: {
      type: Date,
      required: true
    },
    deadDate: {
      type: Date,
      required: true
    },
    questions: [questionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    requiresThirdEye: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);

