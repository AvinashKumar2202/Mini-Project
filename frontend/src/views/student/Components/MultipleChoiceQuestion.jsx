import React from 'react';
import {
  Card, CardContent, Typography, Box, Stack, Button, IconButton
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import BookmarkBorderRoundedIcon from '@mui/icons-material/BookmarkBorderRounded';
import BookmarkRoundedIcon from '@mui/icons-material/BookmarkRounded';

export default function MultipleChoiceQuestion({
  questions = [],
  currentQuestionIndex = 0,
  setCurrentQuestionIndex,
  selectedAnswers = {},
  setSelectedAnswers,
  questionStatus = [],
  setQuestionStatus,
}) {
  const theme = useTheme();

  if (!questions || questions.length === 0) {
    return <Typography>No questions available.</Typography>;
  }

  const currentQuestion = questions[currentQuestionIndex];
  const selectedOptionId = selectedAnswers[currentQuestionIndex];
  const isMarked = questionStatus[currentQuestionIndex]?.markedForReview;

  const handleOptionChange = (optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionId,
    }));

    // mark as answered
    const updatedStatus = [...questionStatus];
    updatedStatus[currentQuestionIndex] = {
      ...updatedStatus[currentQuestionIndex],
      answered: true,
    };
    setQuestionStatus(updatedStatus);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleMarkForReview = () => {
    const updatedStatus = [...questionStatus];
    updatedStatus[currentQuestionIndex] = {
      ...updatedStatus[currentQuestionIndex],
      markedForReview: !updatedStatus[currentQuestionIndex]?.markedForReview,
    };
    setQuestionStatus(updatedStatus);
  };

  // Custom Keyframe animations for page turns
  const animationKey = `question-animate-${currentQuestionIndex}`;

  return (
    <Card
      sx={{
        width: '100%',
        maxWidth: '100%',
        boxShadow: 'none',
        background: 'transparent'
      }}
    >
      <CardContent sx={{ p: { xs: 1, md: 3 }, pb: { xs: 2, md: 4 } }}>
        {/* Animated Wrapper */}
        <Box
          key={animationKey}
          sx={{
            animation: 'slideFadeIn 0.4s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
            '@keyframes slideFadeIn': {
              '0%': { opacity: 0, transform: 'translateY(15px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' }
            }
          }}
        >
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="overline" color="primary" fontWeight={700} letterSpacing={1.2}>
                QUESTION {currentQuestionIndex + 1} OF {questions.length}
              </Typography>
            </Box>
            <IconButton
              onClick={handleMarkForReview}
              sx={{
                color: isMarked ? '#FFB800' : 'text.secondary',
                bgcolor: isMarked ? alpha('#FFB800', 0.1) : 'transparent',
                '&:hover': { bgcolor: isMarked ? alpha('#FFB800', 0.2) : alpha(theme.palette.text.secondary, 0.1) }
              }}
            >
              {isMarked ? <BookmarkRoundedIcon /> : <BookmarkBorderRoundedIcon />}
            </IconButton>
          </Stack>

          {/* Question Text */}
          <Typography
            variant="h5"
            fontWeight={600}
            color="text.primary"
            sx={{ mb: 4, lineHeight: 1.5, fontSize: { xs: '1.25rem', md: '1.4rem' } }}
          >
            {currentQuestion.question}
          </Typography>

          {/* Options Grid */}
          <Stack spacing={2} mb={5}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option._id;

              return (
                <Box
                  key={option._id}
                  onClick={() => handleOptionChange(option._id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2.5,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                    border: '2px solid',
                    borderColor: isSelected ? '#6C63FF' : alpha(theme.palette.divider, 0.6),
                    bgcolor: isSelected ? alpha('#6C63FF', 0.04) : 'background.paper',
                    boxShadow: isSelected
                      ? '0 8px 24px rgba(108,99,255,0.15)'
                      : '0 2px 8px rgba(0,0,0,0.03)',
                    transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
                    '&:hover': {
                      borderColor: isSelected ? '#6C63FF' : alpha('#6C63FF', 0.4),
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.06)'
                    }
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 2,
                      color: isSelected ? '#6C63FF' : 'text.secondary',
                      transition: 'color 0.2s'
                    }}
                  >
                    {isSelected ? (
                      <CheckCircleRoundedIcon sx={{ fontSize: 28 }} />
                    ) : (
                      <RadioButtonUncheckedRoundedIcon sx={{ fontSize: 28, opacity: 0.6 }} />
                    )}
                  </Box>
                  <Typography
                    variant="body1"
                    fontWeight={isSelected ? 600 : 500}
                    color={isSelected ? 'text.primary' : 'text.secondary'}
                    sx={{ fontSize: '1.05rem' }}
                  >
                    {option.optionText}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* Navigation Controls */}
        <Stack
          direction={{ xs: 'column-reverse', sm: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
          sx={{
            pt: 3,
            borderTop: '1px solid',
            borderColor: alpha(theme.palette.divider, 0.8)
          }}
        >
          <Button
            variant="outlined"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            startIcon={<ArrowBackRoundedIcon />}
            sx={{
              borderRadius: '24px',
              px: { xs: 4, sm: 3 },
              py: 1,
              width: { xs: '100%', sm: 'auto' },
              fontWeight: 600,
              textTransform: 'none',
              borderWidth: '2px',
              '&:hover': { borderWidth: '2px' }
            }}
          >
            Previous
          </Button>

          <Button
            variant="contained"
            onClick={handleNextQuestion}
            disabled={currentQuestionIndex === questions.length - 1}
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              borderRadius: '24px',
              px: { xs: 4, sm: 4 },
              py: 1.2,
              width: { xs: '100%', sm: 'auto' },
              fontWeight: 700,
              textTransform: 'none',
              background: 'linear-gradient(135deg, #6C63FF 0%, #5a52e0 100%)',
              boxShadow: '0 4px 14px rgba(108,99,255,0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a52e0 0%, #4a42d0 100%)',
                boxShadow: '0 6px 20px rgba(108,99,255,0.5)',
              }
            }}
          >
            {currentQuestionIndex === questions.length - 1 ? 'Finish Exam' : 'Next Question'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
