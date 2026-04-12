import mongoose from "mongoose";

const cheatingLogSchema = new mongoose.Schema(
  {
    noFaceCount: { type: Number, default: 0 },
    multipleFaceCount: { type: Number, default: 0 },
    cellPhoneCount: { type: Number, default: 0 },
    prohibitedObjectCount: { type: Number, default: 0 },
    examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
    username: { type: String },
    email: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("CheatingLog", cheatingLogSchema);
