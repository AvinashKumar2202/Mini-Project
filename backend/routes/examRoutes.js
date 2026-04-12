import express from "express";
import {
  createExam,
  deleteExam,
  getAllExams,
  getExamById,
  updateExam,
  getQuestions,
  createQuestion,
  submitExam,
  getExamSubmissions,
  getStudentSubmission,
  getSubmissionById,
  getMySubmissions,
  getNotifications,
  markNotificationsRead,
  getLeaderboard,
  getExamAnalytics,
  bulkImportQuestions,
  csvImportQuestions,
  clearExamQuestions,
} from "../controllers/examController.js";
import { parseQuestionsFromText } from "../controllers/aiController.js";
import protect, { isTeacher, isStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin/Teacher will create exam
router.post("/", protect, isTeacher, createExam);
router.get("/", protect, getAllExams);
router.get("/leaderboard", protect, getLeaderboard);

// questions endpoints
router.post("/questions", protect, isTeacher, createQuestion);
router.post("/bulk-import", protect, isTeacher, bulkImportQuestions);
router.post("/csv-import",  protect, isTeacher, csvImportQuestions);
router.post("/ai-parse", protect, isTeacher, parseQuestionsFromText);
router.get("/questions/:examId", protect, getQuestions);
router.delete("/questions/:id", protect, isTeacher, clearExamQuestions);

// submission endpoints
router.post("/submit", protect, isStudent, submitExam);
router.get("/analytics/:examId", protect, isTeacher, getExamAnalytics);
router.get("/submissions/:examId", protect, isTeacher, getExamSubmissions);
router.get("/submission/:id", protect, getSubmissionById);
router.get("/submission/:examId/:studentId", protect, isTeacher, getStudentSubmission);
router.get("/my-submissions", protect, isStudent, getMySubmissions);

// notification endpoints
router.get("/notifications", protect, getNotifications);
router.put("/notifications/read", protect, markNotificationsRead);

// Wildcard path routes (must be at the bottom)
router.get("/:id", protect, getExamById);
router.put("/:id", protect, isTeacher, updateExam);
router.delete("/:id", protect, isTeacher, deleteExam);

export default router;
