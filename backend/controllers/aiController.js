import { GoogleGenerativeAI } from '@google/generative-ai';
import asyncHandler from "../middleware/asyncHandler.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Robustly extract a JSON array from a string that may contain markdown,
 * commentary, or other wrapping from the AI model.
 * Tries progressively more aggressive strategies until it succeeds.
 */
const extractJsonArray = (rawText) => {
  let text = rawText.trim();

  // Strategy 1: Direct parse (already clean JSON)
  try { return JSON.parse(text); } catch (_) {}

  // Strategy 2: Strip common markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch (_) {}
  }

  // Strategy 3: Strip ALL backtick blocks and try again
  text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
  try { return JSON.parse(text); } catch (_) {}

  // Strategy 4: Find the first '[' and last ']' and parse what's in between
  const firstBracket = text.indexOf('[');
  const lastBracket  = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket > firstBracket) {
    const candidate = text.slice(firstBracket, lastBracket + 1);
    try { return JSON.parse(candidate); } catch (_) {}
  }

  // Strategy 5: Find the first '{' (single object) and wrap in array
  const firstBrace = text.indexOf('{');
  const lastBrace  = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = '[' + text.slice(firstBrace, lastBrace + 1) + ']';
    try { return JSON.parse(candidate); } catch (_) {}
  }

  throw new Error(`Unable to extract valid JSON from AI response. Raw response (first 200 chars): ${rawText.substring(0, 200)}`);
};

// ── AI-Powered Question Parsing from raw text ─────────────────────────────────
export const parseQuestionsFromText = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    res.status(503);
    throw new Error("🚨 Gemini API key is missing. Please add GEMINI_API_KEY to your backend .env file.");
  }

  if (!text || typeof text !== 'string' || text.trim().length < 10) {
    res.status(400);
    throw new Error("Valid text content (at least 10 characters) is required for parsing.");
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,        // Low temperature = more structured, predictable output
      maxOutputTokens: 8192,
    },
  });

  const prompt = `Extract all exam questions from the following text and return them as a JSON array.

STRICT OUTPUT RULES:
- Return ONLY a valid JSON array. Nothing else. No explanations. No markdown. No backticks.
- Start your response with [ and end with ]
- Do NOT include any text before or after the JSON array.

Each element in the array must follow this exact schema:
{
  "question": "<the question text, cleaned of numbering like Q1. or 1)>",
  "type": "objective" | "subjective",
  "options": [
    { "optionText": "<option text>", "isCorrect": true | false }
  ],
  "correctAnswerText": "<only for subjective questions, otherwise empty string>"
}

Rules for filling the schema:
- For multiple-choice questions: type = "objective", fill options array, mark exactly one isCorrect: true
- For open-ended / descriptive questions: type = "subjective", options = [], fill correctAnswerText if answer is provided
- Clean the question text: remove "Q1.", "1.", "(a)", "Answer:", "Ans." etc.
- Skip any text that is not a question (e.g., instructions, page numbers, headers)
- Remove duplicate questions

Text to parse:
"""
${text.substring(0, 120000)}
"""`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();

    // Robustly extract JSON from whatever the model returned
    const questions = extractJsonArray(rawText);

    if (!Array.isArray(questions)) {
      res.status(500);
      throw new Error("AI returned data in an unexpected format (not an array).");
    }

    // Validate and sanitize each question
    const valid = questions.filter(q => {
      if (!q || typeof q !== 'object') return false;
      if (!q.question || typeof q.question !== 'string' || q.question.trim().length === 0) return false;
      return true;
    }).map(q => ({
      question: q.question.trim(),
      type: (q.type === 'subjective') ? 'subjective' : 'objective',
      correctAnswerText: (typeof q.correctAnswerText === 'string') ? q.correctAnswerText : '',
      options: Array.isArray(q.options)
        ? q.options
            .filter(o => o && typeof o === 'object' && o.optionText)
            .map(o => ({ optionText: String(o.optionText).trim(), isCorrect: Boolean(o.isCorrect) }))
        : [],
    }));

    if (valid.length === 0) {
      res.status(422);
      throw new Error("AI could not find any valid questions in the document. Try a clearer PDF or check that the document contains exam questions.");
    }

    res.status(200).json(valid);

  } catch (error) {
    // Don't swallow the real error — surface it for debugging
    const msg = error.message || String(error);

    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
      res.status(429);
      throw new Error("⏳ Gemini API rate limit reached. Please wait 1 minute and try again.");
    }
    if (msg.includes('403') || msg.toLowerCase().includes('api_key_invalid') || msg.toLowerCase().includes('invalid api key')) {
      res.status(403);
      throw new Error("🔑 Invalid Gemini API key. Check GEMINI_API_KEY in your backend .env file.");
    }
    if (msg.includes('Unable to extract valid JSON')) {
      res.status(422);
      throw new Error(`🤖 AI returned a response but it could not be parsed. ${msg}`);
    }

    console.error("[AI PARSE ERROR]", msg);
    res.status(500);
    throw new Error(`🤖 AI parsing failed: ${msg}`);
  }
});
