import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Box, Card, CardContent, Button, Stack,
    Chip, Container, CircularProgress, Divider
} from '@mui/material';
import { IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useGetStudentSubmissionQuery } from 'src/slices/examApiSlice';

const SubmissionDetail = () => {
    const { examId, studentId } = useParams();
    const navigate = useNavigate();
    const { data: submission, isLoading, isError } = useGetStudentSubmissionQuery({ examId, studentId });

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError || !submission) {
        return (
            <PageContainer title="Submission Detail">
                <Typography color="error">Error loading submission details.</Typography>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </PageContainer>
        );
    }

    const { examId: exam, studentId: student, answers, score, totalQuestions, percentage } = submission;

    return (
        <PageContainer title="Submission Detail" description="Detailed student answers">
            <Box mb={3}>
                <Button
                    startIcon={<IconArrowLeft size={18} />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 2 }}
                >
                    Back to Submissions
                </Button>
                <Typography variant="h4" fontWeight={700}>
                    Results for {student.name}
                </Typography>
                <Typography variant="subtitle1" color="textSecondary">
                    Exam: {exam.examName} | Score: {score}/{totalQuestions} ({percentage}%)
                </Typography>
            </Box>

            <Stack spacing={3}>
                {exam.questions.map((q, idx) => {
                    const studentAnswer = answers.find(a => a.questionIndex === idx);
                    const isCorrect = studentAnswer?.isCorrect;

                    return (
                        <Card key={idx} sx={{ borderRadius: '15px', boxShadow: 2 }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="flex-start">
                                    <Typography variant="h6" fontWeight={700} sx={{ mt: 0.3 }}>
                                        {idx + 1}.
                                    </Typography>
                                    <Box flexGrow={1}>
                                        <Typography variant="h6" fontWeight={700} gutterBottom>
                                            {q.question}
                                        </Typography>

                                        <Stack spacing={1} mt={2}>
                                            {q.options.map((opt) => {
                                                const isStudentSelected = studentAnswer?.selectedOptionId === opt._id;
                                                const isCorrectOption = opt.isCorrect;

                                                let bgColor = 'transparent';
                                                let borderColor = 'rgba(0,0,0,0.1)';
                                                if (isStudentSelected) {
                                                    bgColor = isCorrect ? 'rgba(0,212,170,0.1)' : 'rgba(255,107,107,0.1)';
                                                    borderColor = isCorrect ? '#00D4AA' : '#FF6B6B';
                                                } else if (isCorrectOption) {
                                                    bgColor = 'rgba(0,212,170,0.05)';
                                                    borderColor = '#00D4AA';
                                                }

                                                return (
                                                    <Box
                                                        key={opt._id}
                                                        sx={{
                                                            p: 1.5,
                                                            borderRadius: '10px',
                                                            border: '2px solid',
                                                            borderColor: borderColor,
                                                            bgcolor: bgColor,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between'
                                                        }}
                                                    >
                                                        <Typography variant="body1">
                                                            {opt.optionText}
                                                        </Typography>
                                                        {isStudentSelected && (
                                                            <Chip
                                                                icon={isCorrect ? <IconCheck size={16} /> : <IconX size={16} />}
                                                                label={isCorrect ? "Student's Answer (Correct)" : "Student's Answer (Incorrect)"}
                                                                size="small"
                                                                color={isCorrect ? "success" : "error"}
                                                            />
                                                        )}
                                                        {!isStudentSelected && isCorrectOption && (
                                                            <Chip
                                                                icon={<IconCheck size={16} />}
                                                                label="Correct Answer"
                                                                size="small"
                                                                variant="outlined"
                                                                color="success"
                                                            />
                                                        )}
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    );
                })}
            </Stack>
        </PageContainer>
    );
};

export default SubmissionDetail;
