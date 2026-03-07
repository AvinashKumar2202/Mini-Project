import React from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Stack,
    Divider,
    Chip,
    Button,
    Grid,
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
    IconCalendar,
} from '@tabler/icons-react';

const UserProfile = () => {
    const { userInfo } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    return (
        <PageContainer title="My Profile" description="Your profile information">
            <Box
                sx={{
                    position: 'relative',
                    '&:before': {
                        content: '""',
                        background: 'radial-gradient(#d2f1df, #d3e1fa, #f4d5ba)',
                        backgroundSize: '400% 400%',
                        animation: 'gradient 15s ease infinite',
                        position: 'absolute',
                        height: '100%',
                        width: '100%',
                        opacity: '0.3',
                    },
                }}
            >
                <Grid container spacing={0} justifyContent="center" sx={{ minHeight: '100vh', py: 4 }}>
                    <Grid
                        item
                        xs={12}
                        sm={10}
                        md={8}
                        lg={6}
                        display="flex"
                        justifyContent="center"
                        alignItems="flex-start"
                    >
                        <Card elevation={9} sx={{ p: 4, zIndex: 1, width: '100%', maxWidth: '600px' }}>
                            <CardContent>
                                {/* Profile Header */}
                                <Stack direction="column" alignItems="center" spacing={2} mb={4}>
                                    <Avatar
                                        src={ProfileImg}
                                        alt="Profile"
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            border: '4px solid',
                                            borderColor: 'primary.main',
                                        }}
                                    />
                                    <Typography variant="h3" fontWeight="bold">
                                        {userInfo?.name || 'User'}
                                    </Typography>
                                    <Chip
                                        label={userInfo?.role === 'teacher' ? 'Teacher' : 'Student'}
                                        color={userInfo?.role === 'teacher' ? 'secondary' : 'primary'}
                                        variant="filled"
                                        size="medium"
                                    />
                                </Stack>

                                <Divider sx={{ mb: 3 }} />

                                {/* Profile Details */}
                                <Stack spacing={3}>
                                    {/* Name */}
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box
                                            sx={{
                                                backgroundColor: 'primary.light',
                                                borderRadius: '12px',
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconUser size={24} color="#5D87FF" />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">
                                                Full Name
                                            </Typography>
                                            <Typography variant="h6" fontWeight="600">
                                                {userInfo?.name || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Email */}
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box
                                            sx={{
                                                backgroundColor: 'success.light',
                                                borderRadius: '12px',
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconMail size={24} color="#4caf50" />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">
                                                Email Address
                                            </Typography>
                                            <Typography variant="h6" fontWeight="600">
                                                {userInfo?.email || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Stack>

                                    {/* Role */}
                                    <Stack direction="row" alignItems="center" spacing={2}>
                                        <Box
                                            sx={{
                                                backgroundColor: 'warning.light',
                                                borderRadius: '12px',
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <IconShieldCheck size={24} color="#ff9800" />
                                        </Box>
                                        <Box>
                                            <Typography variant="body2" color="textSecondary">
                                                Role
                                            </Typography>
                                            <Typography variant="h6" fontWeight="600" textTransform="capitalize">
                                                {userInfo?.role || 'N/A'}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </Stack>

                                <Divider sx={{ my: 3 }} />

                                {/* Edit Button */}
                                <Stack direction="row" justifyContent="center">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<IconEdit size={18} />}
                                        onClick={() => navigate('/user/account')}
                                        size="large"
                                    >
                                        Edit Profile
                                    </Button>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>
        </PageContainer>
    );
};

export default UserProfile;
