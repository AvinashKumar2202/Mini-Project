import crypto from "crypto";
import User from "../models/User.js";
import MobileOtp from "../models/MobileOtp.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import asyncHandler from "../middleware/asyncHandler.js";

/* ─── Nodemailer transport ────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// REGISTER
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, universityId, teacherId, mobileNumber } = req.body;

  if (!name || !email || !password || !mobileNumber) {
    res.status(400);
    throw new Error("Please fill in all required fields");
  }

  const otpRecord = await MobileOtp.findOne({ mobileNumber, verified: true }).lean();
  if (!otpRecord) {
    res.status(400);
    throw new Error("Please verify your mobile number first");
  }

  const userExists = await User.findOne({ email }).lean();
  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
    universityId: role === 'student' ? universityId : null,
    teacherId: role === 'teacher' ? teacherId : null,
    mobileNumber: mobileNumber,
    isMobileVerified: true,
  });

  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    universityId: user.universityId,
    teacherId: user.teacherId,
    mobileNumber: user.mobileNumber,
    isMobileVerified: user.isMobileVerified,
    token: token,
    message: "Registration successful"
  });
});

// MOBILE OTP (Sending & Verification)
export const sendMobileOtp = asyncHandler(async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) {
    res.status(400);
    throw new Error("Mobile number is required");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  console.log(`\n\n=== MOCK SMS ===\nTo: ${mobileNumber}\nYour SAAN AI Verification OTP is: ${otp}\n================\n\n`);

  await MobileOtp.findOneAndUpdate(
    { mobileNumber },
    { mobileNumber, otp, verified: false, createdAt: new Date() },
    { upsert: true, new: true }
  );

  res.status(200).json({ message: `OTP sent successfully! (Mock OTP: ${otp})` });
});

export const verifyMobileOtp = asyncHandler(async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) {
    res.status(400);
    throw new Error("Mobile number and OTP are required");
  }

  const otpRecord = await MobileOtp.findOne({ mobileNumber, otp });
  if (!otpRecord) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  otpRecord.verified = true;
  await otpRecord.save();

  res.status(200).json({ message: "Mobile number verified successfully" });
});

// LOGIN
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email/username and password");
  }

  const user = await User.findOne({
    $or: [{ email: email }, { name: email }]
  });
  if (!user) {
    res.status(400);
    throw new Error("Invalid username/email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error("Invalid username/email or password");
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    universityId: user.universityId,
    teacherId: user.teacherId,
    token: token,
    message: "Login successful",
  });
});

// LOGOUT
export const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "Logout successful" });
});

// FORGOT PASSWORD
export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    res.status(400);
    throw new Error("Email or Mobile Number is required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { mobileNumber: identifier }]
  });

  if (!user) {
    return res.status(200).json({
      message: "If that account is registered, you will receive an OTP shortly.",
    });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  user.resetOtp = otp;
  user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  if (identifier.includes("@")) {
    try {
      await transporter.sendMail({
        from: `"SAAN AI" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "SAAN AI — Your Password Reset OTP",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border-radius:12px;background:#f8f6ff;border:1px solid #ede9fe">
            <h2 style="color:#6c63ff;margin-bottom:4px">SAAN AI</h2>
            <p style="color:#555;margin-bottom:24px">Password Reset Request</p>
            <p style="color:#333">Hi <strong>${user.name}</strong>,</p>
            <p style="color:#333">Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align:center;margin:32px 0">
              <span style="display:inline-block;letter-spacing:12px;font-size:40px;font-weight:800;color:#6c63ff;background:#ede9fe;padding:16px 28px;border-radius:12px">${otp}</span>
            </div>
            <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this message.</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.log("Mail is not configured properly, falling back to mock UI display.", mailError.message);
      return res.status(200).json({
        message: `Mail not configured. (Mock OTP: ${otp})`,
      });
    }
    return res.status(200).json({
      message: "If that account is registered, you will receive an OTP shortly.",
    });
  } else {
    console.log(`\n\n=== MOCK SMS ===\nTo: ${user.mobileNumber}\nYour SAAN AI Password Reset OTP is: ${otp}\n================\n\n`);
    return res.status(200).json({
      message: `OTP sent! (Mock OTP: ${otp})`,
    });
  }
});

// VERIFY OTP
export const verifyOtp = asyncHandler(async (req, res) => {
  const { identifier, otp } = req.body;
  if (!identifier || !otp) {
    res.status(400);
    throw new Error("Email/Mobile and OTP are required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { mobileNumber: identifier }]
  });
  if (!user || !user.resetOtp || !user.resetOtpExpires) {
    res.status(400);
    throw new Error("Invalid or expired OTP");
  }

  if (user.resetOtpExpires < new Date()) {
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();
    res.status(400);
    throw new Error("OTP has expired. Please request a new one.");
  }

  if (otp !== user.resetOtp) {
    res.status(400);
    throw new Error("Invalid OTP. Please check and try again.");
  }

  const resetToken = jwt.sign(
    { id: user._id, purpose: "password-reset" },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  user.resetOtp = null;
  user.resetOtpExpires = null;
  await user.save();

  res.status(200).json({ message: "OTP verified successfully", resetToken });
});

// RESET PASSWORD
export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    res.status(400);
    throw new Error("Reset token and new password are required");
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  let decoded;
  try {
    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch {
    res.status(400);
    throw new Error("Reset session expired. Please start over.");
  }

  if (decoded.purpose !== "password-reset") {
    res.status(400);
    throw new Error("Invalid reset token");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.status(200).json({ message: "Password reset successfully! You can now log in." });
});

/* ─── UPDATE USER PROFILE ───────────────────────────────────────────── */
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role;

  if (user.role === 'student') {
    user.universityId = req.body.universityId || user.universityId;
    user.teacherId = null;
  } else if (user.role === 'teacher') {
    user.teacherId = req.body.teacherId || user.teacherId;
    user.universityId = null;
  }

  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  const updatedUser = await user.save();

  const token = jwt.sign(
    { id: updatedUser._id, role: updatedUser.role, name: updatedUser.name, email: updatedUser.email },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    _id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    universityId: updatedUser.universityId,
    teacherId: updatedUser.teacherId,
    token: token,
    message: "Profile updated successfully",
  });
});
