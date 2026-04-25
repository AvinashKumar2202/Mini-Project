import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box, Typography, CircularProgress, Stack,
    Button, Chip, Card, CardContent, Divider, Grid
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetSubmissionByIdQuery } from 'src/slices/examApiSlice';
import { IconArrowLeft, IconCheck, IconX } from '@tabler/icons-react';

const StudentSubmissionDetail = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();

    const { data: detail, isLoading, isError, error } = useGetSubmissionByIdQuery(submissionId, {
        skip: !submissionId
    });

    if (isLoading) return <Box display="flex" justifyContent="center" py={8}><CircularProgress /></Box>;

    if (isError || !detail) {
        return (
            <PageContainer title="Submission Details" description="View submission details">
                <Typography color="error" textAlign="center">
                    {error?.data?.message || "Failed to load submission details. Note: results may be hidden."}
                </Typography>
            </PageContainer>
        );
    }

    const { examId: exam, answers = [], score, percentage, submittedAt, totalQuestions } = detail;
    const questions = exam?.questions || [];

    // Helper: Find what user answered for a specific question index
    const getStudentAnswer = (qIndex) => answers.find(a => a.questionIndex === qIndex);

    const isPassed = Math.ceil((totalQuestions * 40) / 100) <= score;

    return (
        <PageContainer title="Exam Review" description="Review your exam submission">
            <Box mb={3}>
                <Button startIcon={<IconArrowLeft />} onClick={() => navigate(-1)} variant="text">
                    Back to My Results
                </Button>
            </Box>

            <DashboardCard title="Exam Review Report">
                <Box bgcolor="rgba(108,99,255,0.05)" p={3} borderRadius={3} mb={4}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Typography variant="h4" fontWeight={800}>{exam?.examName || 'Exam'}</Typography>
                            <Typography variant="body2" color="text.secondary" mt={1}>
                                Submitted on: {new Date(submittedAt).toLocaleString()}
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6} display="flex" justifyContent="flex-end" alignItems="center">
                            <Stack alignItems="flex-end" spacing={1}>
                                <Typography variant="h5" fontWeight={700}>
                                    Score: <Box component="span" color="#6C63FF">{Number.isInteger(score) ? score : Number(score).toFixed(2)} / {totalQuestions}</Box>
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip label={`${percentage}%`} color={isPassed ? 'success' : 'error'} size="small" sx={{ fontWeight: 700 }} />
                                    <Chip label={isPassed ? "PASSED" : "FAILED"} color={isPassed ? 'success' : 'error'} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                                </Stack>
                            </Stack>
                        </Grid>
                    </Grid>
                </Box>

                <Typography variant="h5" fontWeight={700} mb={3}>Question Breakdown</Typography>
                
                <Stack spacing={4}>
                    {questions
                        .map((q, originalIdx) => ({ q, originalIdx })) // Preserve original index
                        .filter(({ q, originalIdx }) => {
                            const sAns = getStudentAnswer(originalIdx);
                            return q.type === 'subjective' ? !!sAns?.answerText : !!sAns?.selectedOptionId;
                        })
                        .map(({ q, originalIdx }, displayIdx) => {
                            const sAns = getStudentAnswer(originalIdx);
                            
                            // Determinate logic
                            let isCorrectSelection = false;
                            if (q.type === 'subjective') {
                                const provided = sAns?.answerText?.trim().toLowerCase() || '';
                                const actual = q.correctAnswerText?.trim().toLowerCase() || '';
                                isCorrectSelection = provided && actual && provided === actual;
                            } else {
                                const correctOpt = q.options?.find(o => o.isCorrect);
                                if (sAns && sAns.selectedOptionId === correctOpt?._id?.toString()) {
                                    isCorrectSelection = true;
                                }
                            }

                            return (
                                <Card key={q._id || originalIdx} variant="outlined" sx={{
                                    borderColor: isCorrectSelection ? 'rgba(0,212,170,0.5)' : 'rgba(255,107,107,0.5)',
                                    bgcolor: isCorrectSelection ? 'rgba(0,212,170,0.02)' : 'rgba(255,107,107,0.02)'
                                }}>
                                    <CardContent>
                                        <Stack direction="row" justifyContent="space-between" mb={2}>
                                            <Typography variant="subtitle1" fontWeight={700}>
                                                Question {originalIdx + 1}
                                            </Typography>
                                            <Chip 
                                                icon={isCorrectSelection ? <IconCheck size={16} /> : <IconX size={16} />}
                                                label={isCorrectSelection ? "Correct" : "Incorrect"}
                                                size="small"
                                                color={isCorrectSelection ? "success" : "error"}
                                                variant="filled"
                                            />
                                        </Stack>

                                        <Typography variant="body1" mb={3} fontSize="1.05rem">{q.question}</Typography>

                                        <Divider sx={{ mb: 2 }} />

                                        {!q.type || q.type === 'objective' ? (
                                            <Stack spacing={1.5}>
                                                {q.options && q.options.map((opt) => {
                                                    const isStudentChoice = sAns?.selectedOptionId === opt._id?.toString();
                                                    const isActualCorrect = opt.isCorrect;

                                                    let bgColor = '#f9f9f9';
                                                    let borderColor = '#e0e0e0';

                                                    if (isActualCorrect) {
                                                        bgColor = 'rgba(0,212,170,0.1)';
                                                        borderColor = '#00D4AA';
                                                    } else if (isStudentChoice && !isActualCorrect) {
                                                        bgColor = 'rgba(255,107,107,0.1)';
                                                        borderColor = '#FF6B6B';
                                                    }

                                                    return (
                                                        <Box key={opt._id || opt.optionText} sx={{
                                                            p: 1.5,
                                                            borderRadius: 2,
                                                            border: '1px solid',
                                                            borderColor: borderColor,
                                                            bgcolor: bgColor,
                                                            display: 'flex',
                                                            justifyContent: 'space-between'
                                                        }}>
                                                            <Typography>{opt.optionText}</Typography>
                                                            <Box display="flex" gap={1}>
                                                                {isStudentChoice && <Chip label="Your Answer" size="small" variant="outlined" />}
                                                                {isActualCorrect && <Chip label="Correct Answer" size="small" color="success" />}
                                                            </Box>
                                                        </Box>
                                                    )
                                                })}
                                            </Stack>
                                        ) : (
                                            <Box>
                                                <Typography variant="body2" color="text.secondary" mb={1}>Your Answer:</Typography>
                                                <Box p={2} mb={2} borderRadius={2} border="1px solid #eee" bgcolor="#f5f5f5">
                                                    <Typography>{sAns?.answerText || <Box component="span" fontStyle="italic" color="#999">Left blank</Box>}</Typography>
                                                </Box>

                                                <Typography variant="body2" color="text.secondary" mb={1}>Expected Answer:</Typography>
                                                <Box p={2} borderRadius={2} border="1px solid rgba(0,212,170,0.3)" bgcolor="rgba(0,212,170,0.05)">
                                                    <Typography>{q.correctAnswerText || 'N/A'}</Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            )
                        })}
                </Stack>
            </DashboardCard>
        </PageContainer>
    );
};

export default StudentSubmissionDetail;
