import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import { Box, Button, Stack, Typography } from '@mui/material';

const NumberOfQuestions = ({
  questionLength,
  submitTest,
  examDurationInSeconds,
  initialSeconds,        // restored remaining time from checkpoint (0 = fresh start)
  onTimerTick,           // (remainingSeconds) => void — updates parent ref every second
  currentQuestionIndex,
  setCurrentQuestionIndex,
  questionStatus,
  score,
}) => {
  const totalQuestions = questionLength;

  const questionNumbers = Array.from(
    { length: totalQuestions },
    (_, index) => index + 1
  );

  const rows = [];
  for (let i = 0; i < questionNumbers.length; i += 5) {
    rows.push(questionNumbers.slice(i, i + 5));
  }

  // ── Timer ─────────────────────────────────────────────────────────────────
  const [timer, setTimer] = useState(0);

  // Seed the timer — prefer checkpoint remaining time; fall back to full duration
  useEffect(() => {
    if (initialSeconds > 0) {
      setTimer(initialSeconds);          // restored from checkpoint
    } else if (examDurationInSeconds > 0) {
      setTimer(examDurationInSeconds);   // fresh exam start
    }
  }, [examDurationInSeconds, initialSeconds]);

  // Tick every second
  useEffect(() => {
    if (!examDurationInSeconds) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (onTimerTick) onTimerTick(next);   // let TestPage always know latest value
        if (next <= 0) {
          clearInterval(interval);
          submitTest();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [examDurationInSeconds, initialSeconds]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  // ✅ PROFESSIONAL COLOR LOGIC
  const getQuestionColor = (index) => {
    if (currentQuestionIndex === index) return '#1976d2'; // 🔵 Current

    if (questionStatus[index]?.markedForReview) return '#fbc02d'; // 🟡 Review

    if (questionStatus[index]?.answered) return '#2e7d32'; // 🟢 Answered

    return '#d32f2f'; // 🔴 Not Answered
  };

  return (
    <>
      {/* Header */}
      <Box
        position="sticky"
        top="0"
        zIndex={1}
        bgcolor="white"
        py={2}
        px={3}
        width="100%"
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">
            Total Questions: {totalQuestions}
          </Typography>

          <Typography
            variant="h6"
            color={timer < 60 ? 'error' : 'textPrimary'}
            fontWeight="bold"
          >
            ⏳ Time Left: {formatTime(timer)}
          </Typography>

          <Button variant="contained" onClick={submitTest} color="error">
            Finish Test
          </Button>
        </Stack>

        <Stack direction="row" alignItems="center" justifyContent="flex-start" mt={1}>
          <Typography variant="body1" fontWeight="bold">
            Score: {score} / {totalQuestions}
          </Typography>
        </Stack>
      </Box>

      {/* Legend */}
      <Box px={3} mt={2}>
        <Stack direction="row" spacing={2} mb={2}>
          <Typography><span style={{ color: '#1976d2' }}>■</span> Current</Typography>
          <Typography><span style={{ color: '#2e7d32' }}>■</span> Answered</Typography>
          <Typography><span style={{ color: '#d32f2f' }}>■</span> Not Answered</Typography>
          <Typography><span style={{ color: '#fbc02d' }}>■</span> Review</Typography>
        </Stack>
      </Box>

      {/* Question Grid */}
      <Box p={3} maxHeight="270px" overflow="auto">
        <Grid container spacing={1}>
          {rows.map((row, rowIndex) => (
            <Grid key={rowIndex} item xs={12}>
              <Stack direction="row">
                {row.map((questionNumber) => (
                  <Avatar
                    key={questionNumber}
                    variant="rounded"
                    sx={{
                      bgcolor: getQuestionColor(questionNumber - 1),
                      cursor: 'pointer',
                      border: currentQuestionIndex === questionNumber - 1 ? '2px solid white' : 'none'
                    }}
                    onClick={() => setCurrentQuestionIndex(questionNumber - 1)} // Enabled navigation
                  >
                    {questionNumber}
                  </Avatar>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Box>
    </>
  );
};

export default NumberOfQuestions;