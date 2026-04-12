import React from 'react';
import {
  Typography, Box, Card, CardContent, Button, Stack,
  Chip, Container, GlobalStyles, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { IconShare, IconHome, IconBook, IconDownload } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import { IconCertificate } from '@tabler/icons-react';

/* ─── Animated ring ──────────────────────────────────────────── */
const ScoreRingStyles = () => (
  <GlobalStyles
    styles={{
      '@keyframes ringFill': {
        from: { strokeDashoffset: 314 },
        to: { strokeDashoffset: 'var(--ring-offset)' },
      },
      '@keyframes popIn': {
        from: { opacity: 0, transform: 'scale(0.7)' },
        to: { opacity: 1, transform: 'scale(1)' },
      },
      '@keyframes confettiFall': {
        '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: 1 },
        '100%': { transform: 'translateY(80px) rotate(360deg)', opacity: 0 },
      },
      '@media print': {
        '.no-print': {
          display: 'none !important',
        },
        body: {
          background: '#fff !important',
        },
      },
    }}
  />
);

/* ─── SVG Score Ring ─────────────────────────────────────────── */
const ScoreRing = ({ percentage, isPassed }) => {
  const circumference = 314; // 2π × 50
  const offset = circumference - (circumference * percentage) / 100;
  const color = isPassed ? '#00D4AA' : '#FF6B6B';

  return (
    <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r="50" fill="none" stroke="#eee" strokeWidth="10" />
        <circle
          cx="70" cy="70" r="50" fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          style={{
            '--ring-offset': offset,
            animation: 'ringFill 1.4s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards',
            filter: `drop-shadow(0 0 6px ${color}88)`,
          }}
        />
      </svg>
      <Box position="absolute" textAlign="center">
        <Typography variant="h4" fontWeight={800} color={color}>{percentage}%</Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>Score</Typography>
      </Box>
    </Box>
  );
};

/* ─── Confetti Piece ──────────────────────────────────────────── */
const ConfettiPiece = ({ color, left, delay, size }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0, left: `${left}%`,
      width: size, height: size,
      borderRadius: '3px',
      bgcolor: color,
      animation: `confettiFall 1.2s ease-out ${delay}s both`,
      pointerEvents: 'none',
    }}
  />
);

const confettiConfig = [
  { color: '#6C63FF', left: 10, delay: 0.1, size: 8 },
  { color: '#00D4AA', left: 25, delay: 0.2, size: 6 },
  { color: '#F59E0B', left: 40, delay: 0.05, size: 10 },
  { color: '#EC4899', left: 55, delay: 0.3, size: 7 },
  { color: '#A78BFA', left: 70, delay: 0.15, size: 9 },
  { color: '#00D4AA', left: 85, delay: 0.25, size: 6 },
  { color: '#6C63FF', left: 92, delay: 0.1, size: 8 },
];

/* ─── Stat Pill ───────────────────────────────────────────────── */
const StatPill = ({ label, value, color }) => (
  <Box
    sx={{
      flex: 1, p: 2, borderRadius: '14px',
      bgcolor: `${color}14`, border: `1px solid ${color}33`,
      textAlign: 'center',
    }}
  >
    <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
    <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
  </Box>
);

/* ─── Result Page ────────────────────────────────────────────── */
const ResultPage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  if (userInfo?.role === 'teacher') {
    return <Navigate to="/dashboard" />;
  }
  const state = location.state || {};
  const { 
    score = 0, 
    totalQuestions = 0, 
    examName = 'Exam', 
    examDuration = 0,
    correctAnswersCount = 0,
    incorrectAnswersCount = 0,
    unattemptedCount = 0,
    answerReport = []
  } = state;

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passingScore = Math.ceil((totalQuestions * 40) / 100);
  const isPassed = score >= passingScore;

  const displayScore = Number.isInteger(score) ? score : Number(score).toFixed(2);

  const pieData = [
    { name: 'Correct', value: correctAnswersCount, color: '#00D4AA' },
    { name: 'Incorrect', value: incorrectAnswersCount, color: '#FF6B6B' },
    { name: 'Unattempted', value: unattemptedCount, color: '#A0A0A0' },
  ].filter(item => item.value > 0);

  const handleShare = () => {
    const text = `📝 ${examName}\n✅ Score: ${displayScore}/${totalQuestions} (${percentage}%)\n${isPassed ? '🏆 PASSED' : '❌ FAILED'}\nTested on SAAN AI Exam Platform`;
    navigator.clipboard.writeText(text).then(() => toast.success('Result copied to clipboard!'));
  };

  const generateCertificate = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Border
    doc.setDrawColor(108, 99, 255); // #6C63FF
    doc.setLineWidth(2);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

    // Content
    doc.setTextColor(108, 99, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.text('CERTIFICATE', pageWidth / 2, 45, { align: 'center' });
    doc.setFontSize(20);
    doc.text('OF ACHIEVEMENT', pageWidth / 2, 55, { align: 'center' });

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('This is to certify that', pageWidth / 2, 75, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bolditalic');
    doc.text(userInfo?.name || 'Student', pageWidth / 2, 95, { align: 'center' });

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('has successfully completed the exam:', pageWidth / 2, 115, { align: 'center' });

    doc.setTextColor(0, 212, 170); // #00D4AA
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(examName, pageWidth / 2, 130, { align: 'center' });

    doc.setTextColor(60, 60, 60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text(`with a brilliant score of ${percentage}% (${displayScore}/${totalQuestions})`, pageWidth / 2, 145, { align: 'center' });

    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth / 2, 165, { align: 'center' });
    doc.text('Platform: SAAN AI PROCTORED EXAM', pageWidth / 2, 172, { align: 'center' });

    // Footer decoration
    doc.setDrawColor(0, 212, 170);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 40, 150, pageWidth / 2 + 40, 150);

    doc.save(`${userInfo?.name || 'student'}_certificate.pdf`);
    toast.success('Certificate downloaded successfully!');
  };

  return (
    <PageContainer title="Result" description="Your exam results">
      <ScoreRingStyles />
      <Container maxWidth="sm">
        <Box mt={4} mb={4} sx={{ animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <Card
            elevation={10}
            sx={{
              borderRadius: '22px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* Top gradient band */}
            <Box
              sx={{
                background: isPassed
                  ? 'linear-gradient(135deg,#00D4AA 0%,#00B894 40%,#6C63FF 100%)'
                  : 'linear-gradient(135deg,#FF6B6B 0%,#EE5253 40%,#c0392b 100%)',
                py: 5,
                px: 3,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Confetti for pass */}
              {isPassed && confettiConfig.map((c, i) => <ConfettiPiece key={i} {...c} />)}

              <Avatar
                sx={{
                  width: 72, height: 72, mx: 'auto', mb: 2,
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '3px solid rgba(255,255,255,0.5)',
                }}
              >
                {isPassed
                  ? <CheckCircleOutlineIcon sx={{ fontSize: 44, color: '#fff' }} />
                  : <CancelOutlinedIcon sx={{ fontSize: 44, color: '#fff' }} />}
              </Avatar>
              <Typography variant="h3" fontWeight={900} color="#fff">
                {isPassed ? 'Congratulations! 🎉' : 'Keep Going! 💪'}
              </Typography>
              <Typography variant="body1" color="rgba(255,255,255,0.85)" mt={1}>
                {isPassed ? 'You passed the exam!' : 'You can do better next time.'}
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* Score ring + exam info */}
              <Stack direction="row" alignItems="center" spacing={3} mb={3}>
                <ScoreRing percentage={percentage} isPassed={isPassed} />
                <Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>{examName}</Typography>
                  <Chip
                    label={isPassed ? '✅ PASSED' : '❌ FAILED'}
                    color={isPassed ? 'success' : 'error'}
                    sx={{ fontWeight: 700, fontSize: '0.8rem', mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Duration: <strong>{examDuration} mins</strong>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passing mark: <strong>{passingScore}/{totalQuestions} (40%)</strong>
                  </Typography>
                </Box>
              </Stack>

              {/* Score breakdown & Pie Chart */}
              <Box mb={3} sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '16px', py: 2, border: '1px solid rgba(0,0,0,0.05)' }}>
                {pieData.length > 0 && (
                  <Box sx={{ width: '100%', height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} 
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '0.8rem', fontWeight: 600 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                
                <Stack direction="row" spacing={2} mx={3} mt={pieData.length > 0 ? 1 : 0}>
                  <StatPill label="Final Score" value={displayScore} color="#6C63FF" />
                  <StatPill label="Correct" value={correctAnswersCount} color="#00D4AA" />
                  <StatPill label="Incorrect" value={incorrectAnswersCount} color="#FF6B6B" />
                </Stack>
              </Box>

              {/* Action buttons */}
              <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ gap: 1 }} className="no-print">
                {isPassed && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<IconCertificate size={18} />}
                    onClick={generateCertificate}
                    sx={{ borderRadius: '12px', px: 3, fontWeight: 700, bgcolor: '#00D4AA', '&:hover': { bgcolor: '#00B894' } }}
                  >
                    Certificate
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<IconBook size={18} />}
                  onClick={() => navigate('/exam')}
                  sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
                >
                  Exams
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconHome size={18} />}
                  onClick={() => navigate('/')}
                  sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
                >
                  Home
                </Button>
                <Button
                  variant="text"
                  color="secondary"
                  startIcon={<IconShare size={18} />}
                  onClick={handleShare}
                  sx={{ borderRadius: '12px', fontWeight: 700 }}
                >
                  Share
                </Button>
                <Button
                  variant="text"
                  color="secondary"
                  startIcon={<IconDownload size={18} />}
                  onClick={() => window.print()}
                  sx={{ borderRadius: '12px', fontWeight: 700 }}
                >
                  Print
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Detailed Question Report */}
          {answerReport.length > 0 && (
            <Box mt={4} className="detailed-report">
              <Typography variant="h5" fontWeight={800} mb={2} textAlign="center" color="text.primary">
                Detailed Performance Report
              </Typography>
              <TableContainer component={Paper} elevation={6} sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <Table size="small" aria-label="question report">
                  <TableHead sx={{ background: 'linear-gradient(90deg, rgba(108,99,255,0.08), rgba(0,212,170,0.08))' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, py: 1.5, fontSize: '0.95rem' }}>Question #</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, py: 1.5, fontSize: '0.95rem' }}>Result</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {answerReport.map((res, index) => {
                      const ansStatus = typeof res === 'string' ? res : res.status;
                      const ansDetail = typeof res === 'object' && res.detail ? res.detail : null;

                      return (
                      <TableRow key={index} sx={{ '&:last-child td, &:last-child th': { border: 0 }, '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' } }}>
                        <TableCell component="th" scope="row" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                          Question {index + 1}
                          {ansDetail && (
                            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              {ansDetail}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={ansStatus} 
                            size="small" 
                            sx={{ 
                              fontWeight: 700, fontSize: '0.72rem', px: 1, height: 24,
                              bgcolor: ansStatus === 'Correct' ? 'rgba(0,212,170,0.15)' : ansStatus === 'Incorrect' ? 'rgba(255,107,107,0.15)' : 'rgba(160,160,160,0.15)',
                              color: ansStatus === 'Correct' ? '#009E7E' : ansStatus === 'Incorrect' ? '#CC2020' : '#666',
                            }} 
                          />
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

        </Box>
      </Container>
    </PageContainer>
  );
};

export default ResultPage;
