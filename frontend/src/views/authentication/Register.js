import React, { useEffect } from 'react';
import { Box, Typography, Stack, GlobalStyles } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import AuthRegister from './auth/AuthRegister';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { useRegisterMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import Loader from './Loader';

/* ─── Keyframes (reuse same cosmic set from Login but with different timing) */
const RegisterAnimStyles = () => (
  <GlobalStyles
    styles={{
      '@keyframes regAuroraOne': {
        '0%,100%': { transform: 'translate(0,0) scale(1)', opacity: 0.5 },
        '45%': { transform: 'translate(-60px,70px) scale(1.25)', opacity: 0.7 },
      },
      '@keyframes regAuroraTwo': {
        '0%,100%': { transform: 'translate(0,0) scale(1.1)', opacity: 0.4 },
        '55%': { transform: 'translate(80px,-50px) scale(0.85)', opacity: 0.65 },
      },
      '@keyframes regTwinkle': {
        '0%,100%': { opacity: 0.15, transform: 'scale(1)' },
        '50%': { opacity: 0.9, transform: 'scale(1.5)' },
      },
      '@keyframes regSlideLeft': {
        from: { opacity: 0, transform: 'translateX(-55px) scale(0.96)' },
        to: { opacity: 1, transform: 'translateX(0) scale(1)' },
      },
      '@keyframes regNeon': {
        '0%': { backgroundPosition: '0% 50%' },
        '50%': { backgroundPosition: '100% 50%' },
        '100%': { backgroundPosition: '0% 50%' },
      },
      '@keyframes hexFloat': {
        '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
        '50%': { transform: 'translateY(-16px) rotate(-6deg)' },
      },
    }}
  />
);

/* ─── Stars ─────────────────────────────────────────────────────────── */
const REG_STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  top: `${Math.random() * 100}%`,
  left: `${Math.random() * 100}%`,
  size: Math.random() * 2.5 + 1,
  delay: `${Math.random() * 5}s`,
  dur: `${Math.random() * 3 + 2}s`,
}));

/* ─── Schema ─────────────────────────────────────────────────────────── */
const regSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
  confirmPassword: yup.string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Confirm your password'),
  role: yup.string().required('Select a role'),
  universityId: yup.string().when('role', {
    is: 'student',
    then: (schema) => schema.required('University/School ID is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  teacherId: yup.string().when('role', {
    is: 'teacher',
    then: (schema) => schema.required('Teacher ID is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  mobileNumber: yup.string().required('Mobile Number is required'),
});

const regInitial = { name: '', email: '', password: '', confirmPassword: '', role: 'student', universityId: '', teacherId: '', mobileNumber: '' };

/* ─── Component ──────────────────────────────────────────────────────── */
const Register = () => {
  const formik = useFormik({
    initialValues: regInitial,
    validationSchema: regSchema,
    onSubmit: (values) => handleSubmit(values),
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((s) => s.auth);
  const [register, { isLoading }] = useRegisterMutation();

  useEffect(() => { if (userInfo) navigate('/'); }, [navigate, userInfo]);

  const handleSubmit = async ({ name, email, password, confirmPassword, role, universityId, teacherId, mobileNumber }) => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    try {
      const res = await register({ name, email, password, role, universityId, teacherId, mobileNumber }).unwrap();
      dispatch(setCredentials({ ...res }));
      navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <PageContainer title="Register — SAAN AI" description="Create your account">
      <RegisterAnimStyles />

      <Box
        sx={{
          minHeight: '100dvh',
          display: 'flex',
          position: 'relative',
          overflowX: 'hidden',
          overflowY: 'auto',
          backgroundColor: '#050014',
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, #0c0330 0%, #050014 100%)
          `,
          backgroundSize: '40px 40px, 40px 40px, 100% 100%',
          backgroundPosition: 'center center',
        }}
      >
        {/* ── Aurora blobs ──────────────────────────────────── */}
        <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[
            { top: '50%', left: '-10%', size: 600, color: 'rgba(236,72,153,0.3)', anim: 'regAuroraOne 14s ease-in-out infinite' },
            { top: '-10%', left: '40%', size: 500, color: 'rgba(108,99,255,0.3)', anim: 'regAuroraTwo 12s ease-in-out infinite' },
            { top: '30%', left: '70%', size: 450, color: 'rgba(0,212,170,0.25)', anim: 'regAuroraOne 18s ease-in-out infinite reverse' },
          ].map((b, i) => (
            <Box
              key={i}
              sx={{
                position: 'absolute', top: b.top, left: b.left,
                width: b.size, height: b.size, borderRadius: '50%',
                background: `radial-gradient(circle, ${b.color} 0%, transparent 70%)`,
                filter: 'blur(55px)',
                animation: b.anim,
              }}
            />
          ))}
        </Box>

        {/* ── Stars ──────────────────────────────────────────── */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {REG_STARS.map((s) => (
            <Box
              key={s.id}
              sx={{
                position: 'absolute', top: s.top, left: s.left,
                width: s.size, height: s.size,
                borderRadius: '50%', bgcolor: '#fff',
                animation: `regTwinkle ${s.dur} ${s.delay} ease-in-out infinite`,
              }}
            />
          ))}
        </Box>

        {/* ── Main layout ────────────────────────────────────── */}
        <Box
          sx={{
            position: 'relative', zIndex: 1, width: '100%',
            display: 'flex', flexDirection: { xs: 'column', lg: 'row' },
            alignItems: 'center', justifyContent: 'center',
            px: { xs: 2, lg: 0 }, py: { xs: 6, lg: 4 }, gap: { xs: 4, lg: 0 },
          }}
        >
          {/* ── LEFT: Register card ─────────────────────────── */}
          <Box
            sx={{
              width: { xs: '100%', sm: 600, lg: 650 },
              flexShrink: 0,
              px: { xs: 0, lg: 6 },
              animation: 'regSlideLeft 0.75s cubic-bezier(0.22,1,0.36,1) 0.1s both',
            }}
          >
            {/* Neon rotating border wrapper */}
            <Box
              sx={{
                position: 'relative', borderRadius: '26px', p: '1.5px',
                background: 'linear-gradient(135deg, #EC4899, #6C63FF, #00D4AA, #EC4899)',
                backgroundSize: '300% 300%',
                animation: 'regNeon 4s linear infinite',
                boxShadow: '0 0 40px rgba(236,72,153,0.30), 0 0 80px rgba(108,99,255,0.18)',
              }}
            >
              <Box
                sx={{
                  borderRadius: '25px',
                  background: 'rgba(8, 6, 28, 0.93)',
                  backdropFilter: 'blur(24px)',
                  p: { xs: 3.5, sm: 4.5 },
                }}
              >
                {/* Logo */}
                <Box display="flex" justifyContent="center" mb={0.5}>
                  <Logo />
                </Box>
                <Typography
                  textAlign="center" variant="body2" mb={3}
                  sx={{
                    background: 'linear-gradient(90deg, #EC4899, #A78BFA)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', fontWeight: 600, letterSpacing: '0.08em', fontSize: '0.72rem',
                  }}
                >
                  JOIN THE SAAN AI PLATFORM
                </Typography>

                {/* Dark-styled form */}
                <Box
                  sx={{
                    '& .MuiFormLabel-root': { color: 'rgba(255,255,255,0.55)' },
                    '& .MuiFormLabel-root.Mui-focused': { color: '#EC4899' },
                    '& .MuiOutlinedInput-root': {
                      color: '#fff',
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.13)' },
                      '&:hover fieldset': { borderColor: 'rgba(236,72,153,0.55)' },
                      '&.Mui-focused fieldset': { borderColor: '#EC4899' },
                    },
                    '& .MuiFormHelperText-root': { color: 'rgba(255,100,100,0.9)' },
                    '& .MuiSelect-icon': { color: 'rgba(255,255,255,0.4)' },
                    '& .MuiTypography-root:not(.MuiFormHelperText-root)': { color: 'rgba(255,255,255,0.75)' },
                    '& .MuiButton-containedPrimary': {
                      background: 'linear-gradient(90deg, #EC4899 0%, #6C63FF 100%)',
                      backgroundSize: '200% auto',
                      transition: 'background-position 0.4s',
                      boxShadow: '0 4px 20px rgba(236,72,153,0.4)',
                      fontWeight: 700, borderRadius: '12px',
                      '&:hover': { backgroundPosition: 'right center', boxShadow: '0 4px 32px rgba(236,72,153,0.65)' },
                    },
                  }}
                >
                  <AuthRegister
                    formik={formik}
                    subtext={null}
                    subtitle={
                      <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
                        <Typography color="rgba(255,255,255,0.4)" variant="body2" fontWeight={500}>
                          Already have an account?
                        </Typography>
                        <Typography
                          component={Link}
                          to="/auth/login"
                          fontWeight={600} variant="body2"
                          sx={{ textDecoration: 'none', color: '#EC4899 !important' }}
                        >
                          Sign In
                        </Typography>
                        {isLoading && <Loader />}
                      </Stack>
                    }
                  />
                </Box>
              </Box>
            </Box>

            <Typography
              textAlign="center" variant="caption"
              color="rgba(255,255,255,0.18)" mt={2.5} display="block"
            >
              By creating an account, you agree to SAAN AI's Terms & Privacy Policy
            </Typography>
          </Box>

          {/* ── RIGHT: Info panel ──────────────────────────── */}
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', lg: 'flex' },
              flexDirection: 'column',
              justifyContent: 'center',
              px: 8,
              animation: 'regSlideLeft 0.9s cubic-bezier(0.22,1,0.36,1) 0.2s reverse both',
            }}
          >
            {/* Hexagon orb */}
            <Box
              sx={{
                width: 160, height: 160, mb: 5,
                borderRadius: '32px',
                background: 'linear-gradient(135deg, #EC4899 0%, #6C63FF 50%, #00D4AA 100%)',
                animation: 'hexFloat 5.5s ease-in-out infinite',
                boxShadow: '0 0 60px rgba(236,72,153,0.45), 0 0 120px rgba(108,99,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '4rem',
              }}
            >
              ✨
            </Box>

            <Typography
              variant="h2" fontWeight={900} mb={1}
              sx={{
                background: 'linear-gradient(90deg, #fff 0%, #EC4899 40%, #A78BFA 80%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', lineHeight: 1.1,
              }}
            >
              Join SAAN AI
            </Typography>
            <Typography variant="h6" color="rgba(255,255,255,0.5)" mb={6} fontWeight={400}>
              Start your journey to smarter exams today
            </Typography>

            {/* Steps */}
            {[
              { step: '01', title: 'Create Account', desc: 'Fill in your details to get started instantly.' },
              { step: '02', title: 'Explore Exams', desc: 'Browse available exams and pick your challenge.' },
              { step: '03', title: 'Track Results', desc: 'View your scores and improve with each attempt.' },
            ].map((s, i) => (
              <Box
                key={s.step}
                sx={{
                  display: 'flex', gap: 3, mb: 3.5,
                  animation: `regSlideLeft 0.6s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.12}s reverse both`,
                }}
              >
                <Typography
                  variant="h4" fontWeight={900}
                  sx={{
                    background: 'linear-gradient(135deg, #EC4899, #A78BFA)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text', lineHeight: 1, flexShrink: 0,
                  }}
                >
                  {s.step}
                </Typography>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#fff">{s.title}</Typography>
                  <Typography variant="body2" color="rgba(255,255,255,0.45)">{s.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
};

export default Register;
