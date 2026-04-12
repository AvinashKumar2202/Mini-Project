import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam" },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["teacher", "student"],
      default: "student",
    },
    universityId: {
      type: String,
      default: null,
    },
    teacherId: {
      type: String,
      default: null,
    },
    mobileNumber: {
      type: String,
      default: null,
    },
    isMobileVerified: {
      type: Boolean,
      default: false,
    },
    notifications: [notificationSchema],
    resetOtp: { type: String, default: null },
    resetOtpExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────────
// email already has a unique index; add explicit indexes for other common lookups
userSchema.index({ mobileNumber: 1 });
userSchema.index({ role: 1 });

const User = mongoose.model("User", userSchema);
export default User;
