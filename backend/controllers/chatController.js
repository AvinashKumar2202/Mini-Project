import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from "../middleware/asyncHandler.js";

export const handleChat = asyncHandler(async (req, res) => {
    const { messages, userRole, userName } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        res.status(503);
        throw new Error("🚨 Gemini API key is missing. Please add GEMINI_API_KEY to your backend .env file to enable the SAAN AI Assistant.");
    }

    if (!messages || !Array.isArray(messages)) {
        res.status(400);
        throw new Error("Messages array is required");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    let systemInstruction = `You are SAAN Agent, the highly-advanced AI core of the SAAN AI Exam Platform. 
    Your mission: Ensure a seamless, professional, and supportive experience for all users.

    General Platform Expertise:
    - THIRD EYE PROCTORING: We use unique QR-based mobile room monitoring. Advise users on light, angle, and connectivity.
    - AI QUESTION PARSING: Teachers can upload PDFs/Text and you (the backend system) will extract questions automatically.
    - REAL-TIME SYNC: Student progress is saved every 30s. If the net fails, they shouldn't panic — progress is safe.
    - NEGATIVE MARKING: Explain that it's a teacher-level setting to discourage guessing.
    - AUTO-SUBMISSION: 3 tab-switching warnings or timer expiration leads to auto-submission.
    - SUBMISSIVE GRADING: Explain that subjective questions need manual teacher review before the final score is visible.
    - REPORTS: Teachers can generate professional PDF reports for every student submission.

    Personality & Style:
    - Professional, warm, and highly scannable (use **bolding**, lists, and emoji).
    - If you Don't know something, be honest: "I don't have that specific data yet, but I can help you with what I know."
    - Refer to yourself as "SAAN Agent" or "Saan".`;

    if (userRole === "teacher") {
        systemInstruction += `\n\nTEACHER MODE (You are talking to ${userName}):
        - Guide them through 'Exam Management': Creating, Scheduling, and Monitoring.
        - Encourage them to use 'Exam Logs' for deep proctoring insights (Face detection, Mobile detection).
        - Help them with 'Question Banking': Explain how to add MCQ vs Subjective.
        - Remind them they can download results as CSV for Excel analysis.`;
    } else {
        systemInstruction += `\n\nSTUDENT MODE (You are talking to ${userName}):
        - BE ENCOURAGING. Exams are stressful. Say things like "You've got this!" or "Stay focused."
        - TECH SUPPORT: Guide them on camera permissions and fullscreen requirements.
        - INTEGRITY: Remind them that tab-switching is tracked and will lead to an auto-fail after 3 warnings.
        - EXPLAIN RESULTS: Help them understand their score and how to view passing/failing status.
        - DIRECT ANSWERS: If they ask for answers to specific subjects, offer CONCEPTUAL explanations instead of providing direct solutions to maintain exam integrity.`;
    }

    const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction 
    });

    let formattedHistory = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'bot' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    // Google API strict rule: history must start with "user".
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
    }

    const chat = model.startChat({
        history: formattedHistory,
        generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
        },
    });

    const lastMessage = messages[messages.length - 1].text;
    
    try {
        const result = await chat.sendMessage(lastMessage);
        const response = await result.response;
        const replyText = response.text();
        res.status(200).json({ reply: replyText });
    } catch (error) {
        console.error("Gemini API Error:", error.message || error);
        const errMsg = error.message || '';
        if (errMsg.includes('429') || errMsg.includes('quota')) {
            res.status(429);
            throw new Error("⏳ AI rate limit reached. Please wait a minute and try again.");
        }
        if (errMsg.includes('403') || errMsg.includes('API_KEY_INVALID')) {
            res.status(503);
            throw new Error("🔑 Invalid Gemini API key. Please check your GEMINI_API_KEY in the backend .env file.");
        }
        res.status(500);
        throw new Error("⚠️ Failed to communicate with SAAN AI Assistant. Check API key or internet connection.");
    }
});
