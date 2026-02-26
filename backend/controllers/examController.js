import Exam from "../models/Exam.js";

export const createExam = async (req, res) => {
  try {
    const { title, duration, questions } = req.body;

    if (!title || !duration || !questions) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const exam = await Exam.create({
      title,
      duration,
      questions,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: "Exam created successfully",
      exam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
