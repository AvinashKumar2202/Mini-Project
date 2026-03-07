import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Box, Card, Typography, Stack, Button, TextField, InputAdornment,
    CircularProgress, Stepper, Step, StepLabel, IconButton, LinearProgress, Chip,
} from '@mui/material';
import {
    IconMail, IconLock, IconEye, IconEyeOff, IconArrowLeft, IconShieldCheck,
} from '@tabler/icons-react';
import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import { toast } from 'react-toastify';
import {
    useForgotPasswordMutation,
    useVerifyOtpMutation,
    useResetPasswordMutation,
} from '../../slices/usersApiSlice';

/* ── Password strength helper ───────────────────────────────────────── */
const getStrength = (pw) => {
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
};
const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', '#ef4444', '#f59e0b', '#00b894', '#6C63FF'];

const STEPS = ['Enter Email', 'Verify OTP', 'New Password'];

const ForgotPassword = () => {
    const navigate = useNavigate();

    // shared state
    const [step, setStep] = useState(0);
    const [email, setEmail] = useState('');
    const [resetToken, setResetToken] = useState('');

    // step-specific state
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const otpRefs = useRef([]);

    const [forgotPassword, { isLoading: sending }] = useForgotPasswordMutation();
    const [verifyOtp, { isLoading: verifying }] = useVerifyOtpMutation();
    const [resetPassword, { isLoading: resetting }] = useResetPasswordMutation();

    /* ── Step 1: Request OTP ─────────────────────────────────────────── */
    const handleSendOtp = async (e) => {
        e.preventDefault();
        if (!email) return toast.error('Please enter your email.');
        try {
            await forgotPassword({ email }).unwrap();
            toast.success('OTP sent! Check your inbox (and spam folder).');
            setStep(1);
        } catch (err) {
            toast.error(err?.data?.message || 'Failed to send OTP. Please try again.');
        }
    };

    /* ── OTP box keyboard handling ────────────────────────────────────── */
    const handleOtpChange = (value, idx) => {
        if (!/^\d?$/.test(value)) return;
        const next = [...otp];
        next[idx] = value;
        setOtp(next);
        if (value && idx < 5) otpRefs.current[idx + 1]?.focus();
    };

    const handleOtpKeyDown = (e, idx) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
            otpRefs.current[idx - 1]?.focus();
        }
    };

    const handleOtpPaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (text.length === 6) {
            setOtp(text.split(''));
            otpRefs.current[5]?.focus();
        }
    };

    /* ── Step 2: Verify OTP ──────────────────────────────────────────── */
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return toast.error('Enter all 6 digits.');
        try {
            const res = await verifyOtp({ email, otp: code }).unwrap();
            setResetToken(res.resetToken);
            toast.success('OTP verified! Set your new password.');
            setStep(2);
        } catch (err) {
            toast.error(err?.data?.message || 'OTP verification failed.');
        }
    };

    /* ── Step 3: Reset Password ──────────────────────────────────────── */
    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) return toast.error('Password must be at least 8 characters.');
        if (newPassword !== confirmPassword) return toast.error('Passwords do not match.');
        try {
            await resetPassword({ resetToken, newPassword }).unwrap();
            toast.success('Password reset successfully! Please log in with your new password.');
            navigate('/auth/login');
        } catch (err) {
            toast.error(err?.data?.message || 'Password reset failed. Please start over.');
        }
    };

    const strength = getStrength(newPassword);

    return (
        <PageContainer title="Forgot Password — SAAN AI" description="Reset your password">
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'background.default',
                    p: 2,
                }}
            >
                <Card
                    elevation={6}
                    sx={{
                        p: 4,
                        width: '100%',
                        maxWidth: 460,
                        borderRadius: '20px',
                        overflow: 'hidden',
                        position: 'relative',
                    }}
                >
                    {/* Gradient top bar */}
                    <Box
                        sx={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                            background: 'linear-gradient(90deg,#6C63FF,#A855F7,#EC4899,#6C63FF)',
                            backgroundSize: '300% 100%',
                            animation: 'gradientShift 4s linear infinite',
                        }}
                    />

                    {/* Logo */}
                    <Box display="flex" justifyContent="center" mb={2}>
                        <Logo />
                    </Box>

                    {/* Stepper */}
                    <Stepper activeStep={step} alternativeLabel sx={{ mb: 3 }}>
                        {STEPS.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>

                    {/* ── Step 0: Enter Email ─────────────────────────────────── */}
                    {step === 0 && (
                        <Box component="form" onSubmit={handleSendOtp}>
                            <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
                                Forgot your password?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
                                Enter your registered email and we'll send you a 6-digit OTP.
                            </Typography>

                            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Email Address</Typography>
                            <TextField
                                fullWidth
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <IconMail size={18} color="#6C63FF" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={sending}
                                sx={{
                                    borderRadius: '12px', height: 48, fontWeight: 700,
                                    background: 'linear-gradient(135deg,#6C63FF,#A855F7)',
                                    '&:hover': { background: 'linear-gradient(135deg,#5a52e0,#9333ea)' },
                                }}
                            >
                                {sending ? <CircularProgress size={22} color="inherit" /> : 'Send OTP'}
                            </Button>

                            <Stack direction="row" justifyContent="center" mt={2}>
                                <Typography
                                    component={Link}
                                    to="/auth/login"
                                    variant="body2"
                                    sx={{ color: 'text.secondary', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 0.5 }}
                                >
                                    <IconArrowLeft size={16} /> Back to Login
                                </Typography>
                            </Stack>
                        </Box>
                    )}

                    {/* ── Step 1: Enter OTP ───────────────────────────────────── */}
                    {step === 1 && (
                        <Box component="form" onSubmit={handleVerifyOtp}>
                            <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
                                Enter the OTP
                            </Typography>
                            <Typography variant="body2" color="text.secondary" textAlign="center" mb={1}>
                                We sent a 6-digit code to
                            </Typography>
                            <Box display="flex" justifyContent="center" mb={3}>
                                <Chip
                                    label={email}
                                    size="small"
                                    icon={<IconMail size={14} />}
                                    sx={{ bgcolor: 'rgba(108,99,255,0.08)', color: '#6C63FF', fontWeight: 600 }}
                                />
                            </Box>

                            {/* 6-box OTP input */}
                            <Stack direction="row" spacing={1} justifyContent="center" mb={3} onPaste={handleOtpPaste}>
                                {otp.map((digit, idx) => (
                                    <TextField
                                        key={idx}
                                        inputRef={(el) => (otpRefs.current[idx] = el)}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, idx)}
                                        onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                                        inputProps={{
                                            maxLength: 1,
                                            style: {
                                                textAlign: 'center',
                                                fontSize: '1.5rem',
                                                fontWeight: 700,
                                                padding: '12px 0',
                                                width: 44,
                                            },
                                        }}
                                        sx={{
                                            width: 52,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                '&.Mui-focused fieldset': { borderColor: '#6C63FF', borderWidth: 2 },
                                            },
                                        }}
                                    />
                                ))}
                            </Stack>

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={verifying}
                                sx={{
                                    borderRadius: '12px', height: 48, fontWeight: 700,
                                    background: 'linear-gradient(135deg,#6C63FF,#A855F7)',
                                    '&:hover': { background: 'linear-gradient(135deg,#5a52e0,#9333ea)' },
                                    mb: 1.5,
                                }}
                            >
                                {verifying ? <CircularProgress size={22} color="inherit" /> : 'Verify OTP'}
                            </Button>

                            <Stack direction="row" justifyContent="center" spacing={3}>
                                <Typography
                                    variant="body2"
                                    sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}
                                    onClick={() => { setOtp(['', '', '', '', '', '']); setStep(0); }}
                                >
                                    ← Change Email
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}
                                    onClick={handleSendOtp}
                                >
                                    Resend OTP
                                </Typography>
                            </Stack>
                        </Box>
                    )}

                    {/* ── Step 2: New Password ─────────────────────────────────── */}
                    {step === 2 && (
                        <Box component="form" onSubmit={handleResetPassword}>
                            <Stack direction="row" alignItems="center" spacing={1} justifyContent="center" mb={0.5}>
                                <IconShieldCheck size={22} color="#6C63FF" />
                                <Typography variant="h5" fontWeight={700} textAlign="center">
                                    Set New Password
                                </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
                                Choose a strong password you haven't used before.
                            </Typography>

                            {/* New password */}
                            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>New Password</Typography>
                            <TextField
                                fullWidth
                                type={showPw ? 'text' : 'password'}
                                placeholder="Min. 8 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start"><IconLock size={18} color="#6C63FF" /></InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPw((p) => !p)} edge="end" size="small">
                                                {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 1 }}
                            />

                            {/* Strength bar */}
                            {newPassword && (
                                <Box mb={2}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(strength / 4) * 100}
                                        sx={{
                                            height: 6, borderRadius: 3,
                                            bgcolor: 'rgba(108,99,255,0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                background: strengthColor[strength],
                                                borderRadius: 3,
                                                transition: 'width 0.4s ease',
                                            },
                                        }}
                                    />
                                    <Typography variant="caption" sx={{ color: strengthColor[strength], fontWeight: 600 }}>
                                        {strengthLabel[strength]}
                                    </Typography>
                                </Box>
                            )}

                            {/* Confirm password */}
                            <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Confirm Password</Typography>
                            <TextField
                                fullWidth
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                error={confirmPassword.length > 0 && confirmPassword !== newPassword}
                                helperText={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match' : ''}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start"><IconLock size={18} color="#6C63FF" /></InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowConfirm((p) => !p)} edge="end" size="small">
                                                {showConfirm ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mb: 3 }}
                            />

                            <Button
                                type="submit"
                                variant="contained"
                                fullWidth
                                size="large"
                                disabled={resetting || newPassword !== confirmPassword || newPassword.length < 8}
                                sx={{
                                    borderRadius: '12px', height: 48, fontWeight: 700,
                                    background: 'linear-gradient(135deg,#6C63FF,#A855F7)',
                                    '&:hover': { background: 'linear-gradient(135deg,#5a52e0,#9333ea)' },
                                }}
                            >
                                {resetting ? <CircularProgress size={22} color="inherit" /> : 'Reset Password'}
                            </Button>
                        </Box>
                    )}
                </Card>
            </Box>
        </PageContainer>
    );
};

export default ForgotPassword;
