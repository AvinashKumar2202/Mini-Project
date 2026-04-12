import React from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Stack, Avatar, Chip } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { useGetLeaderboardQuery } from 'src/slices/examApiSlice';
import { IconTrophy, IconMedal, IconFlame } from '@tabler/icons-react';
import { startCase } from 'lodash';

const getMedalColor = (index) => {
    switch (index) {
        case 0: return 'linear-gradient(135deg, #FFD700 0%, #FDB931 100%)'; // Gold
        case 1: return 'linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%)'; // Silver
        case 2: return 'linear-gradient(135deg, #CD7F32 0%, #A0522D 100%)'; // Bronze
        default: return 'transparent';
    }
};

const LeaderboardPage = () => {
    const { data: leaderboardData, isLoading, isError, error } = useGetLeaderboardQuery();

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        const errMsg = error?.data?.message || error?.error || 'Error fetching leaderboard.';
        return (
            <PageContainer title="Leaderboard" description="Top students ranking">
                <Typography color="error">{errMsg}</Typography>
            </PageContainer>
        );
    }

    const leaderboard = Array.isArray(leaderboardData) ? leaderboardData : (leaderboardData?.leaderboard || []);

    return (
        <PageContainer title="Global Leaderboard" description="See who is leading the ranks">
            <Box mb={4} textAlign="center" sx={{ animation: 'fadeSlideUp 0.5s ease-out' }}>
                <Typography variant="h2" fontWeight={800} gutterBottom sx={{
                    background: 'linear-gradient(90deg, #FFD700, #FF8C00)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                }}>
                    <IconTrophy size={42} color="#FFD700" style={{ fill: '#FFD700' }} />
                    Hall of Fame
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Top performers across all exams. Aim high and join the ranks!
                </Typography>
            </Box>

            <DashboardCard title="Top Students">
                {leaderboard.length === 0 ? (
                    <Typography textAlign="center" py={4}>No scores available yet. Be the first to take an exam!</Typography>
                ) : (
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        {leaderboard.map((student, index) => {
                            const isTop3 = index < 3;
                            return (
                                <Card
                                    key={student._id}
                                    sx={{
                                        boxShadow: isTop3 ? '0 8px 24px rgba(255,215,0,0.2)' : 1,
                                        transform: isTop3 ? 'scale(1.02)' : 'none',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                        position: 'relative',
                                        overflow: 'visible',
                                        border: isTop3 ? '2px solid rgba(255,215,0,0.3)' : '1px solid transparent',
                                        animation: `fadeSlideUp 0.5s ease-out ${index * 0.1}s both`,
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 12px 28px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    {isTop3 && (
                                        <Box sx={{
                                            position: 'absolute',
                                            top: '-15px',
                                            left: '-15px',
                                            zIndex: 2,
                                        }}>
                                            <Avatar sx={{ background: getMedalColor(index), width: 40, height: 40, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                                                <IconMedal size={24} color="#fff" />
                                            </Avatar>
                                        </Box>
                                    )}

                                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: '16px !important' }}>
                                        <Stack direction="row" alignItems="center" spacing={3}>
                                            <Typography variant="h5" fontWeight={800} sx={{ width: 30, textAlign: 'center', color: isTop3 ? '#FF8C00' : 'text.secondary' }}>
                                                #{index + 1}
                                            </Typography>
                                            
                                            <Avatar sx={{ bgcolor: isTop3 ? '#FFF8E1' : '#F5F5F5', color: isTop3 ? '#FF8C00' : '#757575', fontWeight: 700, width: 50, height: 50 }}>
                                                {student.studentName?.charAt(0).toUpperCase()}
                                            </Avatar>

                                            <Box>
                                                <Typography variant="h6" fontWeight={700}>
                                                    {startCase(student.studentName)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {student.examsTaken} Exam{student.examsTaken > 1 ? 's' : ''} Taken
                                                </Typography>
                                            </Box>
                                        </Stack>

                                        <Stack alignItems="flex-end" spacing={1}>
                                            <Typography variant="h5" fontWeight={800} color="#6C63FF">
                                                {student.totalScore} <Typography component="span" variant="caption" color="text.secondary">pts</Typography>
                                            </Typography>
                                            <Chip 
                                                icon={<IconFlame size={14} />} 
                                                label={`Avg: ${Number(student.averagePercentage).toFixed(1)}%`}
                                                size="small"
                                                sx={{ bgcolor: 'rgba(255,140,0,0.1)', color: '#FF8C00', fontWeight: 700 }}
                                            />
                                        </Stack>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </Stack>
                )}
            </DashboardCard>
        </PageContainer>
    );
};

export default LeaderboardPage;
