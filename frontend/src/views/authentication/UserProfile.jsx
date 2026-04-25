import React from 'react';
import {
    Box,
    Typography,
    Avatar,
    Stack,
    Chip,
    Button,
    GlobalStyles,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import ProfileImg from 'src/assets/images/profile/user-1.jpg';
import {
    IconUser,
    IconMail,
    IconShieldCheck,
    IconEdit,
} from '@tabler/icons-react';

const UserProfile = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    const getAvatar = () => {
        if (userInfo?.gender === 'female') return `https://avatar.iran.liara.run/public/girl?username=${userInfo?.name}`;
        if (userInfo?.gender === 'male') return `https://avatar.iran.liara.run/public/boy?username=${userInfo?.name}`;
        if (userInfo?.gender === 'other') return `https://avatar.iran.liara.run/public?username=${userInfo?.name}`;
        return ProfileImg;
    };

    return (
        <PageContainer title="My Profile" description="Your profile information">
            <GlobalStyles
                styles={{
                    '@keyframes floatAvatarLight': {
                        '0%, 100%': { transform: 'translateY(0) translateZ(40px) scale(1)', boxShadow: '0 10px 25px rgba(108,99,255,0.4)' },
                        '50%': { transform: 'translateY(-10px) translateZ(50px) scale(1.05)', boxShadow: '0 20px 45px rgba(236,72,153,0.5)' },
                    },
                    '@keyframes cardFloatLight': {
                        '0%, 100%': { transform: 'translateY(0) rotateX(2deg) rotateY(-2deg)' },
                        '50%': { transform: 'translateY(-12px) rotateX(-1deg) rotateY(2deg)' },
                    },
                    '@keyframes bgShift': {
                        '0%': { backgroundPosition: '0% 50%' },
                        '50%': { backgroundPosition: '100% 50%' },
                        '100%': { backgroundPosition: '0% 50%' },
                    }
                }}
            />
            <Box
                sx={{
                    position: 'relative',
                    minHeight: 'calc(100vh - 100px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    borderRadius: '24px',
                    background: 'linear-gradient(-45deg, #f3e8fa, #e1e8fa, #f8e1e7, #e0f2fe)',
                    backgroundSize: '400% 400%',
                    animation: 'bgShift 15s ease infinite',
                    boxShadow: 'inset 0 0 40px rgba(255,255,255,0.5)',
                    p: { xs: 2, sm: 4 },
                }}
            >
                {/* Floating Abstract Shapes */}
                <Box sx={{ position: 'absolute', top: '-10%', left: '-5%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(108,99,255,0.3), transparent 70%)', filter: 'blur(40px)' }} />
                <Box sx={{ position: 'absolute', bottom: '-10%', right: '-5%', width: 350, height: 350, background: 'radial-gradient(circle, rgba(236,72,153,0.3), transparent 70%)', filter: 'blur(40px)' }} />

                <Box sx={{ perspective: '1500px', width: '100%', maxWidth: '550px', zIndex: 2 }}>
                    <Box
                        sx={{
                            position: 'relative',
                            borderRadius: '30px',
                            background: 'rgba(255, 255, 255, 0.45)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.6)',
                            boxShadow: '0 30px 60px rgba(108,99,255,0.15), 0 4px 24px rgba(236,72,153,0.1)',
                            animation: 'cardFloatLight 8s ease-in-out infinite',
                            transformStyle: 'preserve-3d',
                            p: { xs: 3, sm: 5 },
                            transition: 'all 0.3s ease-out',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.55)',
                                boxShadow: '0 40px 80px rgba(108,99,255,0.25), 0 10px 40px rgba(236,72,153,0.2)',
                            }
                        }}
                    >
                        {/* Profile Header */}
                        <Stack direction="column" alignItems="center" spacing={2} mb={4} sx={{ transformStyle: 'preserve-3d' }}>
                            <Box sx={{ position: 'relative', transformStyle: 'preserve-3d', animation: 'floatAvatarLight 5s ease-in-out infinite' }}>
                                <Avatar
                                    src={getAvatar()}
                                    alt="Profile"
                                    sx={{
                                        width: 140,
                                        height: 140,
                                        border: '5px solid',
                                        borderColor: '#fff',
                                        background: 'linear-gradient(135deg, #EC4899, #6C63FF)',
                                        p: '2px', // leaves gradient border
                                        img: { borderRadius: '50%', background: '#fff' }
                                    }}
                                />
                            </Box>
                            
                            <Box sx={{ transform: 'translateZ(30px)', textAlign: 'center', mt: '24px !important' }}>
                                <Typography variant="h2" fontWeight="900" sx={{
                                    background: 'linear-gradient(90deg, #1e293b, #6C63FF)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    textShadow: '0 10px 20px rgba(108,99,255,0.15)'
                                }}>
                                    {userInfo?.name || 'User'}
                                </Typography>
                                <Chip
                                    label={userInfo?.role === 'teacher' ? 'Teacher' : 'Student'}
                                    sx={{
                                        mt: 1.5,
                                        background: 'linear-gradient(135deg, #6C63FF, #00D4AA)',
                                        color: '#fff',
                                        fontWeight: 800,
                                        fontSize: '0.85rem',
                                        letterSpacing: 1,
                                        boxShadow: '0 8px 20px rgba(108,99,255,0.3)',
                                        border: 'none',
                                        px: 1,
                                    }}
                                />
                            </Box>
                        </Stack>

                        {/* Profile Details */}
                        <Stack spacing={2.5} sx={{ transform: 'translateZ(20px)' }}>
                            {[
                                { icon: <IconUser size={24} color="#6C63FF" />, label: 'Full Name', value: userInfo?.name || 'N/A', bg: 'rgba(108,99,255,0.15)' },
                                { icon: <IconMail size={24} color="#EC4899" />, label: 'Email Address', value: userInfo?.email || 'N/A', bg: 'rgba(236,72,153,0.15)' },
                                { icon: <IconShieldCheck size={24} color="#f59e0b" />, label: 'Role', value: userInfo?.role || 'N/A', bg: 'rgba(245,158,11,0.15)', capitalize: true },
                                { icon: <IconUser size={24} color="#00D4AA" />, label: userInfo?.role === 'teacher' ? 'Teacher ID' : 'Student UID', value: (userInfo?.role === 'teacher' ? userInfo?.teacherId : userInfo?.universityId) || 'N/A', bg: 'rgba(0,212,170,0.15)' },
                            ].map((item, idx) => (
                                <Box
                                    key={idx}
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 2.5,
                                        background: 'rgba(255, 255, 255, 0.6)',
                                        border: '1px solid rgba(255, 255, 255, 0.8)',
                                        borderRadius: '20px',
                                        p: 2.5,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.04)',
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.02) translateZ(10px)', boxShadow: '0 12px 28px rgba(108,99,255,0.12)' }
                                    }}
                                >
                                    <Box
                                        sx={{
                                            background: item.bg,
                                            borderRadius: '16px',
                                            minWidth: 54, height: 54,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: 'inset 0 2px 5px rgba(255,255,255,0.5)'
                                        }}
                                    >
                                        {item.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="textSecondary" fontWeight="600" mb={0.5}>
                                            {item.label}
                                        </Typography>
                                        <Typography variant="h6" fontWeight="700" color="#1e293b" sx={{ textTransform: item.capitalize ? 'capitalize' : 'none' }}>
                                            {item.value}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Stack>

                        {/* Edit Button */}
                        <Box sx={{ mt: 5, textAlign: 'center', transform: 'translateZ(25px)' }}>
                            <Button
                                variant="contained"
                                startIcon={<IconEdit size={20} />}
                                onClick={() => navigate('/user/account')}
                                sx={{
                                    background: 'linear-gradient(90deg, #6C63FF, #EC4899)',
                                    color: '#fff',
                                    borderRadius: '16px',
                                    py: 1.5, px: 5,
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    boxShadow: '0 10px 25px rgba(236,72,153,0.4)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        background: 'linear-gradient(90deg, #EC4899, #6C63FF)',
                                        transform: 'translateY(-3px)',
                                        boxShadow: '0 15px 35px rgba(108,99,255,0.5)',
                                    }
                                }}
                            >
                                Edit Profile
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </PageContainer>
    );
};

export default UserProfile;
