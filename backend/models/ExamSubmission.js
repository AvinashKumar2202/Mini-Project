import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionIndex: {
    type: Number,
    required: true,
  },
  questionType: {
    type: String,
    enum: ['objective', 'subjective'],
    default: 'objective',
  },
  selectedOptionId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  answerText: {
    type: String,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  aiGraded: {
    type: Boolean,
    default: false,
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
      prohibitedObjectCount: { type: Number, default: 0 },
    },
    trustScore: {
      type: Number,
      default: 100,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// Compound index for fetching a student's submissions (most common query pattern)
examSubmissionSchema.index({ studentId: 1, submittedAt: -1 });
// Compound index for teacher viewing all submissions for a given exam
examSubmissionSchema.index({ examId: 1, submittedAt: -1 });
// Index: allow fetching all submissions for a student-exam combination (since multiple attempts are supported)
examSubmissionSchema.index({ examId: 1, studentId: 1 });

const ExamSubmission = mongoose.model("ExamSubmission", examSubmissionSchema);
export default ExamSubmission;
