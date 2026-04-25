import React, { useEffect, useState } from 'react';
import { Grid, Typography, Box, Stack, Chip, Divider } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import BlankCard from '../../../components/shared/BlankCard';
import ExamCard from './ExamCard';
import { useGetExamsQuery } from 'src/slices/examApiSlice';
import { IconCalendarEvent, IconClock, IconCalendar, IconHelp } from '@tabler/icons-react';

/* ─── Live countdown hook ─────────────────────────────────────────────── */
function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - new Date();
    if (diff <= 0) return null;
    const d = Math.floor(diff / 86400000);
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return d > 0
      ? `${d}d ${h % 24}h ${m}m`
      : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const [label, setLabel] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setLabel(calc()), 1000);
    return () => clearInterval(id);
  }, [targetDate]);
  return label;
}

/* ─── Upcoming exam card ──────────────────────────────────────────────── */
const UpcomingCard = ({ exam, index }) => {
  const countdown = useCountdown(exam.liveDate);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : 'N/A';

  return (
    <BlankCard>
      <Box
        sx={{
          overflow: 'hidden',
          borderRadius: '12px',
          animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
          animationDelay: `${index * 0.1}s`,
          transition: 'transform 0.28s ease, box-shadow 0.28s ease',
          '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 14px 36px rgba(168,85,247,0.18)' },
        }}
      >
        {/* Gradient accent bar */}
        <Box
          sx={{
            height: '4px',
            background: 'linear-gradient(90deg,#A855F7,#EC4899,#F59E0B)',
            backgroundSize: '200% 100%',
            animation: 'gradientShift 3.5s linear infinite',
          }}
        />
        <Box p={2.5}>
          {/* Status chip + countdown */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
            <Chip
              label="⏳ Upcoming"
              size="small"
              sx={{
                fontWeight: 700, fontSize: '0.7rem',
                bgcolor: 'rgba(168,85,247,0.10)', color: '#7C3AED',
              }}
            />
            <Chip
              label={countdown || '🟢 Live!'}
              size="small"
              sx={{
                fontWeight: 700, fontSize: '0.7rem',
                bgcolor: countdown ? 'rgba(245,158,11,0.10)' : 'rgba(0,212,170,0.12)',
                color: countdown ? '#B45309' : '#009E7E',
                animation: !countdown ? 'pulseGlow 2.5s ease-in-out infinite' : 'none',
              }}
            />
          </Stack>

          <Typography variant="h5" fontWeight={700} noWrap mb={0.5}>{exam.examName}</Typography>
          <Typography variant="body2" color="text.secondary" mb={1.5}>Multiple Choice Questions</Typography>

          <Stack direction="row" spacing={2} mb={1.5}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconHelp size={14} color="#6C63FF" />
              <Typography variant="caption" fontWeight={600}>{exam.totalQuestions} Qs</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconClock size={14} color="#00D4AA" />
              <Typography variant="caption" fontWeight={600}>{exam.duration} mins</Typography>
            </Stack>
          </Stack>

          <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.12)' }}>
            <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
              <IconCalendar size={12} color="#A855F7" />
              <Typography variant="caption" color="text.secondary">
                Starts: <strong>{formatDate(exam.liveDate)}</strong>
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconCalendar size={12} color="#FF6B6B" />
              <Typography variant="caption" color="text.secondary">
                Ends: <strong>{formatDate(exam.deadDate)}</strong>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>
    </BlankCard>
  );
};

/* ─── Main Exams component ────────────────────────────────────────────── */
const Exams = () => {
  const { data: exams = [], isLoading, isError } = useGetExamsQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    const errMsg = isError?.data?.message || isError?.error || 'Error fetching exams.';
    return <div>{errMsg}</div>;
  }

  const now = new Date();

  const activeExams = exams.filter((exam) => {
    const liveDate = exam.liveDate ? new Date(exam.liveDate) : null;
    const deadDate = exam.deadDate ? new Date(exam.deadDate) : null;
    if (!liveDate || !deadDate) return false;
    return now >= liveDate && now < deadDate;
  });

  const upcomingExams = exams
    .filter((exam) => exam.liveDate && new Date(exam.liveDate) > now)
    .sort((a, b) => new Date(a.liveDate) - new Date(b.liveDate));

  return (
    <PageContainer title="Exams" description="Active and Upcoming Exams">

      {/* Active Exams */}
      <Box mb={4}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Box
            sx={{
              width: 10, height: 10, borderRadius: '50%',
              bgcolor: '#00D4AA',
              boxShadow: '0 0 8px rgba(0,212,170,0.6)',
              animation: 'pulseGlow 2s ease-in-out infinite',
            }}
          />
          <Typography variant="h5" fontWeight={700}>Active Exams</Typography>
          <Chip
            label={`${activeExams.length} live now`}
            size="small"
            sx={{ bgcolor: 'rgba(0,212,170,0.10)', color: '#009E7E', fontWeight: 700 }}
          />
        </Stack>

        {activeExams.length === 0 ? (
          <Box
            py={3} px={3} borderRadius="14px"
            sx={{ bgcolor: 'rgba(0,212,170,0.04)', border: '1px dashed rgba(0,212,170,0.25)' }}
          >
            <Typography variant="body2" color="text.secondary" textAlign="center">
              No active exams right now. Check back later!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {activeExams.map((exam, idx) => (
              <Grid item sm={6} md={4} lg={3} key={exam._id}>
                <BlankCard>
                  <ExamCard exam={exam} index={idx} />
                </BlankCard>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* Upcoming Exams */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <IconCalendarEvent size={22} color="#A855F7" />
          <Typography variant="h5" fontWeight={700}>Upcoming Exams</Typography>
          <Chip
            label={`${upcomingExams.length} scheduled`}
            size="small"
            sx={{ bgcolor: 'rgba(168,85,247,0.10)', color: '#7C3AED', fontWeight: 700 }}
          />
        </Stack>

        {upcomingExams.length === 0 ? (
          <Box
            py={3} px={3} borderRadius="14px"
            sx={{ bgcolor: 'rgba(168,85,247,0.04)', border: '1px dashed rgba(168,85,247,0.25)' }}
          >
            <Typography variant="body2" color="text.secondary" textAlign="center">
              🎉 No upcoming exams scheduled. Enjoy the break!
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {upcomingExams.map((exam, idx) => (
              <Grid item sm={6} md={4} lg={3} key={exam._id}>
                <UpcomingCard exam={exam} index={idx} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </PageContainer>
  );
};

export default Exams;
