import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Box, Card, CardContent, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Chip, Button, Stack, CircularProgress
} from '@mui/material';
import { IconArrowLeft, IconEye } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useGetExamSubmissionsQuery } from 'src/slices/examApiSlice';

const ExamSubmissions = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { data: submissions = [], isLoading, isError } = useGetExamSubmissionsQuery(examId);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <PageContainer title="Exam Submissions" description="List of student results">
            <Box mb={3}>
                <Button
                    startIcon={<IconArrowLeft size={18} />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ mb: 2 }}
                >
                    Back to Dashboard
                </Button>
                <Typography variant="h4" fontWeight={700}>
                    Exam Submissions
                </Typography>
            </Box>

            {submissions.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: '15px' }}>
                    <Typography color="textSecondary">No submissions found for this exam.</Typography>
                </Card>
            ) : (
                <TableContainer component={Paper} sx={{ borderRadius: '15px', overflow: 'hidden', boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'rgba(108,99,255,0.05)' }}>
                            <TableRow>
                                <TableCell><Typography fontWeight={700}>Student Name</Typography></TableCell>
                                <TableCell><Typography fontWeight={700}>Email</Typography></TableCell>
                                <TableCell><Typography fontWeight={700}>Score</Typography></TableCell>
                                <TableCell><Typography fontWeight={700}>Percentage</Typography></TableCell>
                                <TableCell><Typography fontWeight={700}>Submitted At</Typography></TableCell>
                                <TableCell align="right"><Typography fontWeight={700}>Actions</Typography></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {submissions.map((sub) => (
                                <TableRow key={sub._id} hover>
                                    <TableCell>{sub.studentName}</TableCell>
                                    <TableCell>{sub.studentEmail}</TableCell>
                                    <TableCell>
                                        <Typography fontWeight={600}>
                                            {sub.score} / {sub.totalQuestions}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${sub.percentage}%`}
                                            color={sub.percentage >= 60 ? "success" : "error"}
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {new Date(sub.submittedAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="primary"
                                            onClick={() => navigate(`/submission-detail/${examId}/${sub.studentId._id || sub.studentId}`)}
                                        >
                                            <IconEye size={20} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </PageContainer>
    );
};

export default ExamSubmissions;
