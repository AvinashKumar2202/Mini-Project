import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Card, CardContent, Button, Stack,
  Chip, Container, GlobalStyles, Avatar,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { IconShare, IconHome, IconBook } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

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
  const { score = 0, totalQuestions = 0, examName = 'Exam', examDuration = 0 } = state;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const passingScore = Math.ceil((totalQuestions * 60) / 100);
  const isPassed = score >= passingScore;
  const wrong = totalQuestions - score;

  const handleShare = () => {
    const text = `📝 ${examName}\n✅ Score: ${score}/${totalQuestions} (${percentage}%)\n${isPassed ? '🏆 PASSED' : '❌ FAILED'}\nTested on SAAN AI Exam Platform`;
    navigator.clipboard.writeText(text).then(() => toast.success('Result copied to clipboard!'));
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
                    Passing mark: <strong>{passingScore}/{totalQuestions} (60%)</strong>
                  </Typography>
                </Box>
              </Stack>

              {/* Score breakdown */}
              <Stack direction="row" spacing={2} mb={3}>
                <StatPill label="Correct" value={score} color="#00D4AA" />
                <StatPill label="Wrong" value={wrong} color="#FF6B6B" />
                <StatPill label="Total" value={totalQuestions} color="#6C63FF" />
              </Stack>

              {/* Action buttons */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<IconBook size={18} />}
                  onClick={() => navigate('/exam')}
                  sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
                >
                  More Exams
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<IconHome size={18} />}
                  onClick={() => navigate('/')}
                  sx={{ borderRadius: '12px', px: 3, fontWeight: 700 }}
                >
                  Dashboard
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
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </PageContainer>
  );
};

export default ResultPage;
