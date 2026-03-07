import React, { useEffect, useState } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, Stack, Avatar,
    LinearProgress, Chip, Divider, IconButton, Tooltip,
} from '@mui/material';
import {
    IconBook, IconChartBar, IconTrophy, IconCalendarEvent,
    IconClockHour4, IconTrash, IconClock, IconCalendar, IconHelp,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import { useSelector } from 'react-redux';
import { useGetMySubmissionsQuery, useGetExamsQuery, useDeleteExamMutation } from 'src/slices/examApiSlice';
import { startCase } from 'lodash';
import swal from 'sweetalert';

/* ─── Animated count-up hook ────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (target === 0) return;
        let start = 0;
        const step = target / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setValue(target); clearInterval(timer); }
            else setValue(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [target, duration]);
    return value;
}

/* ─── Countdown hook ─────────────────────────────────────────────────── */
function useCountdown(targetDate) {
    const calc = () => {
        const diff = new Date(targetDate) - new Date();
        if (diff <= 0) return null;
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        const d = Math.floor(diff / 86400000);
        return d > 0 ? `${d}d ${h % 24}h ${m}m` : `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };
    const [label, setLabel] = useState(calc);
    useEffect(() => {
        const id = setInterval(() => setLabel(calc()), 1000);
        return () => clearInterval(id);
    }, [targetDate]);
    return label;
}

/* ─── Upcoming Exam Row ──────────────────────────────────────────────── */
const UpcomingExamRow = ({ exam, idx }) => {
    const countdown = useCountdown(exam.liveDate);
    const navigate = useNavigate();
    const isActive = !countdown; // liveDate has passed — goes live
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
                py: 2, px: 2, borderRadius: '12px',
                animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
                animationDelay: `${0.35 + idx * 0.08}s`,
                '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' },
                transition: 'background 0.2s',
                cursor: isActive ? 'pointer' : 'default',
            }}
            onClick={() => isActive && navigate(`/exam/${exam._id}`)}
        >
            <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{
                    width: 44, height: 44,
                    background: 'linear-gradient(135deg,#A855F7,#EC4899)',
                    borderRadius: '13px',
                }}>
                    <IconCalendarEvent size={22} color="#fff" />
                </Avatar>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} noWrap maxWidth={200}>
                        {exam.examName}
                    </Typography>
                    <Stack direction="row" spacing={1.5} mt={0.5}>
                        <Stack direction="row" alignItems="center" spacing={0.4}>
                            <IconHelp size={12} color="#6C63FF" />
                            <Typography variant="caption" color="text.secondary">{exam.totalQuestions} Qs</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.4}>
                            <IconClock size={12} color="#00D4AA" />
                            <Typography variant="caption" color="text.secondary">{exam.duration} min</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={0.4}>
                            <IconCalendar size={12} color="#F59E0B" />
                            <Typography variant="caption" color="text.secondary">
                                {new Date(exam.liveDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Stack>
            <Chip
                label={isActive ? '🟢 Live Now' : `⏳ ${countdown}`}
                size="small"
                sx={{
                    fontWeight: 700, fontSize: '0.7rem',
                    bgcolor: isActive ? 'rgba(0,212,170,0.12)' : 'rgba(168,85,247,0.10)',
                    color: isActive ? '#009E7E' : '#7C3AED',
                }}
            />
        </Stack>
    );
};

/* ─── Stat Card ──────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, gradient, delay = 0 }) => {
    const animated = useCountUp(value);
    return (
        <Card
            sx={{
                borderRadius: '18px',
                overflow: 'hidden',
                animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both',
                animationDelay: `${delay}s`,
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                '&:hover': { transform: 'translateY(-5px)', boxShadow: '0 16px 40px rgba(108,99,255,0.18)' },
            }}
            elevation={6}
        >
            <Box sx={{ height: '4px', background: gradient, backgroundSize: '200% 100%', animation: 'gradientShift 3s linear infinite' }} />
            <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={600} mb={0.5}>{label}</Typography>
                        <Typography variant="h3" fontWeight={800}>{animated}</Typography>
                    </Box>
                    <Avatar sx={{ width: 52, height: 52, background: gradient, borderRadius: '14px' }}>
                        <Icon size={26} color="#fff" />
                    </Avatar>
                </Stack>
            </CardContent>
        </Card>
    );
};

/* ─── Result Row ─────────────────────────────────────────────────────── */
const ResultRow = ({ sub, idx }) => {
    const isPassed = sub.score >= Math.ceil((sub.totalQuestions * 60) / 100);
    return (
        <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
                py: 1.5,
                px: 2,
                borderRadius: '12px',
                animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
                animationDelay: `${0.4 + idx * 0.08}s`,
                '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' },
                transition: 'background 0.2s',
            }}
        >
            <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                    sx={{
                        width: 40, height: 40,
                        background: isPassed ? 'linear-gradient(135deg,#00D4AA,#00B894)' : 'linear-gradient(135deg,#FF6B6B,#EE5253)',
                        borderRadius: '11px', fontSize: '1rem',
                    }}
                >
                    {isPassed ? '✓' : '✗'}
                </Avatar>
                <Box>
                    <Typography variant="subtitle2" fontWeight={700} noWrap maxWidth={180}>
                        {sub.examId?.examName || 'Deleted Exam'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                </Box>
            </Stack>
            <Stack alignItems="flex-end">
                <Typography variant="subtitle2" fontWeight={700}>{sub.score}/{sub.totalQuestions}</Typography>
                <Chip
                    label={`${sub.percentage}%`}
                    size="small"
                    sx={{
                        bgcolor: isPassed ? 'rgba(0,212,170,0.12)' : 'rgba(255,107,107,0.12)',
                        color: isPassed ? '#009E7E' : '#CC2020',
                        fontWeight: 700, fontSize: '0.68rem',
                    }}
                />
            </Stack>
        </Stack>
    );
};

/* ─── Main Dashboard ─────────────────────────────────────────────────── */
const Dashboard = () => {
    const { userInfo } = useSelector((s) => s.auth);
    const { data: submissions = [] } = useGetMySubmissionsQuery();
    const { data: exams = [], refetch: refetchExams } = useGetExamsQuery();
    const navigate = useNavigate();
    const [deleteExam] = useDeleteExamMutation();

    const isTeacher = userInfo?.role === 'teacher';

    // Process Exam Data
    const now = new Date();
    const myCreatedExams = isTeacher ? exams.filter((e) => e.createdBy?._id === userInfo?._id || e.createdBy === userInfo?._id) : [];

    const upcoming = isTeacher
        ? myCreatedExams.filter((e) => e.liveDate && new Date(e.liveDate) > now).length
        : exams.filter((e) => e.liveDate && new Date(e.liveDate) > now).length;

    const avgScore = submissions.length
        ? Math.round(submissions.reduce((s, r) => s + (r.percentage || 0), 0) / submissions.length)
        : 0;

    const recent = [...submissions].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)).slice(0, 5);

    const stats = isTeacher
        ? [
            { label: 'Total Exams Created', value: myCreatedExams.length, icon: IconBook, gradient: 'linear-gradient(135deg,#6C63FF,#A78BFA)', delay: 0 },
            { label: 'Upcoming Exams', value: upcoming, icon: IconCalendarEvent, gradient: 'linear-gradient(135deg,#00D4AA,#00B894)', delay: 0.1 },
        ]
        : [
            { label: 'Exams Available', value: exams.length, icon: IconBook, gradient: 'linear-gradient(135deg,#6C63FF,#A78BFA)', delay: 0 },
            { label: 'Exams Taken', value: submissions.length, icon: IconTrophy, gradient: 'linear-gradient(135deg,#00D4AA,#00B894)', delay: 0.1 },
            { label: 'Avg. Score', value: avgScore, icon: IconChartBar, gradient: 'linear-gradient(135deg,#F59E0B,#F97316)', delay: 0.2 },
            { label: 'Upcoming Exams', value: upcoming, icon: IconCalendarEvent, gradient: 'linear-gradient(135deg,#EC4899,#A855F7)', delay: 0.3 },
        ];

    // Handle Exam Deletion
    const handleDeleteExam = async (examId, examName) => {
        const willDelete = await swal({
            title: "Are you sure?",
            text: `Once deleted, the exam "${examName}" and all related data cannot be recovered.`,
            icon: "warning",
            buttons: ["Cancel", "Yes, Delete It!"],
            dangerMode: true,
        });

        if (willDelete) {
            try {
                await deleteExam(examId).unwrap();
                swal("Poof! The exam has been deleted!", { icon: "success" });
                refetchExams(); // trigger RTK refresh
            } catch (err) {
                swal("Failed to delete exam", err?.data?.message || err.error, "error");
            }
        }
    };

    return (
        <PageContainer title="Dashboard" description="SAAN AI Exam Platform">
            {/* Greeting */}
            <Box mb={4} sx={{ animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both' }}>
                <Typography variant="h3" fontWeight={800}>
                    Welcome back,{' '}
                    <Box
                        component="span"
                        sx={{
                            background: 'linear-gradient(90deg,#6C63FF,#00D4AA,#A78BFA,#6C63FF)',
                            backgroundSize: '200% auto',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            animation: 'shimmer 3s linear infinite',
                        }}
                    >
                        {startCase(userInfo?.name)} 👋
                    </Box>
                </Typography>
                <Typography variant="body1" color="text.secondary" mt={0.5}>
                    {isTeacher
                        ? 'Manage your exams, track student performance, and grow your class.'
                        : 'Ready to show what you know? Track your progress below.'}
                </Typography>
            </Box>

            {/* Stat Cards */}
            <Grid container spacing={3} mb={4}>
                {stats.map((s) => (
                    <Grid item xs={12} sm={6} md={isTeacher ? 6 : 3} key={s.label}>
                        <StatCard {...s} />
                    </Grid>
                ))}
            </Grid>

            {/* Recent Activity — students only */}
            {!isTeacher && (
                <Grid container spacing={3}>
                    <Grid item xs={12} md={7}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '18px',
                                animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.35s both',
                                transition: 'box-shadow 0.25s',
                                '&:hover': { boxShadow: '0 0 0 2px rgba(108,99,255,0.25), 0 12px 36px rgba(108,99,255,0.12)' },
                            }}
                        >
                            <Box sx={{ height: '4px', background: 'linear-gradient(90deg,#6C63FF,#00D4AA,#A78BFA,#6C63FF)', backgroundSize: '300% 100%', animation: 'gradientShift 4s linear infinite' }} />
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h5" fontWeight={700}>Recent Results</Typography>
                                    <IconClockHour4 size={20} color="#6C63FF" />
                                </Stack>
                                {recent.length === 0 ? (
                                    <Box py={4} textAlign="center">
                                        <Typography color="text.secondary">No exams taken yet. Start your first exam!</Typography>
                                    </Box>
                                ) : (
                                    <Stack divider={<Divider />}>
                                        {recent.map((sub, i) => <ResultRow key={sub._id} sub={sub} idx={i} />)}
                                    </Stack>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Progress Banner */}
                    <Grid item xs={12} md={5}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg,#1a0547 0%,#302B63 50%,#0a3d70 100%)',
                                animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.45s both',
                            }}
                        >
                            <CardContent sx={{ p: 3 }}>
                                <Typography variant="h5" fontWeight={700} color="#fff" mb={1}>
                                    Your Progress 🎯
                                </Typography>
                                <Typography variant="body2" color="rgba(255,255,255,0.7)" mb={3}>
                                    Keep going! Consistency is the key to mastery.
                                </Typography>

                                {/* Average Score bar */}
                                <Box mb={2}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="rgba(255,255,255,0.8)">Average Score</Typography>
                                        <Typography variant="caption" fontWeight={700} color="#fff">{avgScore}%</Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={avgScore}
                                        sx={{
                                            height: 8, borderRadius: 4,
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#00D4AA,#6C63FF)', borderRadius: 4 },
                                        }}
                                    />
                                </Box>

                                {/* Exams completed */}
                                <Box mb={2}>
                                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="caption" color="rgba(255,255,255,0.8)">Exams Completed</Typography>
                                        <Typography variant="caption" fontWeight={700} color="#fff">{submissions.length}</Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={Math.min((submissions.length / Math.max(exams.length, 1)) * 100, 100)}
                                        sx={{
                                            height: 8, borderRadius: 4,
                                            bgcolor: 'rgba(255,255,255,0.15)',
                                            '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg,#F59E0B,#EC4899)', borderRadius: 4 },
                                        }}
                                    />
                                </Box>

                                <Box
                                    mt={3}
                                    p={2}
                                    sx={{ background: 'rgba(255,255,255,0.08)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                                >
                                    <Typography variant="body2" color="rgba(255,255,255,0.9)" fontWeight={500} textAlign="center">
                                        {avgScore >= 75
                                            ? '🏆 Outstanding! You\'re in the top tier!'
                                            : avgScore >= 60
                                                ? '✅ Good job! Keep pushing to reach excellence.'
                                                : submissions.length === 0
                                                    ? '🚀 Take your first exam to see your stats!'
                                                    : '💪 Keep practicing — you\'re improving every day!'}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* Upcoming Exams — students only */}
            {!isTeacher && (() => {
                const upcomingList = exams
                    .filter((e) => e.liveDate && new Date(e.liveDate) > new Date())
                    .sort((a, b) => new Date(a.liveDate) - new Date(b.liveDate));
                return (
                    <Box mt={3}>
                        <Card
                            elevation={6}
                            sx={{
                                borderRadius: '18px',
                                animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.55s both',
                                transition: 'box-shadow 0.25s',
                                '&:hover': { boxShadow: '0 0 0 2px rgba(168,85,247,0.25), 0 12px 36px rgba(168,85,247,0.12)' },
                            }}
                        >
                            <Box sx={{ height: '4px', background: 'linear-gradient(90deg,#A855F7,#EC4899,#F59E0B,#A855F7)', backgroundSize: '300% 100%', animation: 'gradientShift 4s linear infinite' }} />
                            <CardContent sx={{ p: 3 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <IconCalendarEvent size={22} color="#A855F7" />
                                        <Typography variant="h5" fontWeight={700}>Upcoming Exams</Typography>
                                    </Stack>
                                    <Chip
                                        label={`${upcomingList.length} scheduled`}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(168,85,247,0.10)', color: '#7C3AED', fontWeight: 700 }}
                                    />
                                </Stack>

                                {upcomingList.length === 0 ? (
                                    <Box py={4} textAlign="center">
                                        <Typography color="text.secondary" variant="body2">
                                            🎉 No upcoming exams right now. Enjoy the break!
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack divider={<Divider />}>
                                        {upcomingList.map((exam, i) => (
                                            <UpcomingExamRow key={exam._id} exam={exam} idx={i} />
                                        ))}
                                    </Stack>
                                )}

                                {upcomingList.length > 0 && (
                                    <Box
                                        component="a"
                                        href="/exam"
                                        mt={2}
                                        display="block"
                                        textAlign="center"
                                        sx={{
                                            color: '#A855F7',
                                            fontWeight: 600,
                                            fontSize: '0.85rem',
                                            textDecoration: 'none',
                                            '&:hover': { textDecoration: 'underline' },
                                        }}
                                    >
                                        View All Active Exams →
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                );
            })()}

            {/* Teacher panel */}
            {isTeacher && (
                <Stack spacing={4}>
                    <Card
                        elevation={6}
                        sx={{
                            borderRadius: '18px',
                            animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.35s both',
                            overflow: 'hidden',
                        }}
                    >
                        <Box sx={{ height: '4px', background: 'linear-gradient(90deg,#6C63FF,#00D4AA)', backgroundSize: '200% 100%', animation: 'gradientShift 3s linear infinite' }} />
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h5" fontWeight={700} mb={2}>Quick Actions</Typography>
                            <Grid container spacing={2}>
                                {[
                                    { label: 'Create New Exam', desc: 'Set up questions and schedule', href: '/create-exam', gradient: 'linear-gradient(135deg,#6C63FF,#A78BFA)' },
                                    { label: 'Add Questions', desc: 'Build your question bank', href: '/add-questions', gradient: 'linear-gradient(135deg,#00D4AA,#00B894)' },
                                    { label: 'View Exam Logs', desc: 'Monitor student activity', href: '/exam-log', gradient: 'linear-gradient(135deg,#F59E0B,#F97316)' },
                                ].map((action, i) => (
                                    <Grid item xs={12} sm={4} key={action.label}>
                                        <Box
                                            component="a"
                                            href={action.href}
                                            sx={{
                                                display: 'block', p: 2.5, borderRadius: '14px',
                                                background: action.gradient,
                                                color: '#fff', textDecoration: 'none',
                                                animation: `fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.1}s both`,
                                                transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                                                '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(0,0,0,0.18)' },
                                            }}
                                        >
                                            <Typography variant="h6" fontWeight={700}>{action.label}</Typography>
                                            <Typography variant="caption" sx={{ opacity: 0.85 }}>{action.desc}</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* My Created Exams Table */}
                    <Card
                        elevation={6}
                        sx={{
                            borderRadius: '18px',
                            animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) 0.55s both',
                        }}
                    >
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h5" fontWeight={700} mb={3}>My Created Exams</Typography>

                            {myCreatedExams.length === 0 ? (
                                <Box py={4} textAlign="center" borderRadius="12px" bgcolor="rgba(108,99,255,0.04)">
                                    <Typography color="text.secondary">You haven't created any exams yet.</Typography>
                                </Box>
                            ) : (
                                <Stack divider={<Divider />}>
                                    {myCreatedExams.map((exam, idx) => (
                                        <Stack
                                            key={exam._id}
                                            direction="row"
                                            alignItems="center"
                                            justifyContent="space-between"
                                            sx={{
                                                py: 2,
                                                px: 2,
                                                borderRadius: '12px',
                                                transition: 'background 0.2s',
                                                '&:hover': { bgcolor: 'rgba(108,99,255,0.04)' },
                                            }}
                                        >
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700}>
                                                    {exam.examName}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                    <span>Created: {new Date(exam.createdAt || Date.now()).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <span>{exam.totalQuestions} Questions</span>
                                                    <span>•</span>
                                                    <span style={{ color: new Date(exam.deadDate) < now ? '#ff4d4f' : '#52c41a' }}>
                                                        {new Date(exam.deadDate) < now ? 'Expired' : 'Live'}
                                                    </span>
                                                </Typography>
                                            </Box>

                                            <Stack direction="row" spacing={1}>
                                                <Tooltip title="View Submissions">
                                                    <IconButton
                                                        color="primary"
                                                        onClick={() => navigate(`/exam-submissions/${exam._id}`)}
                                                        sx={{
                                                            bgcolor: 'rgba(108,99,255,0.1)',
                                                            '&:hover': { bgcolor: 'rgba(108,99,255,0.2)' }
                                                        }}
                                                    >
                                                        <IconBook size={18} />
                                                    </IconButton>
                                                </Tooltip>

                                                <Tooltip title="Delete Exam">
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleDeleteExam(exam._id, exam.examName)}
                                                        sx={{
                                                            bgcolor: 'rgba(255,77,79,0.1)',
                                                            '&:hover': { bgcolor: 'rgba(255,77,79,0.2)' }
                                                        }}
                                                    >
                                                        <IconTrash size={18} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </Stack>
                                    ))}
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Stack>
            )}
        </PageContainer>
    );
};

export default Dashboard;
