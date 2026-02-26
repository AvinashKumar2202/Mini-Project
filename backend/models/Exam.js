import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  },
  correctAnswer: {
    type: Number, // index of correct option
    required: true
  }
});

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    duration: {
      type: Number, // in minutes
      required: true
    },
    questions: [questionSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);

