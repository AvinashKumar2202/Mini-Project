import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  selectedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
});

const examSubmissionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    studentEmail: {
      type: String,
      required: true,
    },
    answers: [answerSchema],
    score: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    cheatingViolations: {
      noFaceCount: { type: Number, default: 0 },
      multipleFaceCount: { type: Number, default: 0 },
      cellPhoneCount: { type: Number, default: 0 },
      ProhibitedObjectCount: { type: Number, default: 0 },
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const ExamSubmission = mongoose.model("ExamSubmission", examSubmissionSchema);
export default ExamSubmission;
