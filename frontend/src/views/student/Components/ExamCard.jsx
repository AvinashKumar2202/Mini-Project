import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { Box, CardActionArea, Chip, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { IconClock, IconCalendar, IconHelp } from '@tabler/icons-react';

const imgUrl =
  'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNvbXB1dGVyJTIwc2NpZW5jZXxlbnwwfHwwfHx8MA%3D%3D&w=1000&q=80';

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ExamCard({ exam, index = 0 }) {
  const { examName, duration, totalQuestions, _id, liveDate, deadDate } = exam;

  const navigate = useNavigate();
  const now = new Date();
  const live = liveDate ? new Date(liveDate) : null;
  const dead = deadDate ? new Date(deadDate) : null;

  const isExamActive = live && dead && now >= live && now < dead;

  const handleCardClick = () => {
    if (isExamActive) navigate(`/exam/${_id}`);
  };

  return (
    <Card
      sx={{
        overflow: 'hidden',
        cursor: isExamActive ? 'pointer' : 'default',
        /* Entrance animation staggered by index */
        animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
        animationDelay: `${index * 0.1}s`,
        /* Hover lift */
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.28s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 16px 40px rgba(108,99,255,0.20)',
        },
      }}
    >
      {/* Animated gradient accent bar */}
      <Box
        sx={{
          height: '4px',
          background: isExamActive
            ? 'linear-gradient(90deg, #6C63FF 0%, #00D4AA 100%)'
            : 'linear-gradient(90deg, #8891B0 0%, #DDE1F5 100%)',
          backgroundSize: '200% 100%',
          animation: isExamActive ? 'gradientShift 3s linear infinite' : 'none',
        }}
      />
      <CardActionArea onClick={handleCardClick} disableRipple={!isExamActive}>
        <CardMedia
          component="img"
          height="140"
          image={imgUrl}
          alt="exam cover"
          sx={{
            transition: 'transform 0.5s ease',
            '&:hover': { transform: 'scale(1.04)' },
          }}
        />
        <CardContent sx={{ pb: 2 }}>
          {/* Status chip */}
          <Chip
            label={isExamActive ? '🟢 Live Now' : '⏳ Upcoming'}
            size="small"
            sx={{
              mb: 1.5,
              fontWeight: 700,
              fontSize: '0.7rem',
              bgcolor: isExamActive ? 'rgba(0,212,170,0.12)' : 'rgba(136,145,176,0.12)',
              color: isExamActive ? '#009E7E' : '#5A6A85',
              boxShadow: isExamActive ? '0 0 8px rgba(0,212,170,0.3)' : 'none',
              animation: isExamActive ? 'pulseGlow 2.5s ease-in-out infinite' : 'none',
            }}
          />

          <Typography gutterBottom variant="h5" fontWeight={700} noWrap>
            {examName}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1.5}>
            Multiple Choice Questions
          </Typography>

          <Stack direction="row" spacing={2} mb={1.5}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconHelp size={14} color="#6C63FF" />
              <Typography variant="caption" fontWeight={600} color="text.primary">
                {exam.questions ? exam.questions.length : totalQuestions} Qs
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconClock size={14} color="#00D4AA" />
              <Typography variant="caption" fontWeight={600} color="text.primary">
                {duration} mins
              </Typography>
            </Stack>
          </Stack>

          <Box
            sx={{
              p: 1.5,
              borderRadius: '10px',
              bgcolor: 'rgba(108,99,255,0.04)',
              border: '1px solid rgba(108,99,255,0.08)',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
              <IconCalendar size={12} color="#6C63FF" />
              <Typography variant="caption" color="text.secondary">
                Live: <strong>{formatDate(liveDate)}</strong>
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconCalendar size={12} color="#FF6B6B" />
              <Typography variant="caption" color="text.secondary">
                Ends: <strong>{formatDate(deadDate)}</strong>
              </Typography>
            </Stack>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
