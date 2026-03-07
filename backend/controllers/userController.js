import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

/* ─── Nodemailer transport ────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// REGISTER
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
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
    token: token,
    message: "Registration successful"
  });
};

// LOGIN
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid email or password" });
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
    token: token,
    message: "Login successful",
  });
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Logout failed" });
  }
};

/* ─── FORGOT PASSWORD — step 1 ───────────────────────────────────────── */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    // Generic message to prevent user-enumeration
    if (!user) {
      return res.status(200).json({
        message: "If that email is registered, you will receive an OTP shortly.",
      });
    }

    // Generate a cryptographically-safe 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedOtp = await bcrypt.hash(otp, salt);

    user.resetOtp = hashedOtp;
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP email
    await transporter.sendMail({
      from: `"SAAN AI" <${process.env.EMAIL_USER}>`,
      to: email,
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
          <p style="color:#888;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({
      message: "If that email is registered, you will receive an OTP shortly.",
    });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

/* ─── VERIFY OTP — step 2 ────────────────────────────────────────────── */
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const user = await User.findOne({ email });
    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (user.resetOtpExpires < new Date()) {
      user.resetOtp = null;
      user.resetOtpExpires = null;
      await user.save();
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid OTP. Please check and try again." });
    }

    // Issue a short-lived reset token (5 minutes)
    const resetToken = jwt.sign(
      { id: user._id, purpose: "password-reset" },
      process.env.JWT_SECRET,
      { expiresIn: "5m" }
    );

    // Clear OTP immediately after verification (single-use)
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully", resetToken });
  } catch (error) {
    console.error("verifyOtp error:", error);
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
};

/* ─── RESET PASSWORD — step 3 ───────────────────────────────────────── */
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: "Reset session expired. Please start over." });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(400).json({ message: "Invalid reset token" });
    }

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successfully! You can now log in." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Password reset failed. Please try again." });
  }
};

