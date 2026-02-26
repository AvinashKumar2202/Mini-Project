import express from "express";
import {createExam} from "../controllers/examController.js";
import protect from "../middleware/authMiddleware.js";


const router = express.Router();

//Admin will create exam
router.post("/", protect, createExam);

export default router;