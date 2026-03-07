import express from "express";
import {
  createExam,
  deleteExam,
  getAllExams,
  getQuestions,
  createQuestion,
  submitExam,
  getExamSubmissions,
  getStudentSubmission,
  getMySubmissions,
  getNotifications,
  markNotificationsRead,
} from "../controllers/examController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin will create exam
router.post("/", protect, createExam);
router.delete("/:id", protect, deleteExam);
router.get("/", protect, getAllExams);

// questions endpoints
router.post("/questions", protect, createQuestion);
router.get("/questions/:examId", protect, getQuestions);

// submission endpoints
router.post("/submit", protect, submitExam);
router.get("/submissions/:examId", protect, getExamSubmissions);
router.get("/submission/:examId/:studentId", protect, getStudentSubmission);
router.get("/my-submissions", protect, getMySubmissions);

// notification endpoints
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsRead);

export default router;
