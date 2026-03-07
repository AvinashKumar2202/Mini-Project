import CheatingLog from "../models/CheatingLog.js";
import Exam from "../models/Exam.js";

// Create a cheating log
export const createCheatingLog = async (req, res) => {
  try {
    const { examId, username, email, noFaceCount, multipleFaceCount, cellPhoneCount, ProhibitedObjectCount } = req.body;

    if (!examId) {
      return res.status(400).json({ message: "examId is required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    const log = await CheatingLog.create({
      examId,
      username,
      email,
      noFaceCount: noFaceCount || 0,
      multipleFaceCount: multipleFaceCount || 0,
      cellPhoneCount: cellPhoneCount || 0,
      ProhibitedObjectCount: ProhibitedObjectCount || 0,
    });

    // Populate examId reference before returning
    const populatedLog = await log.populate("examId", "examName totalQuestions duration");
    res.status(201).json(populatedLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get cheating logs for an exam
export const getCheatingLogs = async (req, res) => {
  try {
    const { examId } = req.params;
    const logs = await CheatingLog.find({ examId })
      .populate("examId", "examName totalQuestions duration")
      .sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
