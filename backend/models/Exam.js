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
  type: {
    type: String,
    enum: ['objective', 'subjective'],
    default: 'objective',
  },
  correctAnswerText: {
    type: String,
  },
  options: [optionSchema],
});

const examSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
      required: true
    },
    examType: {
      type: String,
      enum: ['objective', 'subjective', 'both'],
      default: 'objective'
    },
    allowedAttempts: {
      type: Number,
      required: true,
      default: 1,
      min: 1
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
    allowNegativeMarking: {
      type: Boolean,
      default: false,
    },
    negativeMarks: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: "",
    },
    allowedUsers: [{
      type: String,
    }],
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// For teacher's exam list filtered by creator
examSchema.index({ createdBy: 1 });
// For date-range availability checks (active/upcoming exams)
examSchema.index({ liveDate: 1, deadDate: 1 });

export default mongoose.model("Exam", examSchema);
