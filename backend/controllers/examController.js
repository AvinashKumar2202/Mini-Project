import Exam from "../models/Exam.js";
import ExamSubmission from "../models/ExamSubmission.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import asyncHandler from "../middleware/asyncHandler.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Seeded Shuffle Helpers (Fisher-Yates + Mulberry32) ---
function getSeedFromString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}

function seededShuffle(array, seedString) {
  const seed = getSeedFromString(seedString);
  const prng = mulberry32(seed);
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const createExam = asyncHandler(async (req, res) => {
  const { examName, examType, allowedAttempts, totalQuestions, duration, liveDate, deadDate, requiresThirdEye, allowNegativeMarking, negativeMarks, description, allowedUsers } = req.body;

  if (!examName || !totalQuestions || !duration || !liveDate || !deadDate) {
    res.status(400);
    throw new Error("All fields are required");
  }

  let parsedAllowedUsers = [];
  if (allowedUsers) {
    if (Array.isArray(allowedUsers)) {
      parsedAllowedUsers = allowedUsers.map(u => u.trim()).filter(u => u);
    } else if (typeof allowedUsers === 'string') {
      parsedAllowedUsers = allowedUsers.split(',').map(u => u.trim()).filter(u => u);
    }
  }

  const exam = await Exam.create({
    examName,
    examType: examType || 'objective',
    allowedAttempts: allowedAttempts ? Number(allowedAttempts) : 1,
    totalQuestions,
    duration,
    liveDate,
    deadDate,
    requiresThirdEye: !!requiresThirdEye,
    allowNegativeMarking: !!allowNegativeMarking,
    negativeMarks: allowNegativeMarking ? Number(negativeMarks) || 1 : 0,
    description: description || "",
    allowedUsers: parsedAllowedUsers,
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
});

export const deleteExam = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const exam = await Exam.findById(req.params.id).lean();

  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.createdBy.toString() !== req.user.id.toString() && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized to delete this exam");
  }

  await Exam.findByIdAndDelete(req.params.id);
  await ExamSubmission.deleteMany({ examId: req.params.id });

  res.status(200).json({ message: "Exam deleted successfully" });
});

export const getExamById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const exam = await Exam.findById(req.params.id).select("-questions").lean();
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }
  
  res.status(200).json(exam);
});

export const updateExam = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const { examName, examType, allowedAttempts, totalQuestions, duration, liveDate, deadDate, requiresThirdEye, allowNegativeMarking, negativeMarks, description, allowedUsers } = req.body;

  let parsedAllowedUsers = [];
  if (allowedUsers) {
    if (Array.isArray(allowedUsers)) {
      parsedAllowedUsers = allowedUsers.map(u => u.trim()).filter(u => u);
    } else if (typeof allowedUsers === 'string') {
      parsedAllowedUsers = allowedUsers.split(',').map(u => u.trim()).filter(u => u);
    }
  }

  const updatedExam = await Exam.findByIdAndUpdate(
    id,
    {
      $set: {
        examName,
        examType: examType || 'objective',
        allowedAttempts: allowedAttempts ? Number(allowedAttempts) : 1,
        totalQuestions,
        duration,
        liveDate,
        deadDate,
        requiresThirdEye: !!requiresThirdEye,
        allowNegativeMarking: !!allowNegativeMarking,
        negativeMarks: allowNegativeMarking ? Number(negativeMarks) || 1 : 0,
        description: description || "",
        allowedUsers: parsedAllowedUsers
      }
    },
    { new: true, runValidators: true }
  ).select("-questions");

  if (!updatedExam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  res.status(200).json({
    message: "Exam updated successfully",
    exam: updatedExam
  });
});

export const getNotifications = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("notifications").lean();
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Sort newest first
  const sorted = [...user.notifications].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.status(200).json({ notifications: sorted });
});

export const markNotificationsRead = asyncHandler(async (req, res) => {
  await User.updateOne(
    { _id: req.user.id },
    { $set: { "notifications.$[].read": true } }
  );
  res.status(200).json({ message: "Notifications marked as read" });
});

export const getAllExams = asyncHandler(async (req, res) => {
  const exams = await Exam.find()
    .select("-questions")
    .populate("createdBy", "name email")
    .lean();

  if (req.user.role === "student") {
    const student = await User.findById(req.user.id).lean();
    if (!student) {
      res.status(404);
      throw new Error("User not found");
    }

    const filteredExams = exams.filter((e) => {
      if (!e.allowedUsers || e.allowedUsers.length === 0) return true;
      return e.allowedUsers.includes(student.email) || e.allowedUsers.includes(student.name);
    });
    return res.status(200).json({ exams: filteredExams });
  }

  res.status(200).json({ exams });
});

// Return questions array for a given exam
export const getQuestions = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const exam = await Exam.findById(examId).select("questions allowedUsers allowedAttempts totalQuestions").lean();
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  let activeQuestions = exam.questions || [];

  if (req.user.role === "student") {
    if (exam.allowedUsers && exam.allowedUsers.length > 0) {
      const student = await User.findById(req.user.id).lean();
      if (!student || (!exam.allowedUsers.includes(student.email) && !exam.allowedUsers.includes(student.name))) {
        res.status(403);
        throw new Error("You are not authorized to take this exam");
      }
    }

    const submissionsCount = await ExamSubmission.countDocuments({ examId: exam._id, studentId: req.user.id });
    if (submissionsCount >= (exam.allowedAttempts || 1)) {
      res.status(403);
      throw new Error("You have exceeded the maximum allowed attempts for this exam.");
    }

    // Shuffle and slice only for students
    if (req.user.id) {
      const seedString = `${req.user.id}_${examId}_${submissionsCount}`;
      activeQuestions = seededShuffle(activeQuestions, seedString);

      // Also shuffle options for each objective question
      activeQuestions = activeQuestions.map((q, idx) => {
        if (q.type === 'objective' && q.options && q.options.length > 0) {
          // Use a different seed for each question's options to ensure variety
          const optionSeed = `${seedString}_option_${idx}`;
          return {
            ...q,
            options: seededShuffle(q.options, optionSeed)
          };
        }
        return q;
      });
    }
    const maxQuestions = Math.min(exam.totalQuestions || activeQuestions.length, activeQuestions.length);
    activeQuestions = activeQuestions.slice(0, maxQuestions);
  }

  res.status(200).json(activeQuestions);
});

// ── CSV Import ────────────────────────────────────────────────────────────────
// Parse and import questions from CSV text.
// Expected columns (case-insensitive, any order):
//   question, a, b, c, d, answer   OR
//   question, option1, option2, option3, option4, correct
export const csvImportQuestions = asyncHandler(async (req, res) => {
  const { examId, csvText } = req.body;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error('Invalid Exam ID format');
  }

  if (!csvText || typeof csvText !== 'string') {
    res.status(400);
    throw new Error('CSV text is required');
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error('Exam not found');
  }

  // Split CSV into lines (handle CRLF and LF)
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    res.status(400);
    throw new Error('CSV must have a header row and at least one data row');
  }

  // Parse a CSV line respecting quoted fields
  const parseLine = (line) => {
    const cells = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

  // Map header names to canonical column indices
  const idx = {
    question:  headers.findIndex(h => ['question','questions','questiontext','text','ques','stmt','problem','q'].includes(h)),
    a:         headers.findIndex(h => ['a','opta','optiona','option1','opt1','choice1','ca'].includes(h)),
    b:         headers.findIndex(h => ['b','optb','optionb','option2','opt2','choice2','cb'].includes(h)),
    c:         headers.findIndex(h => ['c','optc','optionc','option3','opt3','choice3','cc'].includes(h)),
    d:         headers.findIndex(h => ['d','optd','optiond','option4','opt4','choice4','cd'].includes(h)),
    e:         headers.findIndex(h => ['e','opte','optione','option5','opt5','choice5','ce'].includes(h)),
    answer:    headers.findIndex(h => ['answer','ans','correct','correctanswer','key'].includes(h)),
    type:      headers.findIndex(h => ['type','questiontype','category'].includes(h)),
    correctTextIdx: headers.findIndex(h => ['correctanswertext','answertext','solution'].includes(h)),
  };

  if (idx.question === -1) {
    res.status(400);
    throw new Error(`CSV header must include a "question" column. Found: [${headers.join(', ')}]`);
  }

  const existingSet = new Set(exam.questions.map(q => q.question.trim().toLowerCase()));
  const batchSeen = new Set();
  const imported = [];
  const skipped = { empty: 0, duplicate: 0 };

  for (let i = 1; i < lines.length; i++) {
    const cells = parseLine(lines[i]);
    const qText = (cells[idx.question] || '').trim();
    if (!qText) { skipped.empty++; continue; }

    const norm = qText.toLowerCase();
    if (existingSet.has(norm) || batchSeen.has(norm)) { skipped.duplicate++; continue; }
    batchSeen.add(norm);

    const answerRaw = idx.answer >= 0 ? (cells[idx.answer] || '').trim().toUpperCase() : '';
    const letterToIndex = { A: 0, B: 1, C: 2, D: 3, E: 4 };
    const correctIdx = answerRaw in letterToIndex ? letterToIndex[answerRaw]
                     : /^\d+$/.test(answerRaw) ? parseInt(answerRaw, 10) - 1
                     : -1;

    const optLetters = [idx.a, idx.b, idx.c, idx.d, idx.e];
    const options = optLetters
      .map((colIdx, position) => {
        if (colIdx === -1) return null;
        const text = (cells[colIdx] || '').trim();
        if (!text) return null;
        return { optionText: text, isCorrect: correctIdx === position || answerRaw === 'ABCDE'[position] };
      })
      .filter(Boolean);

    const rawType = idx.type >= 0 ? (cells[idx.type] || '').toLowerCase() : '';
    const qType = rawType.includes('sub') || rawType.includes('theory') ? 'subjective' : 'objective';
    const correctAnswerText = idx.correctTextIdx >= 0 ? (cells[idx.correctTextIdx] || '').trim() : '';

    imported.push({ question: qText, type: qType, options, correctAnswerText });
  }

  if (imported.length === 0) {
    res.status(200).json({
      message: `Nothing imported. Skipped ${skipped.empty} blank rows + ${skipped.duplicate} duplicates. Headers found: [${headers.join(', ')}]`,
      questions: exam.questions,
    });
    return;
  }

  exam.questions.push(...imported);
  await exam.save();

  res.status(200).json({
    message: `✅ ${imported.length} questions imported from CSV! (Skipped ${skipped.empty + skipped.duplicate})`,
    questions: exam.questions,
    skippedCount: skipped.empty + skipped.duplicate,
  });
});

// Bulk import questions for an exam
export const bulkImportQuestions = asyncHandler(async (req, res) => {
  const { examId, questions } = req.body;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  if (!questions || !Array.isArray(questions)) {
    res.status(400);
    throw new Error("Questions array is required");
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  // ── Duplicate Check ───
  // Compare trimmed, case-insensitive normalized strings to filter out matches
  const existingQuestions = new Set(
    exam.questions.map(q => q.question.trim().toLowerCase())
  );

  // ── Smart Question Field Extractor ───────────────────────────────────────────
  // SAFE: Only recognises explicit question field names. No auto-detect.
  // Auto-detect was removed because it incorrectly picked option texts (a/b/c/d)
  // and answer values as question text when the field name was unexpected.
  const extractQuestionText = (q) => {
    if (typeof q === 'string') return q;

    // Strategy 1: Try exhaustive list of exact question field names
    const directKeys = [
      'question', 'questionText', 'Question', 'QuestionText', 'QUESTION',
      'Questions', 'QUESTIONS',
      'text', 'Text', 'TEXT',
      'ques', 'Ques', 'QUES',
      'description', 'Description',
      'title', 'Title',
      'stmt', 'Stmt', 'statement', 'Statement',
      'problem', 'Problem',
      'prompt', 'Prompt',
      'q_text', 'Q_text', 'question_text', 'Question_Text',
      'questiontext', 'QuestionText',
      'body', 'Body',
      'qn', 'Qn', 'qno', 'q_no',
      'sr', 'Sr',  // sometimes question text is under a serial field
    ];
    for (const key of directKeys) {
      if (q[key] && typeof q[key] === 'string' && q[key].trim().length > 0) return q[key];
    }

    // Strategy 2: Case-insensitive + strip separators key search
    const qKeys = Object.keys(q);
    for (const key of qKeys) {
      const lk = key.toLowerCase().replace(/[_\s\-\.]/g, '');
      const questionKeyVariants = [
        'question','questiontext','questions','ques','text',
        'description','content','prompt','problem','title',
        'stmt','statement','body','heading'
      ];
      if (questionKeyVariants.includes(lk)) {
        if (q[key] && typeof q[key] === 'string' && q[key].trim().length > 0) return q[key];
      }
    }

    // Strategy 3: Nested question object (e.g. { question: { text: '...' } })
    if (q.question && typeof q.question === 'object') {
      return q.question.text || q.question.question || q.question.value || null;
    }

    // ⚠️ Strategy 4 (auto-detect longest string) deliberately REMOVED.
    // It was picking option texts (a, b, c, d) and answer values as question text.
    // If your JSON field name is not recognised, we return null so you see a clear error.
    return null;
  };

  // ── Smart Options Extractor ───────────────────────────────────────────────────
  // Handles: string arrays, object arrays, flat A/B/C/D keys, numbered keys.
  const extractOptions = (q) => {
    // Helper: resolve correct answer index from various formats
    // answer: "A" → index 0, "B" → 1 ... or answer: "1" → index 0
    const correctRaw = (
      q.correct || q.answer || q.correctAnswer || q.correct_answer ||
      q.Answer || q.Correct || q.ans || q.Ans || ''
    ).toString().trim();
    const correctLetter = correctRaw.toUpperCase(); // "A", "B", "C", "D"
    const correctIndex  = /^\d+$/.test(correctRaw) ? parseInt(correctRaw, 10) - 1 : -1;

    // Normalize a raw option: a string becomes {optionText, isCorrect: false}
    const toObj = (val, idx) => {
      if (typeof val === 'object' && val !== null && val.optionText) return val;
      const text = String(val).trim();
      const isCorrect =
        correctIndex >= 0 ? (idx === correctIndex) :
        ('ABCDE'[idx] === correctLetter);
      return { optionText: text, isCorrect };
    };

    // 1. options / Options / choices arrays (handles both string elems AND object elems)
    for (const key of ['options', 'Options', 'choices', 'Choices', 'Answers']) {
      if (q[key] && Array.isArray(q[key]) && q[key].length > 0) {
        return q[key].map((item, idx) => toObj(item, idx));
      }
    }

    // 2. Flat A/B/C/D keys:  { A: "...", B: "...", answer: "B" }
    const letterKeys = ['A','B','C','D','E'];
    const flatOpts = [];
    for (const letter of letterKeys) {
      const val = q[letter] ?? q[letter.toLowerCase()] ??
                  q[`option${letter}`] ?? q[`option_${letter.toLowerCase()}`] ??
                  q[`opt${letter}`];
      if (val != null && String(val).trim().length > 0) {
        flatOpts.push({ optionText: String(val).trim(), isCorrect: correctLetter === letter });
      }
    }
    if (flatOpts.length > 0) return flatOpts;

    // 3. Numbered keys: { option1: "...", option2: "..." }
    const numberedOpts = [];
    for (let i = 1; i <= 6; i++) {
      const val = q[`option${i}`] ?? q[`Option${i}`] ?? q[`opt${i}`] ?? q[`choice${i}`];
      if (val != null && String(val).trim().length > 0) {
        const isCorrect = correctIndex >= 0 ? (i - 1 === correctIndex) : (correctLetter === 'ABCDE'[i - 1]);
        numberedOpts.push({ optionText: String(val).trim(), isCorrect });
      }
    }
    return numberedOpts;
  };

  // ── Build diagnostic info for error messages ──────────────────────────────────
  const sampleKeys = questions.length > 0 ? Object.keys(questions[0]).join(', ') : 'unknown';
  console.log('[BULK IMPORT] Processing', questions.length, 'questions. Sample keys:', sampleKeys);

  const batchSeen = new Set();
  const skippedEmpty = [];
  const duplicatesCount = { total: 0, batch: 0, db: 0 };

  const formattedQuestions = questions
    .filter((q, idx) => {
      const questionText = extractQuestionText(q);
      
      if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
        skippedEmpty.push(idx);
        return false;
      }

      const normalized = questionText.trim().toLowerCase();
      
      // Duplicate check against database
      if (existingQuestions.has(normalized)) {
        duplicatesCount.total++;
        duplicatesCount.db++;
        return false;
      }

      // Duplicate check against current batch
      if (batchSeen.has(normalized)) {
        duplicatesCount.total++;
        duplicatesCount.batch++;
        return false;
      }

      batchSeen.add(normalized);
      q.question = questionText.trim();
      return true;
    })
    .map((q) => {
      const rawType = (q.type || q.questionType || q.Type || q.category || '').toString().toLowerCase();
      const qType = rawType.includes('sub') || rawType.includes('theory') || rawType.includes('essay') ? 'subjective' : 'objective';
      const opts = extractOptions(q);
      const correctAnswerText = q.correctAnswerText || q.correctAnswer || q.correct_answer ||
                                q.answer || q.solution || q.Answer || q.Solution || '';
      return {
        question: q.question,
        type: qType,
        correctAnswerText: typeof correctAnswerText === 'string' ? correctAnswerText : '',
        options: qType === 'subjective' ? [] : opts,
      };
    });

  if (formattedQuestions.length === 0) {
    res.status(200).json({ 
      message: `No new unique questions to import. Skipped ${skippedEmpty.length} unreadable items + ${duplicatesCount.total} duplicates. Your JSON keys: [${sampleKeys}]. Use key names like: "question", "text", "A"/"B"/"C"/"D" for options.`,
      questions: exam.questions,
      diagnostics: { sampleKeys, skippedCount: skippedEmpty.length, duplicatesCount }
    });
    return;
  }

  exam.questions.push(...formattedQuestions);
  await exam.save();

  res.status(200).json({ 
    message: `${formattedQuestions.length} questions imported successfully`,
    questions: exam.questions, // Return all questions
    skippedCount: questions.length - formattedQuestions.length
  });
});

// Add a question to an exam
export const createQuestion = asyncHandler(async (req, res) => {
  const { question, type, correctAnswerText, options, examId } = req.body;
  
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  if (!question) {
    res.status(400);
    throw new Error("Question is required");
  }
  if (type !== 'subjective' && (!options || options.length === 0)) {
    res.status(400);
    throw new Error("Options are required for objective questions");
  }
  if (type === 'subjective' && !correctAnswerText) {
    res.status(400);
    throw new Error("Correct answer text is required for subjective questions");
  }

  const exam = await Exam.findById(examId);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  exam.questions.push({ question, type: type || 'objective', correctAnswerText, options: type === 'subjective' ? [] : options });
  const savedExam = await exam.save();
  const added = savedExam.questions[savedExam.questions.length - 1];
  res.status(201).json(added);
});

// Save exam submission with student answers and score
export const submitExam = asyncHandler(async (req, res) => {
  const {
    examId,
    answers,
    score,
    totalQuestions,
    cheatingLog = {},
    studentName,
    studentEmail,
  } = req.body;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  if (!answers || score === undefined || !totalQuestions) {
    res.status(400);
    throw new Error("answers, score, and totalQuestions are required");
  }

  const exam = await Exam.findById(examId).lean();
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  let activeQuestions = exam.questions || [];
  if (req.user && req.user.id) {
    const submissionsCount = await ExamSubmission.countDocuments({ examId: exam._id, studentId: req.user.id });
    const seedString = `${req.user.id}_${examId}_${submissionsCount}`;
    activeQuestions = seededShuffle(activeQuestions, seedString);
  }
  const maxQuestions = Math.min(exam.totalQuestions || activeQuestions.length, activeQuestions.length);
  activeQuestions = activeQuestions.slice(0, maxQuestions);

  // ── SERVER-SIDE SCORE CALCULATION & AI GRADING ─────────────────────────
  let serverScore = 0;
  for (let index = 0; index < activeQuestions.length; index++) {
    const question = activeQuestions[index];
    const studentAnswer = answers.find(a => a.questionIndex === index);
    if (!studentAnswer) continue;

    if (question.type === 'subjective') {
      const ansText = (studentAnswer.answerText || '').trim();
      const correctText = (question.correctAnswerText || '').trim();
      
      let isCorrect = ansText.toLowerCase() === correctText.toLowerCase();

      // AI Subjective Grader Fallback
      if (!isCorrect && ansText.length > 0 && correctText.length > 0 && process.env.GEMINI_API_KEY) {
        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const aiMode = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: "You are a rigid Exam AI Grader. Evaluate if the student's answer accurately captures the core concept of the expected answer. Be fairly strict but accept synonyms. Output EXACTLY 'TRUE' if correct or 'FALSE' if incorrect."
          });
          const result = await aiMode.generateContent(`Question: ${question.question}\nExpected Answer: ${correctText}\nStudent Answer: ${ansText}`);
          const aiEval = (result.response.text() || "").trim().toUpperCase();
          
          if (aiEval.includes('TRUE')) {
            isCorrect = true;
            studentAnswer.aiGraded = true;
          }
        } catch (error) {
          console.error("AI Auto-Grader failed for question", index, ":", error.message);
        }
      }
      
      studentAnswer.isCorrect = isCorrect; // Enforce correct flag
      if (isCorrect) serverScore++;
    } else {
      const correctOption = question.options.find(opt => opt.isCorrect);
      const isCorrect = correctOption && correctOption._id.toString() === studentAnswer.selectedOptionId?.toString();
      
      studentAnswer.isCorrect = !!isCorrect; // Enforce correct flag
      if (isCorrect) {
        serverScore++;
      } else if (exam.allowNegativeMarking) {
        serverScore -= (exam.negativeMarks || 1);
      }
    }
  }

  const finalScore = serverScore;
  const finalTotalQuestions = activeQuestions.length;
  const percentage = finalTotalQuestions > 0 ? Math.round((finalScore / finalTotalQuestions) * 100) : 0;

  // ── TRUST SCORE CALCULATION ──────────────────────────────────────────────
  let calculatedTrust = 100;
  calculatedTrust -= (cheatingLog.noFaceCount || 0) * 10;
  calculatedTrust -= (cheatingLog.multipleFaceCount || 0) * 15;
  calculatedTrust -= (cheatingLog.cellPhoneCount || 0) * 20;
  calculatedTrust -= (cheatingLog.prohibitedObjectCount || 0) * 20;
  if (calculatedTrust < 0) calculatedTrust = 0;

  const submission = await ExamSubmission.create({
    examId,
    studentId: new mongoose.Types.ObjectId(req.user.id),
    studentName: studentName || req.user.name,
    studentEmail: studentEmail || req.user.email,
    answers,
    score: finalScore,
    totalQuestions: finalTotalQuestions,
    percentage,
    trustScore: calculatedTrust,
    cheatingViolations: {
      noFaceCount: cheatingLog.noFaceCount || 0,
      multipleFaceCount: cheatingLog.multipleFaceCount || 0,
      cellPhoneCount: cheatingLog.cellPhoneCount || 0,
      prohibitedObjectCount: cheatingLog.prohibitedObjectCount || 0,
    },
  });

  const populatedSubmission = await submission.populate(
    "examId",
    "examName totalQuestions duration"
  );

  res.status(201).json({
    message: "Exam submitted successfully",
    submission: populatedSubmission,
  });
});

// Get exam submissions by exam id (teacher view)
export const getExamSubmissions = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const submissions = await ExamSubmission.find({ examId })
    .populate("examId", "examName totalQuestions duration")
    .populate("studentId", "name email")
    .sort({ submittedAt: -1 })
    .lean();

  res.status(200).json({
    message: "Submissions retrieved successfully",
    submissions,
    count: submissions.length
  });
});

// Get student's submission for a specific exam
export const getStudentSubmission = asyncHandler(async (req, res) => {
  const { examId, studentId } = req.params;
  
  if (!mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
    res.status(400);
    throw new Error("Invalid ID format");
  }

  const submission = await ExamSubmission.findOne({ examId, studentId })
    .populate("examId", "examName totalQuestions duration questions")
    .populate("studentId", "name email universityId")
    .lean();

  if (!submission) {
    res.status(404);
    throw new Error("No submission found for this student in this exam");
  }

  res.status(200).json(submission);
});

// Get all submissions by current student
export const getMySubmissions = asyncHandler(async (req, res) => {
  const studentId = new mongoose.Types.ObjectId(req.user.id);

  const submissions = await ExamSubmission.find({ studentId })
    .populate("examId", "examName totalQuestions duration")
    .sort({ submittedAt: -1 })
    .lean();

  res.status(200).json({
    message: "Student submissions retrieved successfully",
    submissions,
    count: submissions.length,
  });
});

// Wipe all questions from an exam (useful when a bad bulk import is done)
export const clearExamQuestions = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const exam = await Exam.findById(id);
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  if (exam.createdBy.toString() !== req.user.id.toString() && req.user.role !== "admin") {
    res.status(403);
    throw new Error("Not authorized to modify this exam");
  }

  const deletedCount = exam.questions.length;
  exam.questions = [];
  await exam.save();

  res.status(200).json({ message: `Cleared ${deletedCount} questions from the exam.`, deletedCount });
});

// Gamification: Get Top Students Leaderboard
export const getLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await ExamSubmission.aggregate([
    {
      $group: {
        _id: "$studentId",
        totalScore: { $sum: "$score" },
        examsTaken: { $sum: 1 },
        averagePercentage: { $avg: "$percentage" },
        studentName: { $first: "$studentName" },
        studentEmail: { $first: "$studentEmail" }
      }
    },
    { $sort: { totalScore: -1, averagePercentage: -1 } },
    { $limit: 10 }
  ]);

  res.status(200).json(leaderboard);
});

// Advanced Analytics for a specific exam (Teacher View)
export const getExamAnalytics = asyncHandler(async (req, res) => {
  const { examId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(examId)) {
    res.status(400);
    throw new Error("Invalid Exam ID format");
  }

  const exam = await Exam.findById(examId).lean();
  if (!exam) {
    res.status(404);
    throw new Error("Exam not found");
  }

  const submissions = await ExamSubmission.find({ examId }).lean();
  
  if (submissions.length === 0) {
    return res.status(200).json({
      message: "No submissions yet for analytics",
      hasData: false,
      stats: { averageScore: 0, passRate: 0, totalAttempts: 0 }
    });
  }

  const totalAttempts = submissions.length;
  const totalScore = submissions.reduce((acc, s) => acc + s.score, 0);
  const averageScore = (totalScore / totalAttempts).toFixed(2);
  const passedCount = submissions.filter(s => s.percentage >= 40).length;
  const passRate = ((passedCount / totalAttempts) * 100).toFixed(2);

  // Question-by-Question breakdown
  const questionStats = {};
  exam.questions.forEach((_, idx) => {
    questionStats[idx] = { correct: 0, total: 0, questionText: exam.questions[idx].question };
  });

  submissions.forEach(s => {
    s.answers.forEach(ans => {
      if (questionStats[ans.questionIndex]) {
        questionStats[ans.questionIndex].total++;
        if (ans.isCorrect) questionStats[ans.questionIndex].correct++;
      }
    });
  });

  const detailedQuestions = Object.keys(questionStats).map(idx => ({
    index: parseInt(idx) + 1,
    text: questionStats[idx].questionText,
    successRate: questionStats[idx].total > 0 
      ? ((questionStats[idx].correct / questionStats[idx].total) * 100).toFixed(2)
      : 0,
    attempts: questionStats[idx].total
  })).sort((a,b) => a.successRate - b.successRate);

  res.status(200).json({
    hasData: true,
    stats: {
      averageScore,
      passRate,
      totalAttempts,
      highestScore: Math.max(...submissions.map(s => s.score)),
    },
    hardestQuestions: detailedQuestions.slice(0, 5),
  });
});

// Get a specific submission by its unique ID (accessible by student owner or any teacher)
export const getSubmissionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error("Invalid Submission ID format");
  }

  const submission = await ExamSubmission.findById(id)
    .populate("examId", "examName totalQuestions duration questions")
    .populate("studentId", "name email universityId")
    .lean();

  if (!submission) {
    res.status(404);
    throw new Error("Submission not found");
  }

  // Security check: Only the student who submitted or a teacher/admin can view it
  const isOwner = submission.studentId._id.toString() === req.user.id.toString();
  const isStaff = req.user.role === 'teacher' || req.user.role === 'admin';

  if (!isOwner && !isStaff) {
    res.status(403);
    throw new Error("Not authorized to view this submission");
  }

  res.status(200).json(submission);
});
