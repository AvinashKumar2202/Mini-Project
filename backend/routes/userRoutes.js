import express from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
    sendMobileOtp,
    verifyMobileOtp,
    updateUserProfile,
} from "../controllers/userController.js";
import { createCheatingLog, getCheatingLogs } from "../controllers/cheatingController.js";
import protect, { isTeacher, isStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", registerUser);
router.post("/auth", loginUser);
router.post("/logout", logoutUser);
router.put("/profile", protect, updateUserProfile);

// Forgot password flow (all public — no auth middleware)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.post("/send-mobile-otp", sendMobileOtp);
router.post("/verify-mobile-otp", verifyMobileOtp);

router.post("/cheatingLogs", protect, isStudent, createCheatingLog);
router.get("/cheatingLogs/:examId", protect, isTeacher, getCheatingLogs);

export default router;
