import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Box, Card, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Chip, Button, Stack, CircularProgress
} from '@mui/material';
import { IconArrowLeft, IconEye, IconDownload } from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import { useGetExamSubmissionsQuery } from 'src/slices/examApiSlice';

const ExamSubmissions = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { data: submissions = [], isLoading } = useGetExamSubmissionsQuery(examId);

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    const handleDownloadCSV = () => {
        if (!submissions || submissions.length === 0) return;

        const headers = ["Student Name", "Email", "Score", "Total Questions", "Percentage", "Trust Score", "Submitted At"];
        
        const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

        const rows = submissions.map(sub => [
            escapeCSV(sub.studentName),
            escapeCSV(sub.studentEmail),
            sub.score,
            sub.totalQuestions,
            `${sub.percentage}%`,
            `${sub.trustScore ?? 100}%`,
            escapeCSV(new Date(sub.submittedAt).toLocaleString())
        ]);

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `exam_submissions_${examId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <PageContainer title="Exam Submissions" description="List of student results">
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} mb={3} spacing={2}>
                <Box>
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
                <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<IconDownload size={18} />}
                    onClick={handleDownloadCSV}
                    disabled={submissions.length === 0}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                    Download CSV
                </Button>
            </Stack>

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
                                <TableCell><Typography fontWeight={700}>Trust Score</Typography></TableCell>
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
                                            color={sub.percentage >= 40 ? "success" : "error"}
                                            size="small"
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={`${sub.trustScore ?? 100}%`}
                                            color={(sub.trustScore ?? 100) >= 80 ? 'success' : (sub.trustScore ?? 100) >= 50 ? 'warning' : 'error'}
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
                                            onClick={() => navigate(`/submission-detail/${sub._id}`)}
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
