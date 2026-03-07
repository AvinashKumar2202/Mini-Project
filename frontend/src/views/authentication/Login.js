import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Box, Card, Typography, Stack } from '@mui/material';

import PageContainer from 'src/components/container/PageContainer';
import Logo from 'src/layouts/full/shared/logo/Logo';
import AuthLogin from './auth/AuthLogin';

import { useFormik } from 'formik';
import * as yup from 'yup';
import { useDispatch, useSelector } from 'react-redux';
import { useLoginMutation } from './../../slices/usersApiSlice';
import { setCredentials } from './../../slices/authSlice';
import { toast } from 'react-toastify';
import Loader from './Loader';

const userValidationSchema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(2).required('Password is required'),
});
const initialUserValues = { email: '', password: '' };

const Login = () => {
  const formik = useFormik({
    initialValues: initialUserValues,
    validationSchema: userValidationSchema,
    onSubmit: (values) => handleSubmit(values),
  });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  const [login, { isLoading }] = useLoginMutation();

  useEffect(() => {
    if (userInfo) navigate('/');
  }, [navigate, userInfo]);

  const handleSubmit = async ({ email, password }) => {
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials({ ...res }));
      formik.resetForm();
      const redir = JSON.parse(localStorage.getItem('redirectLocation'));
      if (redir) { localStorage.removeItem('redirectLocation'); navigate(redir.pathname); }
      else navigate('/');
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <PageContainer title="Login — SAAN AI" description="Sign in to your account">
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
        <Card elevation={3} sx={{ p: 4, width: '100%', maxWidth: 440, borderRadius: '16px' }}>
          {/* Logo */}
          <Box display="flex" justifyContent="center" mb={2}>
            <Logo />
          </Box>

          <Typography variant="h5" fontWeight={700} textAlign="center" mb={0.5}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Sign in to your SAAN AI account
          </Typography>

          <AuthLogin
            formik={formik}
            subtext={null}
            subtitle={
              <Stack direction="row" spacing={1} justifyContent="center" mt={3}>
                <Typography color="text.secondary" variant="body2">
                  New to SAAN AI?
                </Typography>
                <Typography
                  component={Link}
                  to="/auth/register"
                  fontWeight={600}
                  variant="body2"
                  sx={{ textDecoration: 'none', color: 'primary.main' }}
                >
                  Create an account
                </Typography>
                {isLoading && <Loader />}
              </Stack>
            }
          />
        </Card>
      </Box>
    </PageContainer>
  );
};

export default Login;
