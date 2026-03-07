/**
 * useExamCheckpoint
 *
 * Saves exam progress (answers, current question, remaining seconds) to
 * localStorage so students can resume after a crash or power failure.
 *
 * Key format: `exam_checkpoint_<examId>_<userId>`
 */

const buildKey = (examId, userId) => `exam_checkpoint_${examId}_${userId}`;

/**
 * Save current progress to localStorage.
 * @param {string}  examId
 * @param {string}  userId
 * @param {object}  selectedAnswers      - { [questionIndex]: optionId | null }
 * @param {number}  currentQuestionIndex
 * @param {number}  remainingSeconds
 */
export const saveCheckpoint = (examId, userId, selectedAnswers, currentQuestionIndex, remainingSeconds) => {
    try {
        const data = {
            selectedAnswers,
            currentQuestionIndex,
            remainingSeconds,
            savedAt: Date.now(),
        };
        localStorage.setItem(buildKey(examId, userId), JSON.stringify(data));
    } catch (e) {
        // localStorage might be full — fail silently
        console.warn('checkpoint save failed:', e);
    }
};

/**
 * Load a saved checkpoint.
 * Returns null if no checkpoint or data is too old (> exam duration * 2 min cutoff).
 * @param {string} examId
 * @param {string} userId
 * @returns {{ selectedAnswers, currentQuestionIndex, remainingSeconds } | null}
 */
export const loadCheckpoint = (examId, userId) => {
    try {
        const raw = localStorage.getItem(buildKey(examId, userId));
        if (!raw) return null;
        const data = JSON.parse(raw);
        // Discard checkpoints older than 4 hours
        if (Date.now() - data.savedAt > 4 * 60 * 60 * 1000) {
            clearCheckpoint(examId, userId);
            return null;
        }
        return data;
    } catch (e) {
        return null;
    }
};

/**
 * Remove a checkpoint (call on successful submit).
 * @param {string} examId
 * @param {string} userId
 */
export const clearCheckpoint = (examId, userId) => {
    try {
        localStorage.removeItem(buildKey(examId, userId));
    } catch (e) { /* ignore */ }
};
