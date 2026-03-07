import { useEffect, useRef, useState, useCallback } from 'react';

const MAX_VIOLATIONS = 3;

/**
 * useExamLockdown
 *
 * @param {Function} onAutoSubmit  - called when violations reach MAX
 * @param {boolean}  isPaused      - when true, violations are NOT recorded
 */
const useExamLockdown = (onAutoSubmit, isPaused = false) => {
    const [violations, setViolations] = useState(0);
    const [warningVisible, setWarningVisible] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const violationsRef = useRef(0);
    const submittedRef = useRef(false);
    const lockdownActiveRef = useRef(false);
    const isPausedRef = useRef(isPaused);
    const lastViolationTimeRef = useRef(0);

    // KEY FIX: store onAutoSubmit in a ref so event handlers always call
    // the latest version even though they're attached only once.
    const onAutoSubmitRef = useRef(onAutoSubmit);

    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);
    useEffect(() => { onAutoSubmitRef.current = onAutoSubmit; }, [onAutoSubmit]);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const requestFullscreen = useCallback(() => {
        const el = document.documentElement;
        if (el.requestFullscreen) {
            el.requestFullscreen().catch(() => { });
        } else if (el.webkitRequestFullscreen) {
            el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
            el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
            el.msRequestFullscreen();
        }
    }, []);

    const isDocumentFullscreen = () =>
        !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

    const recordViolation = useCallback(() => {
        if (submittedRef.current || !lockdownActiveRef.current || isPausedRef.current) return;

        // THROTTLE: Prevent multiple simultaneous events (like blur + visibilityChange
        // + fullscreenChange) from instantly exhausting the user's 3 warnings.
        const now = Date.now();
        if (now - lastViolationTimeRef.current < 2000) return;
        lastViolationTimeRef.current = now;

        violationsRef.current += 1;
        const newCount = violationsRef.current;
        setViolations(newCount);
        setWarningVisible(true);

        if (newCount >= MAX_VIOLATIONS) {
            submittedRef.current = true;
        }

        setTimeout(() => {
            // Use the ref — always calls the latest handleTestSubmission
            if (newCount >= MAX_VIOLATIONS && onAutoSubmitRef.current) {
                onAutoSubmitRef.current();
            }
        }, 1500);
    }, []); // no deps — reads everything from refs

    // ── Event handlers ────────────────────────────────────────────────────────

    const handleFullscreenChange = useCallback(() => {
        const fs = isDocumentFullscreen();
        setIsFullscreen(fs);
        if (!fs && lockdownActiveRef.current && !submittedRef.current && !isPausedRef.current) {
            recordViolation();
            setTimeout(requestFullscreen, 400);
        }
    }, [recordViolation, requestFullscreen]);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden && lockdownActiveRef.current && !submittedRef.current && !isPausedRef.current) {
            recordViolation();
        }
    }, [recordViolation]);

    const handleBlur = useCallback(() => {
        if (lockdownActiveRef.current && !submittedRef.current && !isPausedRef.current) {
            recordViolation();
        }
    }, [recordViolation]);

    // ── Mount / Unmount ───────────────────────────────────────────────────────

    useEffect(() => {
        // Brief initial delay so the page can render its first dialogs
        // before we start guarding against blur/focus events
        const timer = setTimeout(() => {
            lockdownActiveRef.current = true;
        }, 2500);

        requestFullscreen();

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);

        return () => {
            clearTimeout(timer);
            lockdownActiveRef.current = false;
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('msfullscreenchange', handleFullscreenChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);

            if (isDocumentFullscreen() && document.exitFullscreen) {
                document.exitFullscreen().catch(() => { });
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const dismissWarning = useCallback(() => {
        setWarningVisible(false);
        requestFullscreen();
    }, [requestFullscreen]);

    return {
        violations,
        maxViolations: MAX_VIOLATIONS,
        warningVisible,
        dismissWarning,
        isFullscreen,
    };
};

export default useExamLockdown;
