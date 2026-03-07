import Exam from "../models/Exam.js";
import ExamSubmission from "../models/ExamSubmission.js";
import User from "../models/User.js";
import mongoose from "mongoose";

export const createExam = async (req, res) => {
  try {
    const { examName, totalQuestions, duration, liveDate, deadDate, requiresThirdEye } = req.body;

    if (!examName || !totalQuestions || !duration || !liveDate || !deadDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exam = await Exam.create({
      examName,
      totalQuestions,
      duration,
      liveDate,
      deadDate,
      requiresThirdEye: !!requiresThirdEye,
      createdBy: req.user.id
    });

    // Notify all students about the new exam
    await User.updateMany(
      { role: "student" },
      {
        $push: {
          notifications: {
            message: `New Exam: ${examName}`,
            examId: exam._id,
            read: false,
            createdAt: new Date(),
          },
        },
      }
    );

    res.status(201).json({
      message: "Exam created successfully",
      exam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Optional Check: Only allow the teacher who created the exam to delete it, or an admin
    if (exam.createdBy.toString() !== req.user.id.toString() && req.user.role !== "admin") {
      return res.status(401).json({ message: "Not authorized to delete this exam" });
    }

    await Exam.findByIdAndDelete(req.params.id);

    // Optionally: cascade delete questions & submissions related to this exam here
    await ExamSubmission.deleteMany({ examId: req.params.id });

    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("notifications");
    if (!user) return res.status(404).json({ message: "User not found" });

    // Sort newest first
    const sorted = [...user.notifications].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.status(200).json({ notifications: sorted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user.id },
      { $set: { "notifications.$[].read": true } }
    );
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const getAllExams = async (req, res) => {
  try {
    // const exams = await Exam.find();
    const exams = await Exam.find().populate("createdBy", "name email");
    res.status(200).json({ exams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// return questions array for a given exam
export const getQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }
    res.status(200).json(exam.questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// add a question to an exam
export const createQuestion = async (req, res) => {
  try {
    const { question, options, examId } = req.body;
    if (!question || !options || !examId) {
      return res.status(400).json({ message: "Question, options and examId are required" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    exam.questions.push({ question, options });
    const savedExam = await exam.save();
    const added = savedExam.questions[savedExam.questions.length - 1];
    res.status(201).json(added);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// save exam submission with student answers and score
export const submitExam = async (req, res) => {
  try {
    const {
      examId,
      answers,
      score,
      totalQuestions,
      cheatingLog = {},
      studentName,
      studentEmail,
    } = req.body;

    if (!examId || !answers || score === undefined || !totalQuestions) {
      return res.status(400).json({
        message: "examId, answers, score, and totalQuestions are required",
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const percentage = Math.round((score / totalQuestions) * 100);

    const submission = await ExamSubmission.create({
      examId,
      studentId: new mongoose.Types.ObjectId(req.user.id),
      studentName: studentName || req.user.name,
      studentEmail: studentEmail || req.user.email,
      answers,
      score,
      totalQuestions,
      percentage,
      cheatingViolations: {
        noFaceCount: cheatingLog.noFaceCount || 0,
        multipleFaceCount: cheatingLog.multipleFaceCount || 0,
        cellPhoneCount: cheatingLog.cellPhoneCount || 0,
        ProhibitedObjectCount: cheatingLog.ProhibitedObjectCount || 0,
      },
    });

    // Populate exam reference before returning
    const populatedSubmission = await submission.populate(
      "examId",
      "examName totalQuestions duration"
    );

    res.status(201).json({
      message: "Exam submitted successfully",
      submission: populatedSubmission,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get exam submissions by exam id
export const getExamSubmissions = async (req, res) => {
  try {
    const { examId } = req.params;

    const submissions = await ExamSubmission.find({ examId })
      .populate("examId", "examName totalQuestions duration")
      .populate("studentId", "name email")
      .sort({ submittedAt: -1 });

    res.status(200).json({
      message: "Submissions retrieved successfully",
      submissions,
      count: submissions.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get student's submission for a specific exam
export const getStudentSubmission = async (req, res) => {
  try {
    const { examId, studentId } = req.params;

    const submission = await ExamSubmission.findOne({
      examId,
      studentId,
    })
      .populate("examId", "examName totalQuestions duration questions")
      .populate("studentId", "name email");

    if (!submission) {
      return res
        .status(404)
        .json({ message: "No submission found for this exam" });
    }

    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get all submissions by current student
export const getMySubmissions = async (req, res) => {
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.id);
    console.log('Fetching submissions for studentId:', req.user.id, 'as ObjectId:', studentId);

    const submissions = await ExamSubmission.find({
      $or: [
        { studentId: req.user.id },
        { studentId: studentId },
        { studentEmail: req.user.email }
      ]
    })
      .populate("examId", "examName totalQuestions duration")
      .sort({ submittedAt: -1 });

    res.status(200).json({
      message: "Student submissions retrieved successfully",
      submissions,
      count: submissions.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
