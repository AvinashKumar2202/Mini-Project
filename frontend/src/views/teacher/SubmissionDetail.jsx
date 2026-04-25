import React, { useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Box, Card, CardContent, Button, Stack,
    Chip, CircularProgress
} from '@mui/material';
import { IconArrowLeft, IconCheck, IconX, IconDownload } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useGetSubmissionByIdQuery } from 'src/slices/examApiSlice';
import html2pdf from 'html2pdf.js';

const SubmissionDetail = () => {
    const { submissionId } = useParams();
    const navigate = useNavigate();
    const { data: submission, isLoading, isError } = useGetSubmissionByIdQuery(submissionId);
    const reportRef = useRef();

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

    if (!exam || !exam.questions) {
        return (
            <PageContainer title="Submission Detail">
                <Typography color="error">Exam data is unavailable (exam may have been deleted).</Typography>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </PageContainer>
        );
    }

    const handleDownloadPDF = () => {
        const element = reportRef.current;
        if (!element) return;

        const opt = {
            margin: 10,
            filename: `Result_${student.name}_${exam.examName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().from(element).set(opt).save();
    };

    return (
        <PageContainer title="Submission Detail" description="Detailed student answers">
            <Box mb={3} display="flex" justifyContent="space-between" alignItems="flex-end">
                <Box>
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
                    <Typography variant="subtitle1" color="textSecondary" sx={{ fontWeight: 600 }}>
                        UID: <span style={{ color: '#6C63FF' }}>{student.universityId || student._id}</span>
                    </Typography>
                    <Typography variant="subtitle1" color="textSecondary">
                        Exam: {exam.examName} | Score: {score}/{totalQuestions} ({percentage}%)
                    </Typography>
                    <Box mt={1}>
                        <Chip
                            label={`Trust Score: ${submission.trustScore ?? 100}%`}
                            color={(submission.trustScore ?? 100) >= 80 ? 'success' : (submission.trustScore ?? 100) >= 50 ? 'warning' : 'error'}
                            size="medium"
                            sx={{ fontWeight: 700, fontSize: '1rem', p: 1 }}
                        />
                    </Box>
                </Box>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<IconDownload size={18} />}
                    onClick={handleDownloadPDF}
                    sx={{
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg,#6C63FF,#A78BFA)',
                        boxShadow: '0 4px 15px rgba(108,99,255,0.3)',
                    }}
                >
                    Download PDF
                </Button>
            </Box>

            <Box ref={reportRef} sx={{ bgcolor: '#fff', p: 1 }}>
                <Stack spacing={3}>
                    {exam.questions
                        .map((q, originalIdx) => ({ q, originalIdx }))
                        .filter(({ q, originalIdx }) => {
                            const studentAnswer = answers.find(a => a.questionIndex === originalIdx);
                            return q.type === 'subjective' ? !!studentAnswer?.answerText : !!studentAnswer?.selectedOptionId;
                        })
                        .map(({ q, originalIdx }) => {
                            const studentAnswer = answers.find(a => a.questionIndex === originalIdx);
                            const isCorrect = studentAnswer?.isCorrect;

                            return (
                                <Card key={originalIdx} sx={{ borderRadius: '15px', boxShadow: 2, border: '1px solid #f0f0f0' }}>
                                    <CardContent>
                                        <Stack direction="row" spacing={2} alignItems="flex-start">
                                            <Typography variant="h6" fontWeight={700} sx={{ mt: 0.3 }}>
                                                {originalIdx + 1}.
                                            </Typography>
                                            <Box flexGrow={1}>
                                                <Typography variant="h6" fontWeight={700} gutterBottom>
                                                    {q.question}
                                                </Typography>

                                                {q.type === 'subjective' ? (
                                                    <Box mt={2}>
                                                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                            <Typography variant="body2" color="text.secondary">Student's Answer:</Typography>
                                                            {studentAnswer?.aiGraded && (
                                                                <Chip 
                                                                    label="AI Evaluated" 
                                                                    size="small" 
                                                                    color="secondary" 
                                                                    variant="outlined" 
                                                                    sx={{ fontWeight: 700 }}
                                                                />
                                                            )}
                                                        </Box>
                                                        <Box 
                                                            p={2} 
                                                            mb={2} 
                                                            borderRadius={2} 
                                                            border={`2px solid ${studentAnswer?.isCorrect ? '#00D4AA' : '#FF6B6B'}`} 
                                                            bgcolor={studentAnswer?.isCorrect ? 'rgba(0,212,170,0.05)' : 'rgba(255,107,107,0.05)'}
                                                        >
                                                            <Typography>{studentAnswer?.answerText || <Box component="span" fontStyle="italic" color="#999">Left blank</Box>}</Typography>
                                                            <Box display="flex" justifyContent="flex-end" mt={1}>
                                                                {studentAnswer?.isCorrect ? (
                                                                    <Typography variant="caption" color="success.main" fontWeight={700}>Correct Concept</Typography>
                                                                ) : (
                                                                    <Typography variant="caption" color="error.main" fontWeight={700}>Incorrect Concept</Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                        <Typography variant="body2" color="text.secondary" mb={1}>Expected Answer:</Typography>
                                                        <Box p={2} borderRadius={2} border="1px solid rgba(0,212,170,0.3)" bgcolor="rgba(0,212,170,0.05)">
                                                            <Typography>{q.correctAnswerText || 'N/A'}</Typography>
                                                        </Box>
                                                    </Box>
                                                ) : (
                                                    <Stack spacing={1} mt={2}>
                                                        {q.options && q.options.map((opt) => {
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
                                                )}
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                </Stack>
            </Box>
        </PageContainer>
    );
};

export default SubmissionDetail;
