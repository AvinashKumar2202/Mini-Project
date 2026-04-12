import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Grid, CircularProgress, LinearProgress, Typography, Stack, Chip,
  Dialog, DialogContent, Button, Alert, Divider,
  TextField, MenuItem, Select, FormControl, InputLabel, DialogTitle, DialogActions,
} from '@mui/material';
import ReportProblemRoundedIcon from '@mui/icons-material/ReportProblemRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import PhonelinkRoundedIcon from '@mui/icons-material/PhonelinkRounded';
import { QRCodeSVG } from 'qrcode.react';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from 'src/components/shared/BlankCard';
import MultipleChoiceQuestion from './Components/MultipleChoiceQuestion';
import NumberOfQuestions from './Components/NumberOfQuestions';
import WebCam from './Components/WebCam';
import RoomProctor from './Components/RoomProctor';
import { useGetExamsQuery, useGetQuestionsQuery, useSubmitExamMutation, useGetConfigIpQuery } from '../../slices/examApiSlice';
import { useSaveCheatingLogMutation } from 'src/slices/cheatingLogApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import swal from 'sweetalert';
import useExamLockdown from 'src/hooks/useExamLockdown';
import useThirdEye from 'src/hooks/useThirdEye';
import useBattery from 'src/hooks/useBattery';
import { saveCheckpoint, loadCheckpoint, clearCheckpoint } from 'src/hooks/useExamCheckpoint';

const TestPage = () => {
  const { examId } = useParams();

  const [selectedExam, setSelectedExam] = useState({});
  const [examDurationInSeconds, setexamDurationInSeconds] = useState(0);
  const { data: userExamdata } = useGetExamsQuery();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStatus, setQuestionStatus] = useState([]);

  useEffect(() => {
    if (userExamdata && userExamdata.length > 0) {
      const exam = userExamdata.find((e) => e._id === examId);
      if (exam) {
        setSelectedExam(exam);
        setexamDurationInSeconds(exam.duration * 60);
      }
    }
  }, [userExamdata, examId]);

  const [questions, setQuestions] = useState([]);
  const {
    data,
    isLoading,
    isError: questionsError,
    error: questionsErrorData,
  } = useGetQuestionsQuery(examId, { skip: !examId });
  const [score, setScore] = useState(0);
  const navigate = useNavigate();

  const [saveCheatingLogMutation] = useSaveCheatingLogMutation();
  const [submitExamMutation] = useSubmitExamMutation();
  const { userInfo } = useSelector((state) => state.auth);
  const [cheatingLog, setCheatingLog] = useState({
    noFaceCount: 0, multipleFaceCount: 0,
    cellPhoneCount: 0, prohibitedObjectCount: 0,
    examId, 
    username: userInfo?.name || '', 
    email: userInfo?.email || '',
  });
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [savedRemainingSeconds, setSavedRemainingSeconds] = useState(0);
  // Ref to always hold the latest timer value for checkpoint saves
  const liveRemainingSecondsRef = useRef(0);

  // ── Network & Hardware State ─────────────────────────────────────────────
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submissionPendingOffline, setSubmissionPendingOffline] = useState(false);
  const { batteryLevel, isCharging, supported: batterySupported } = useBattery();
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Report Issue ─────────────────────────────────────────────────────────
  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  // ── Instructions Dialog ──────────────────────────────────────────────────
  const [instructionsOpen, setInstructionsOpen] = useState(false);

  const handleReportSubmit = () => {
    if (!reportType) return;
    const report = {
      examId,
      examName: selectedExam?.examName || 'Unknown',
      studentName: userInfo?.name,
      studentEmail: userInfo?.email,
      issueType: reportType,
      description: reportDesc,
      reportedAt: new Date().toISOString(),
    };
    // Store reports in localStorage (teacher can view from Support/Exam Log)
    const existing = JSON.parse(localStorage.getItem('examIssueReports') || '[]');
    existing.push(report);
    localStorage.setItem('examIssueReports', JSON.stringify(existing));
    setReportSubmitted(true);
    setTimeout(() => {
      setReportOpen(false);
      setReportSubmitted(false);
      setReportType('');
      setReportDesc('');
    }, 2200);
  };

  useEffect(() => {
    if (data) {
      // Use questions directly from the server — already shuffled and sliced (Source of Truth)
      const finalQuestions = data;
      setQuestions(finalQuestions);

      // ── Checkpoint restore ─────────────────────────────────────────
      const saved = loadCheckpoint(examId, userInfo?._id);
      if (saved) {
        setSelectedAnswers(saved.selectedAnswers);
        setCurrentQuestionIndex(saved.currentQuestionIndex);
        // Restore timer: subtract time that passed since the checkpoint was saved
        if (saved.remainingSeconds > 0) {
          const elapsedSinceLastSave = Math.floor((Date.now() - saved.savedAt) / 1000);
          const adjusted = Math.max(saved.remainingSeconds - elapsedSinceLastSave, 0);
          setSavedRemainingSeconds(adjusted);
        }
        // Restore questionStatus from saved answers
        setQuestionStatus(finalQuestions.map((_, idx) => ({
          answered: !!saved.selectedAnswers[idx],
          markedForReview: false,
        })));
        toast.info('📌 Session restored — you can continue from where you left off.', {
          toastId: 'checkpoint-restore', autoClose: 5000,
        });
      } else {
        const initialAnswers = {};
        finalQuestions.forEach((_, idx) => { initialAnswers[idx] = null; });
        setSelectedAnswers(initialAnswers);
        setQuestionStatus(finalQuestions.map(() => ({ answered: false, markedForReview: false })));
      }
    }
    // eslint-disable-next-line
  }, [data]);

  useEffect(() => {
    if (questionsError) {
      const errMsg = questionsErrorData?.data?.message || questionsErrorData?.error || 'Failed to load questions.';
      
      swal({
        title: "Access Denied",
        text: errMsg,
        icon: "error",
        button: "Okay",
      });

      const timer = setTimeout(() => {
        navigate(-1);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [questionsError, questionsErrorData, navigate]);

  const calculateScore = () => {
    let correctCount = 0;
    questions.forEach((question, index) => {
      const studentAnswer = selectedAnswers[index];
      if (studentAnswer) {
        if (question.type === 'subjective') {
          if (studentAnswer.trim().toLowerCase() === (question.correctAnswerText || '').trim().toLowerCase()) {
            correctCount++;
          } else if (selectedExam?.allowNegativeMarking) {
            correctCount -= (selectedExam.negativeMarks || 1);
          }
        } else {
          const correctOption = question.options.find((opt) => opt.isCorrect);
          if (correctOption && correctOption._id === studentAnswer) {
            correctCount++;
          } else if (selectedExam?.allowNegativeMarking) {
            correctCount -= (selectedExam.negativeMarks || 1);
          }
        }
      }
    });
    setScore(correctCount);
    return correctCount;
  };

  useEffect(() => {
    if (Object.keys(selectedAnswers).length > 0 && questions.length > 0) {
      calculateScore();
      // ── Auto-save checkpoint ─────────────────────────────────────────
      if (userInfo?._id && examId) {
        saveCheckpoint(examId, userInfo._id, selectedAnswers, currentQuestionIndex, liveRemainingSecondsRef.current);
      }
    }
    // eslint-disable-next-line
  }, [selectedAnswers, questions]);

  // Auto-submit if connection comes back
  useEffect(() => {
     if (isOnline && submissionPendingOffline) {
        toast.info('Connection restored. Submitting your exam...');
        setSubmissionPendingOffline(false);
        handleTestSubmission();
     }
     // eslint-disable-next-line
  }, [isOnline, submissionPendingOffline]);

  const handleTestSubmission = async () => {
    if (!isOnline) {
      setSubmissionPendingOffline(true);
      return;
    }

    if (!questions || questions.length === 0) {
      toast.error('No questions found to submit.');
      return;
    }

    try {
      // Compute score fresh every time — never use stale state (critical for auto-submit)
      let freshScore = 0;
      let correctAnswersCount = 0;
      let incorrectAnswersCount = 0;
      let unattemptedCount = 0;

      questions.forEach((question, index) => {
        const studentAnswer = selectedAnswers[index];
        if (studentAnswer) {
          if (question.type === 'subjective') {
            if (studentAnswer.trim().toLowerCase() === (question.correctAnswerText || '').trim().toLowerCase()) {
              freshScore++;
              correctAnswersCount++;
            } else {
              if (selectedExam?.allowNegativeMarking) {
                freshScore -= (selectedExam.negativeMarks || 1);
              }
              incorrectAnswersCount++;
            }
          } else {
            const correctOption = question.options.find((opt) => opt.isCorrect);
            if (correctOption && correctOption._id === studentAnswer) {
              freshScore++;
              correctAnswersCount++;
            } else {
              if (selectedExam?.allowNegativeMarking) {
                freshScore -= (selectedExam.negativeMarks || 1);
              }
              incorrectAnswersCount++;
            }
          }
        } else {
          unattemptedCount++;
        }
      });
      setScore(freshScore);

      const answerReport = questions.map((question, index) => {
        const studentAnswer = selectedAnswers[index];
        let status = 'Unattempted';
        let detail = '';

        if (!studentAnswer) {
          status = 'Unattempted';
        } else if (question.type === 'subjective') {
           status = studentAnswer.trim().toLowerCase() === (question.correctAnswerText || '').trim().toLowerCase() ? 'Correct' : 'Incorrect';
           detail = `Your answer: "${studentAnswer}" | Correct: "${question.correctAnswerText}"`;
        } else {
           const correctOption = question.options.find((opt) => opt.isCorrect);
           status = (correctOption && correctOption._id === studentAnswer) ? 'Correct' : 'Incorrect';
        }

        return {
          status,
          detail,
          type: question.type || 'objective'
        };
      });

      const formattedAnswers = questions.map((question, index) => {
        const studentAnswer = selectedAnswers[index];
        if (question.type === 'subjective') {
          return {
            questionIndex: index,
            questionType: 'subjective',
            answerText: studentAnswer || '',
            isCorrect: (studentAnswer || '').trim().toLowerCase() === (question.correctAnswerText || '').trim().toLowerCase(),
          };
        } else {
          const selectedOption = question.options.find((opt) => opt._id === studentAnswer);
          return {
            questionIndex: index,
            questionType: 'objective',
            selectedOptionId: studentAnswer || null,
            isCorrect: selectedOption ? selectedOption.isCorrect : false,
          };
        }
      });

      const submissionData = {
        examId,
        answers: formattedAnswers,
        score: freshScore,           // use freshScore, NOT stale state
        totalQuestions: questions.length,
        cheatingLog,
        studentName: userInfo?.name,
        studentEmail: userInfo?.email,
      };

      await submitExamMutation(submissionData).unwrap();
      const updatedLog = { ...cheatingLog, username: userInfo?.name, email: userInfo?.email, score: freshScore };
      await saveCheatingLogMutation(updatedLog).unwrap();

      toast.success('Test submitted successfully!');
      clearCheckpoint(examId, userInfo?._id);
      sessionStorage.removeItem(`exam_seed_${examId}_${userInfo?._id}`);
      navigate('/result', {
        state: {
          score: freshScore,
          totalQuestions: questions.length,
          examName: selectedExam.examName,
          examDuration: selectedExam.duration,
          correctAnswersCount,
          incorrectAnswersCount,
          unattemptedCount,
          answerReport,
        },
      });
    } catch (error) {
      console.error('Submission error:', error);
      // Critical check for network fetch failures
      if (!navigator.onLine || error?.status === 'FETCH_ERROR') {
          setSubmissionPendingOffline(true);
          return;
      }
      
      // Even if backend fails, still navigate so student isn't stuck
      toast.error('Submission error — redirecting to results.');
      clearCheckpoint(examId, userInfo?._id);
      sessionStorage.removeItem(`exam_seed_${examId}_${userInfo?._id}`);
      setTimeout(() => navigate('/'), 2000);
    }
  };

  // ── Third Eye (declared first so showQrDialog exists before lockdown hook) ─
  const examRequiresThirdEye = !!selectedExam?.requiresThirdEye;
  const { desktopPeerId, remoteStream, mobileConnected } = useThirdEye();
  const [thirdEyeSkipped, setThirdEyeSkipped] = useState(false);
  const { data: serverIp } = useGetConfigIpQuery(undefined, { skip: !examRequiresThirdEye });

  // QR modal shows only for exams that require Third Eye
  const showQrDialog = examRequiresThirdEye && !mobileConnected && !thirdEyeSkipped;

  // Build QR URL — replace 'localhost' with the real local IP so phones can reach the dev server
  const rawOrigin = window.location.origin;

  // Explicitly construct origin to swap localhost for the actual IP
  let originWithIp = serverIp && rawOrigin.includes('localhost')
    ? rawOrigin.replace('localhost', serverIp)
    : rawOrigin;

  // Let the browser decide the protocol. Forcing https:// on a 192.x.x.x IP 
  // without a valid SSL cert will cause mobile browsers to reject the connection entirely.
  if (process.env.REACT_APP_FORCE_HTTPS === 'true') {
    originWithIp = originWithIp.replace('http://', 'https://');
  }

  const mobileUrl = desktopPeerId
    ? `${originWithIp}/mobile-cam/${desktopPeerId}`
    : '';
  // Warn user if URL contains localhost (phone can't reach it)
  const isLocalhostUrl = originWithIp.includes('localhost') || originWithIp.includes('127.0.0.1');

  // ── Fullscreen Lockdown ───────────────────────────────────────────────────
  // Pause violations while QR dialog is open so focus-steal doesn't = cheating
  const { violations, maxViolations, warningVisible, isUrgentWarning, dismissWarning } = useExamLockdown(
    handleTestSubmission,
    showQrDialog, // isPaused
  );

  // Progress
  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const totalQ = questions.length;
  const progressPct = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
  
  const isBatteryLow = batterySupported && batteryLevel !== null && batteryLevel <= 15 && !isCharging;

  return (
    <PageContainer title="Test" description="Exam in progress">
      <Box sx={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none' }}>
      {/* ── Sticky Progress Bar ───────────────────────────────────── */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 99, mb: 2,
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(10px)',
          borderRadius: '14px', p: 1.5,
          boxShadow: '0 2px 16px rgba(108,99,255,0.12)',
          border: '1px solid rgba(108,99,255,0.10)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box flex={1}>
            <Stack direction="row" justifyContent="space-between" mb={0.5}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Questions Answered
                </Typography>
                <Chip 
                  label={isOnline ? 'Online' : 'Offline'} 
                  size="small" 
                  sx={{ 
                    height: 20, fontSize: '0.65rem', fontWeight: 800,
                    bgcolor: isOnline ? 'rgba(0,212,170,0.1)' : 'rgba(255,80,80,0.1)',
                    color: isOnline ? '#00D4AA' : '#FF5050'
                  }} 
                />
              </Stack>
              <Typography variant="caption" fontWeight={700} color="#6C63FF">
                {answeredCount} / {totalQ}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={progressPct}
              sx={{
                height: 8, borderRadius: 4,
                bgcolor: 'rgba(108,99,255,0.10)',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(90deg,#6C63FF,#00D4AA)',
                  borderRadius: 4,
                },
              }}
            />
          </Box>
          <Chip
            label={`${progressPct}%`}
            size="small"
            sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: 'rgba(108,99,255,0.10)', color: '#6C63FF', minWidth: 52 }}
          />
        </Stack>
      </Box>

      {/* ── Main Test Layout ──────────────────────────────────────── */}
      <Box pt="1rem">
        <Grid container spacing={3}>
          {/* Question area */}
          <Grid item xs={12} md={8}>
            <BlankCard>
              <Box
                width="100%" minHeight="400px" boxShadow={3}
                display="flex" flexDirection="column"
                justifyContent="center"
                sx={{
                  alignItems: { xs: 'center', md: 'stretch' },
                  px: { xs: 2, md: 4 },
                  py: { xs: 3, md: 4 }
                }}
              >
                {isLoading ? (
                  <Box display="flex" justifyContent="center"><CircularProgress /></Box>
                ) : questionsError ? (
                  <Box display="flex" justifyContent="center">
                    {questionsErrorData?.data?.message || questionsErrorData?.error || 'Failed to load questions.'}
                  </Box>
                ) : data && data.length > 0 ? (
                  <MultipleChoiceQuestion
                    questions={questions}
                    currentQuestionIndex={currentQuestionIndex}
                    setCurrentQuestionIndex={setCurrentQuestionIndex}
                    selectedAnswers={selectedAnswers}
                    setSelectedAnswers={setSelectedAnswers}
                    questionStatus={questionStatus}
                    setQuestionStatus={setQuestionStatus}
                    submitTest={handleTestSubmission}
                  />
                ) : (
                  <Box display="flex" justifyContent="center">No questions available for this exam.</Box>
                )}
              </Box>
            </BlankCard>
          </Grid>

          {/* Sidebar: question nav + webcam */}
          <Grid item xs={12} md={4}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <BlankCard>
                  <Box
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start', height: '100%' }}
                  >
                    <NumberOfQuestions
                      questionLength={questions.length}
                      submitTest={handleTestSubmission}
                      examDurationInSeconds={examDurationInSeconds}
                      initialSeconds={savedRemainingSeconds}
                      onTimerTick={(secs) => { liveRemainingSecondsRef.current = secs; }}
                      currentQuestionIndex={currentQuestionIndex}
                      setCurrentQuestionIndex={setCurrentQuestionIndex}
                      questionStatus={questionStatus}
                      score={score}
                    />
                    <Divider sx={{ width: '100%', my: 1.5, opacity: 0.5 }} />
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => setInstructionsOpen(true)}
                      sx={{
                        color: '#6C63FF',
                        borderColor: 'rgba(108,99,255,0.4)',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        mx: 1.5, mb: 1,
                        '&:hover': { bgcolor: 'rgba(108,99,255,0.08)', borderColor: '#6C63FF' },
                      }}
                    >
                      ℹ️ View Instructions
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      startIcon={<ReportProblemRoundedIcon />}
                      onClick={() => setReportOpen(true)}
                      sx={{
                        color: '#FF6B6B',
                        borderColor: 'rgba(255,107,107,0.4)',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        textTransform: 'none',
                        mx: 1.5, mb: 1,
                        '&:hover': { bgcolor: 'rgba(255,107,107,0.08)', borderColor: '#FF6B6B' },
                      }}
                    >
                      🚨 Report an Issue
                    </Button>
                  </Box>
                </BlankCard>
              </Grid>

              {/* Glowing webcam panel — Face */}
              <Grid item xs={12} sm={examRequiresThirdEye ? 6 : 12}>
                <Box
                  sx={{
                    width: '100%',
                    aspectRatio: '16/9',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '2px solid rgba(108,99,255,0.4)',
                    boxShadow: '0 0 20px rgba(108,99,255,0.25)',
                    animation: 'pulseGlow 3s ease-in-out infinite',
                    position: 'relative',
                    background: '#0a0a14',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <WebCam cheatingLog={cheatingLog} updateCheatingLog={setCheatingLog} />
                  <Box
                    sx={{
                      position: 'absolute', bottom: 12, left: 12,
                      bgcolor: 'rgba(0,0,0,0.7)', borderRadius: '20px',
                      px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.8,
                      backdropFilter: 'blur(4px)'
                    }}
                  >
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#00D4AA', animation: 'pulseGlow 1.5s ease-in-out infinite' }} />
                    <Typography variant="caption" color="#fff" fontWeight={600} fontSize="0.75rem">
                      Face Proctoring
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Third Eye — only show when exam requires it */}
              {examRequiresThirdEye && (
                <Grid item xs={12} sm={6}>
                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: '16/9',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      border: `2px solid ${mobileConnected ? 'rgba(0,212,170,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      boxShadow: mobileConnected ? '0 0 24px rgba(0,212,170,0.25)' : 'none',
                      background: '#0a0a14',
                      transition: 'border-color 0.4s,box-shadow 0.4s',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {mobileConnected ? (
                      <>
                        <video
                          id="third-eye-preview"
                          autoPlay playsInline muted
                          ref={(el) => { if (el && remoteStream) el.srcObject = remoteStream; }}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
                        />
                        <Box
                          sx={{
                            position: 'absolute', bottom: 12, left: 12,
                            bgcolor: 'rgba(0,0,0,0.7)', borderRadius: '20px',
                            px: 1.5, py: 0.5, display: 'flex', alignItems: 'center', gap: 0.8,
                            backdropFilter: 'blur(4px)'
                          }}
                        >
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#ff4444', animation: 'pulseGlow 1s ease-in-out infinite' }} />
                          <Typography variant="caption" color="#fff" fontWeight={600} fontSize="0.75rem">ROOM REC</Typography>
                        </Box>
                      </>
                    ) : (
                      <Stack alignItems="center" spacing={1.5} py={2} width="100%">
                        <QrCode2RoundedIcon sx={{ fontSize: 36, color: thirdEyeSkipped ? 'rgba(255,255,255,0.2)' : '#6C63FF', opacity: 0.8 }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textAlign="center" px={1} sx={{ lineHeight: 1.1 }}>
                          {thirdEyeSkipped ? 'Third Eye Skipped' : 'Scan to activate'}
                        </Typography>
                        {thirdEyeSkipped && (
                          <Button
                            size="small" variant="contained"
                            onClick={() => setThirdEyeSkipped(false)}
                            sx={{
                              fontSize: '0.65rem', borderRadius: '6px', mt: 0.5, py: 0.2, px: 1,
                              background: 'rgba(108,99,255,0.15)', color: '#a89fff',
                              border: '1px solid rgba(108,99,255,0.3)', boxShadow: 'none',
                              '&:hover': { background: 'rgba(108,99,255,0.25)' }
                            }}
                          >
                            Show QR
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* ── Third Eye: hidden AI room proctoring ─────────────────────── */}
      {remoteStream && (
        <RoomProctor remoteStream={remoteStream} updateCheatingLog={setCheatingLog} />
      )}

      {/* ── Third Eye: QR Setup Dialog ───────────────────────────────── */}
      <Dialog
        open={showQrDialog}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '24px',
            background: 'linear-gradient(135deg,#0f0f23 0%,#1a1040 100%)',
            border: '1.5px solid rgba(108,99,255,0.35)',
            boxShadow: '0 0 60px rgba(108,99,255,0.25)',
            p: 1,
            minWidth: 380,
            maxWidth: 420,
          },
        }}
      >
        <DialogContent>
          <Stack alignItems="center" spacing={2.5} py={1}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 48, height: 48, borderRadius: '14px',
                  background: 'linear-gradient(135deg,#6C63FF,#00D4AA)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <PhonelinkRoundedIcon sx={{ color: '#fff', fontSize: 26 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#fff" lineHeight={1.2}>
                  Third Eye Setup
                </Typography>
                <Typography variant="caption" color="rgba(255,255,255,0.5)">
                  Mobile Room Monitoring
                </Typography>
              </Box>
            </Stack>

            <Alert
              severity={isLocalhostUrl ? 'warning' : 'info'}
              sx={{
                bgcolor: isLocalhostUrl ? 'rgba(255,180,0,0.08)' : 'rgba(108,99,255,0.08)',
                border: `1px solid ${isLocalhostUrl ? 'rgba(255,180,0,0.3)' : 'rgba(108,99,255,0.25)'}`,
                color: isLocalhostUrl ? '#ffe082' : '#c8c4ff', borderRadius: '12px', width: '100%',
                '& .MuiAlert-icon': { color: isLocalhostUrl ? '#FFB300' : '#6C63FF' },
              }}
            >
              {isLocalhostUrl ? (
                <>
                  <strong>Your phone cannot reach "localhost".</strong><br />
                  Find your PC's local IP (e.g. <code>192.168.x.x</code>) and open
                  the URL below manually on your phone, OR start the app with{' '}
                  <code>HOST=0.0.0.0 npm start</code> and use your local IP in the URL.
                </>
              ) : (
                'Scan this QR code with your phone. Point your phone\'s rear camera at the room during the exam to enable 360° proctoring.'
              )}
            </Alert>

            {/* QR Code (or loading spinner while PeerJS assigns the peer ID) */}
            {!desktopPeerId ? (
              <Stack alignItems="center" spacing={1.5} py={3}>
                <CircularProgress size={40} sx={{ color: '#6C63FF' }} />
                <Typography variant="caption" color="rgba(255,255,255,0.5)">
                  Preparing session…
                </Typography>
              </Stack>
            ) : (
              <Box
                sx={{
                  p: 2.5, borderRadius: '18px',
                  background: '#fff',
                  boxShadow: '0 0 30px rgba(108,99,255,0.3)',
                }}
              >
                <QRCodeSVG
                  value={mobileUrl}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#1a1040"
                  level="M"
                  includeMargin={false}
                />
              </Box>
            )}

            <Typography
              variant="caption"
              color="rgba(255,255,255,0.4)"
              textAlign="center"
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', px: 1 }}
            >
              {mobileUrl}
            </Typography>

            <Divider sx={{ width: '100%', borderColor: 'rgba(255,255,255,0.08)' }} />

            <Stack spacing={1.5} width="100%">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6C63FF', flexShrink: 0 }} />
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  Open phone camera and scan the QR code above
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6C63FF', flexShrink: 0 }} />
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  Allow camera access when prompted on your phone
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#6C63FF', flexShrink: 0 }} />
                <Typography variant="caption" color="rgba(255,255,255,0.6)">
                  This dialog will close automatically when connected
                </Typography>
              </Stack>
            </Stack>

            <Button
              variant="text"
              size="small"
              onClick={() => setThirdEyeSkipped(true)}
              sx={{
                color: 'rgba(255,255,255,0.35)',
                '&:hover': { color: 'rgba(255,255,255,0.6)' },
                fontSize: '0.78rem',
                textTransform: 'none',
              }}
            >
              Skip — proceed without mobile camera
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ── Anti-Cheat Warning Overlay ──────────────────────────────── */}
      <Dialog
        open={warningVisible && violations < maxViolations}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: isUrgentWarning 
              ? 'linear-gradient(135deg,#420c0c 0%,#2c0a0a 100%)' 
              : 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
            border: isUrgentWarning ? '2px solid #FF5050' : '1.5px solid rgba(108,99,255,0.3)',
            boxShadow: isUrgentWarning ? '0 0 60px rgba(255,80,80,0.4)' : '0 0 50px rgba(108,99,255,0.2)',
            minWidth: 380, maxWidth: 440,
          },
        }}
      >
        <DialogTitle sx={{ color: isUrgentWarning ? '#FF5050' : '#fff', fontWeight: 800, pb: 0, pt: 2.5, px: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <WarningAmberRoundedIcon sx={{ color: isUrgentWarning ? '#FF5050' : '#6C63FF', fontSize: 32 }} />
            <Typography variant="h5" fontWeight={800}>{isUrgentWarning ? '🚨 FINAL WARNING' : 'Lockdown Violation'}</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          <Stack alignItems="center" spacing={2.5}>
            <Alert
              severity="error"
              sx={{
                bgcolor: isUrgentWarning ? 'rgba(255,80,80,0.2)' : 'rgba(255,80,80,0.12)',
                border: `1px solid ${isUrgentWarning ? '#FF5050' : 'rgba(255,80,80,0.3)'}`,
                color: isUrgentWarning ? '#fff' : '#ffaaaa',
                borderRadius: '12px',
                width: '100%',
                fontWeight: isUrgentWarning ? 700 : 400,
                '& .MuiAlert-icon': { color: '#FF5050' },
              }}
            >
              {isUrgentWarning 
                ? "ONE MORE VIOLATION AND YOUR EXAM WILL BE AUTOMATICALLY SUBMITTED!" 
                : "You left the exam window or exited fullscreen mode. This will be reported."}
            </Alert>

            <Stack direction="row" spacing={1.5} alignItems="center">
              {[...Array(maxViolations)].map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 14, height: 14, borderRadius: '50%',
                    bgcolor: i < violations ? '#FF5050' : 'rgba(255,255,255,0.15)',
                    boxShadow: i < violations ? '0 0 8px #FF5050' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
              <Typography variant="body2" color="rgba(255,255,255,0.6)" ml={1}>
                Violation {violations} of {maxViolations}
              </Typography>
            </Stack>

            <Typography variant="caption" color="rgba(255,255,255,0.5)" textAlign="center">
              {maxViolations - violations} warning{maxViolations - violations !== 1 ? 's' : ''} remaining before automatic submission.
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={dismissWarning}
              fullWidth
              sx={{
                mt: 1,
                background: 'linear-gradient(135deg,#6C63FF,#00D4AA)',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '1rem',
                py: 1.5,
                textTransform: 'none',
                boxShadow: '0 4px 20px rgba(108,99,255,0.4)',
                '&:hover': { background: 'linear-gradient(135deg,#5a52e0,#00b894)', boxShadow: '0 6px 24px rgba(108,99,255,0.6)' },
              }}
            >
              Return to Exam
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ── Auto-Submit Overlay (3rd violation) ─────────────────────── */}
      <Dialog
        open={violations >= maxViolations}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
            border: '2px solid rgba(255,80,80,0.7)',
            boxShadow: '0 0 60px rgba(255,80,80,0.5)',
            p: 1,
            minWidth: 380,
          },
        }}
      >
        <DialogContent>
          <Stack alignItems="center" spacing={2} py={1}>
            <WarningAmberRoundedIcon sx={{ color: '#FF5050', fontSize: 64 }} />
            <Typography variant="h5" fontWeight={800} color="#FF5050" textAlign="center">
              Exam Auto-Submitted
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.6)" textAlign="center">
              Maximum violations reached. Your exam has been submitted automatically.
            </Typography>
            <CircularProgress size={28} sx={{ color: '#6C63FF', mt: 1 }} />
          </Stack>
        </DialogContent>
      </Dialog>
      
      {/* ── Exam Instructions Dialog ─────────────────────────────────────── */}
      <Dialog
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
            border: '1.5px solid rgba(108,99,255,0.3)',
            boxShadow: '0 0 50px rgba(108,99,255,0.2)',
            minWidth: 380, maxWidth: 500,
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 800, pb: 1, pt: 2.5, px: 3 }}>
          Exam Instructions
        </DialogTitle>
        <DialogContent sx={{ px: 3, pb: 3 }}>
          {selectedExam?.description ? (
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.85)' }}>
              {selectedExam.description}
            </Typography>
          ) : (
            <Typography variant="body2" color="rgba(255,255,255,0.5)">
              No special instructions for this exam.
            </Typography>
          )}
          {selectedExam?.allowNegativeMarking && (
            <Alert severity="warning" sx={{ mt: 2, borderRadius: '10px' }}>
              <strong>Note:</strong> This exam has negative marking. 1 mark will be deducted for each incorrect answer.
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInstructionsOpen(false)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Report Issue Dialog ─────────────────────────────────────── */}
      <Dialog
        open={reportOpen}
        onClose={() => !reportSubmitted && setReportOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)',
            border: '1.5px solid rgba(255,107,107,0.3)',
            boxShadow: '0 0 50px rgba(255,107,107,0.2)',
            minWidth: 380, maxWidth: 440,
          },
        }}
      >
        <DialogTitle sx={{ color: '#fff', fontWeight: 800, pb: 0, pt: 2.5, px: 3 }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '13px',
              background: 'linear-gradient(135deg,#FF6B6B,#EE5253)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ReportProblemRoundedIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#fff">Report an Issue</Typography>
              <Typography variant="caption" color="rgba(255,255,255,0.5)">Your exam is still running</Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ px: 3, pt: 2, pb: 1 }}>
          {reportSubmitted ? (
            <Box textAlign="center" py={3}>
              <Typography fontSize="2.5rem">✅</Typography>
              <Typography variant="h6" color="#00D4AA" fontWeight={700} mt={1}>Report Submitted!</Typography>
              <Typography variant="body2" color="rgba(255,255,255,0.6)" mt={0.5}>
                Your teacher has been notified. Continue your exam.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2} mt={1}>
              <Alert severity="info" sx={{
                bgcolor: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
                color: '#c8c4ff', borderRadius: '10px',
                '& .MuiAlert-icon': { color: '#6C63FF' },
              }}>
                Your exam session is paused. Fill in the details below.
              </Alert>

              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Issue Type *</InputLabel>
                <Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  label="Issue Type *"
                  sx={{
                    color: '#fff', borderRadius: '12px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,107,107,0.5)' },
                    '& .MuiSvgIcon-root': { color: '#fff' },
                    '& .MuiSelect-select': { color: '#fff' },
                  }}
                >
                  <MenuItem value="Camera not working">📷 Camera not working</MenuItem>
                  <MenuItem value="Questions not loading">❓ Questions not loading</MenuItem>
                  <MenuItem value="Timer seems wrong">⏱️ Timer seems wrong</MenuItem>
                  <MenuItem value="Page crashed or froze">💥 Page crashed or froze</MenuItem>
                  <MenuItem value="Cannot submit exam">🚫 Cannot submit exam</MenuItem>
                  <MenuItem value="Internet disconnected">📡 Internet disconnected</MenuItem>
                  <MenuItem value="Other">🔧 Other</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                multiline
                rows={3}
                placeholder="Describe the issue in a few words (optional)..."
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#fff', borderRadius: '12px',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,107,107,0.4)' },
                    '&.Mui-focused fieldset': { borderColor: '#FF6B6B' },
                  },
                  '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.35)' },
                }}
              />
            </Stack>
          )}
        </DialogContent>

        {!reportSubmitted && (
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
            <Button
              onClick={() => setReportOpen(false)}
              sx={{ color: 'rgba(255,255,255,0.4)', textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReportSubmit}
              disabled={!reportType}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg,#FF6B6B,#EE5253)',
                borderRadius: '10px', fontWeight: 700, textTransform: 'none',
                '&:hover': { background: 'linear-gradient(135deg,#e05555,#cc3e3e)' },
                '&.Mui-disabled': { opacity: 0.5 },
              }}
            >
              Submit Report
            </Button>
          </DialogActions>
        )}
      </Dialog>

      {/* ── Offline Synchronization Overlay ───────────────────────── */}
      <Dialog
        open={submissionPendingOffline}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg,#0d0d1a 0%,#18182f 100%)',
            border: '2px solid rgba(255,180,0,0.4)',
            boxShadow: '0 0 60px rgba(255,180,0,0.2)',
            p: 2,
            minWidth: 400,
          },
        }}
      >
        <DialogContent>
          <Stack alignItems="center" spacing={3}>
            <CircularProgress sx={{ color: '#FFB300' }} size={60} thickness={4.5} />
            <Typography variant="h5" fontWeight={800} color="#fff" textAlign="center">
              Network Disconnected
            </Typography>
            <Alert
              severity="warning"
              sx={{ bgcolor: 'rgba(255,180,0,0.1)', color: '#ffe082', border: '1px solid rgba(255,180,0,0.3)' }}
            >
              Your timer has finished or you clicked submit, but you are completely offline! Your answers are <strong>securely saved</strong> locally. Do NOT close this tab until your connection is restored.
            </Alert>
            <Typography variant="caption" color="rgba(255,255,255,0.4)">
              Waiting for internet to synchronize submission...
            </Typography>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ── Battery Warning Overlay ───────────────────────────────── */}
      <Dialog
        open={isBatteryLow}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: 'linear-gradient(135deg,#200b0f 0%,#2c1016 100%)',
            border: '2px solid rgba(255,60,60,0.5)',
            boxShadow: '0 0 60px rgba(255,60,60,0.3)',
            p: 2,
            minWidth: 380,
          },
        }}
      >
        <DialogContent>
          <Stack alignItems="center" spacing={2}>
            <WarningAmberRoundedIcon sx={{ fontSize: 56, color: '#ff4d4f', animation: 'pulseGlow 2s infinite' }} />
            <Typography variant="h5" fontWeight={800} color="#fff" textAlign="center">
              Battery Critically Low!
            </Typography>
            <Alert
              severity="error"
              sx={{ bgcolor: 'rgba(255,60,60,0.1)', color: '#ffcccc', border: '1px solid rgba(255,60,60,0.3)' }}
            >
              Your battery is dropping below 15%! Please connect your charger immediately. If your computer shuts down unexpectedly, your progress might not sync.
            </Alert>
          </Stack>
        </DialogContent>
      </Dialog>

      </Box>
    </PageContainer>
  );
};

export default TestPage;
