import React from 'react';
import { Grid, Typography, Card, CardContent, CircularProgress, Box, Chip } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetMySubmissionsQuery } from 'src/slices/examApiSlice';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@mui/material';
import { IconDownload, IconEye } from '@tabler/icons-react';
import Certificate from 'src/components/student/Certificate';
import { useNavigate } from 'react-router-dom';

const MyResults = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const { data: submissions = [], isLoading, isError, error } = useGetMySubmissionsQuery();
    const navigate = useNavigate();

    const [certData, setCertData] = React.useState(null);
    const [isGenerating, setIsGenerating] = React.useState(false);
    const certRef = React.useRef(null);

    const handleDownloadCertificate = async (sub) => {
        setIsGenerating(true);
        const percentageRaw = sub.percentage || 0;
        const percentage = Number.isInteger(percentageRaw) ? percentageRaw : Number(percentageRaw).toFixed(2);
        
        setCertData({
            studentName: userInfo.name,
            examName: sub.examId?.examName || 'Deleted Exam',
            percentage: percentage,
            date: new Date(sub.submittedAt).toLocaleDateString('en-IN')
        });

        // Wait for state to update and DOM to render the hidden component
        setTimeout(async () => {
            if (certRef.current) {
                try {
                    const canvas = await html2canvas(certRef.current, { scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF({
                        orientation: 'landscape',
                        unit: 'px',
                        format: [800, 600]
                    });
                    pdf.addImage(imgData, 'PNG', 0, 0, 800, 600);
                    pdf.save(`${sub.examId?.examName || 'Exam'}_Certificate.pdf`);
                } catch (err) {
                    console.error('Error generating certificate:', err);
                }
            }
            setIsGenerating(false);
            setCertData(null); // Cleanup
        }, 500); // 500ms delay to ensure the DOM is updated
    };

    if (userInfo?.role === 'teacher') {
        return <Navigate to="/dashboard" />;
    }

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        const errMsg = error?.data?.message || error?.error || 'Error fetching submissions.';
        return (
            <PageContainer title="My Results" description="Your past exam results">
                <Typography color="error">{errMsg}</Typography>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="My Results" description="Your past exam results">
            <DashboardCard title="My Exam Results">
                {submissions.length === 0 ? (
                    <Typography>No exam results found.</Typography>
                ) : (
                    <Grid container spacing={3}>
                        {submissions.map((sub, idx) => {
                            const passThreshold = sub.totalQuestions > 0 ? Math.ceil((sub.totalQuestions * 40) / 100) : 0;
                            const isPassed = sub.score >= passThreshold;
                            const percentageRaw = sub.percentage || 0;
                            const percentage = Number.isInteger(percentageRaw) ? percentageRaw : Number(percentageRaw).toFixed(2);

                            return (
                                <Grid item xs={12} sm={6} md={4} key={sub._id}>
                                    <Card
                                        sx={{
                                            boxShadow: 3,
                                            borderRadius: 3,
                                            overflow: 'hidden',
                                            /* Stagger entrance animation */
                                            animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
                                            animationDelay: `${idx * 0.1}s`,
                                            transition: 'transform 0.26s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.26s ease',
                                            '&:hover': {
                                                transform: 'translateY(-5px)',
                                                boxShadow: '0 14px 36px rgba(108,99,255,0.18)',
                                            },
                                        }}
                                    >
                                        {/* Top accent bar with color based on pass/fail */}
                                        <Box sx={{
                                            height: '5px',
                                            background: isPassed
                                                ? 'linear-gradient(90deg, #00D4AA, #00B894)'
                                                : 'linear-gradient(90deg, #FF6B6B, #EE5253)',
                                            backgroundSize: '200% 100%',
                                            animation: 'gradientShift 3s linear infinite',
                                        }} />
                                        <CardContent>
                                            <Typography variant="h5" component="div" gutterBottom fontWeight={700}>
                                                {sub.examId?.examName || 'Deleted Exam'}
                                            </Typography>
                                            <Typography color="textSecondary" gutterBottom variant="caption">
                                                Submitted: {new Date(sub.submittedAt).toLocaleString()}
                                            </Typography>

                                            {/* Score ring / progress visual */}
                                            <Box mt={2} mb={1.5} display="flex" alignItems="center" gap={2}>
                                                <Box
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: '50%',
                                                        background: `conic-gradient(${isPassed ? '#00D4AA' : '#FF6B6B'} ${percentage * 3.6}deg, #eee ${percentage * 3.6}deg)`,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                        boxShadow: isPassed
                                                            ? '0 0 12px rgba(0,212,170,0.4)'
                                                            : '0 0 12px rgba(255,107,107,0.4)',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 44,
                                                            height: 44,
                                                            borderRadius: '50%',
                                                            bgcolor: '#fff',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.65rem' }}>
                                                            {percentage}%
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <Box>
                                                    <Typography variant="body1">
                                                        Score: <strong>{Number.isInteger(sub.score) ? sub.score : Number(sub.score).toFixed(2)} / {sub.totalQuestions}</strong>
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Percentage: <strong>{percentage}%</strong>
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Chip
                                                    label={isPassed ? "✅ PASSED" : "❌ FAILED"}
                                                    color={isPassed ? "success" : "error"}
                                                    variant="filled"
                                                    sx={{
                                                        fontWeight: 700,
                                                        animation: isPassed ? 'pulseGlow 2.8s ease-in-out infinite' : 'none',
                                                    }}
                                                />
                                                {isPassed && (
                                                    <Button 
                                                        variant="contained" 
                                                        color="primary" 
                                                        size="small"
                                                        startIcon={<IconDownload size={16} />}
                                                        onClick={() => handleDownloadCertificate(sub)}
                                                        disabled={isGenerating}
                                                        sx={{ textTransform: 'none', borderRadius: 2 }}
                                                    >
                                                        {isGenerating ? 'Generating...' : 'Certificate'}
                                                    </Button>
                                                )}
                                                
                                                <Button
                                                    variant="outlined"
                                                    color="secondary"
                                                    size="small"
                                                    startIcon={<IconEye size={16} />}
                                                    onClick={() => navigate(`/my-results/${sub._id}`)}
                                                    sx={{ textTransform: 'none', borderRadius: 2, ml: 1 }}
                                                >
                                                    View Details
                                                </Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}
            </DashboardCard>
            
            {/* Hidden Certificate Component for PDF extraction */}
            <Box sx={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden' }}>
                {certData && <Certificate ref={certRef} {...certData} />}
            </Box>
        </PageContainer>
    );
};

export default MyResults;
