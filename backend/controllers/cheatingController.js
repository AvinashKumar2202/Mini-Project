import CheatingLog from "../models/CheatingLog.js";
import Exam from "../models/Exam.js";
import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncHandler.js";

// Create a cheating log
export const createCheatingLog = asyncHandler(async (req, res) => {
  const { examId, username, email, noFaceCount, multipleFaceCount, cellPhoneCount, prohibitedObjectCount } = req.body;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  const log = await CheatingLog.create({
    examId,
    username,
    email,
    noFaceCount: noFaceCount || 0,
    multipleFaceCount: multipleFaceCount || 0,
    cellPhoneCount: cellPhoneCount || 0,
    prohibitedObjectCount: prohibitedObjectCount || 0,
  });

  const populatedLog = await log.populate("examId", "examName totalQuestions duration");
  res.status(201).json(populatedLog);
});

// Get cheating logs for an exam
// Get cheating logs for an exam
export const getCheatingLogs = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const logs = await CheatingLog.find({ examId })
    .populate("examId", "examName totalQuestions duration")
    .sort({ createdAt: -1 });
  res.status(200).json(logs);
});
