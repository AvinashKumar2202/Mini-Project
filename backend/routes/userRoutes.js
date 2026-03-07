import express from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    forgotPassword,
    verifyOtp,
    resetPassword,
} from "../controllers/userController.js";
import { createCheatingLog, getCheatingLogs } from "../controllers/cheatingController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", registerUser);
router.post("/auth", loginUser);
router.post("/logout", logoutUser);

// Forgot password flow (all public — no auth middleware)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.post("/cheatingLogs", protect, createCheatingLog);
router.get("/cheatingLogs/:examId", protect, getCheatingLogs);

export default router;
