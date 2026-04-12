import React, { useState } from 'react';
import { Box, Typography, Button, Select, MenuItem, Grid, InputAdornment, LinearProgress } from '@mui/material';
import { IconUser, IconMail, IconLock, IconId, IconDeviceMobile, IconKey, IconEye, IconEyeOff } from '@tabler/icons-react';

import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';
import { Stack } from '@mui/system';
import { useSendMobileOtpMutation, useVerifyMobileOtpMutation } from '../../../slices/usersApiSlice';
import { toast } from 'react-toastify';

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

const AuthRegister = ({ formik, title, subtitle, subtext }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit } = formik;

  const [sendOtp, { isLoading: isSendingOtp }] = useSendMobileOtpMutation();
  const [verifyOtp, { isLoading: isVerifyingOtp }] = useVerifyMobileOtpMutation();

  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isMobileVerified, setIsMobileVerified] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const strength = getStrength(values.password || '');

  const handleSendOtp = async () => {
    if (!values.mobileNumber) {
      toast.error('Please enter a mobile number first');
      return;
    }
    try {
      const res = await sendOtp({ mobileNumber: values.mobileNumber }).unwrap();
      setIsOtpSent(true);
      toast.success(res.message || 'OTP sent successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      toast.error('Please enter the OTP');
      return;
    }
    try {
      await verifyOtp({ mobileNumber: values.mobileNumber, otp: otpCode }).unwrap();
      setIsMobileVerified(true);
      toast.success('Mobile number verified successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Invalid OTP');
    }
  };

  const isSignUpDisabled = !isMobileVerified;
  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={1}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2} mb={3}>
          {/* Name Field */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="name" mb="5px" display="block">
              Name
            </Typography>
            <CustomTextField
              id="name"
              name="name"
              placeholder="Enter Your Name "
              variant="outlined"
              value={values.name}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.name && errors.name ? true : false}
              helperText={touched.name && errors.name ? errors.name : null}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconUser size={18} color="#6C63FF" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Email Field */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="email" mb="5px" display="block">
              Email Address
            </Typography>
            <CustomTextField
              id="email"
              name="email"
              variant="outlined"
              placeholder="Enter Your Email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.email && errors.email ? true : false}
              helperText={touched.email && errors.email ? errors.email : null}
              required
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconMail size={18} color="#6C63FF" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Password Field */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="password" mb="5px" display="block">
              Password
            </Typography>
            <CustomTextField
              id="password"
              name="password"
              type={showPw ? 'text' : 'password'}
              variant="outlined"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.password && errors.password ? true : false}
              helperText={touched.password && errors.password ? errors.password : null}
              required
              fullWidth
              sx={{ mb: values.password ? 0.5 : 0 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconLock size={18} color="#6C63FF" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={() => setShowPw(!showPw)}>
                    {showPw ? <IconEyeOff size={18} color="rgba(255,255,255,0.4)" /> : <IconEye size={18} color="rgba(255,255,255,0.4)" />}
                  </InputAdornment>
                ),
              }}
            />
            {/* Strength bar */}
            {values.password && (
              <Box mt={1} mb={0.5}>
                <LinearProgress
                  variant="determinate"
                  value={(strength / 4) * 100}
                  sx={{
                    height: 5, borderRadius: 2,
                    bgcolor: 'rgba(108,99,255,0.1)',
                    '& .MuiLinearProgress-bar': {
                      background: strengthColor[strength],
                      borderRadius: 2,
                      transition: 'width 0.4s ease',
                    },
                  }}
                />
                <Typography variant="caption" sx={{ color: strengthColor[strength], fontWeight: 600, display: 'block', mt: 0.5 }}>
                  {strengthLabel[strength]}
                </Typography>
              </Box>
            )}
          </Grid>

          {/* Confirm Password Field */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="confirmPassword" mb="5px" display="block">
              Confirm Password
            </Typography>
            <CustomTextField
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="false"
              variant="outlined"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.confirmPassword && errors.confirmPassword ? true : false}
              helperText={
                touched.confirmPassword && errors.confirmPassword ? errors.confirmPassword : null
              }
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <IconLock size={18} color="#6C63FF" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end" sx={{ cursor: 'pointer' }} onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <IconEyeOff size={18} color="rgba(255,255,255,0.4)" /> : <IconEye size={18} color="rgba(255,255,255,0.4)" />}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Role Selection */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="role" mb="5px" display="block">
              Role
            </Typography>
            <Select
              id="role"
              name="role"
              required
              displayEmpty
              value={values.role}
              onChange={handleChange}
              onBlur={handleBlur}
              error={!!(touched.role && errors.role)}
              fullWidth
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="teacher">Teacher</MenuItem>
            </Select>
          </Grid>

          {/* Conditional Fields for Student */}
          {values.role === 'student' && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="universityId" mb="5px" display="block">
                University ID / School ID
              </Typography>
              <CustomTextField
                id="universityId"
                name="universityId"
                placeholder="Enter Your University or School ID"
                variant="outlined"
                value={values.universityId}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.universityId && Boolean(errors.universityId)}
                helperText={touched.universityId && errors.universityId}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconId size={18} color="#00D4AA" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {/* Conditional Fields for Teacher */}
          {values.role === 'teacher' && (
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="teacherId" mb="5px" display="block">
                Teacher ID
              </Typography>
              <CustomTextField
                id="teacherId"
                name="teacherId"
                placeholder="Enter Your Teacher ID"
                variant="outlined"
                value={values.teacherId}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.teacherId && Boolean(errors.teacherId)}
                helperText={touched.teacherId && errors.teacherId}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconId size={18} color="#EC4899" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          )}

          {/* Mobile Verification (For All Users) */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="mobileNumber" mb="5px" display="block">
              Mobile Number
            </Typography>
            <Stack direction="row" spacing={2} alignItems="flex-start">
              <CustomTextField
                id="mobileNumber"
                name="mobileNumber"
                placeholder="Enter Mobile Number"
                variant="outlined"
                value={values.mobileNumber}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.mobileNumber && Boolean(errors.mobileNumber)}
                helperText={touched.mobileNumber && errors.mobileNumber}
                fullWidth
                required
                disabled={isMobileVerified}
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconDeviceMobile size={18} color="#6C63FF" />
                    </InputAdornment>
                  ),
                }}
              />
              {!isMobileVerified && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  sx={{ height: '43px', minWidth: '95px' }}
                >
                  {isSendingOtp ? 'Sending' : (isOtpSent ? 'Resend' : 'Send')}
                </Button>
              )}
            </Stack>
          </Grid>

          {isOtpSent && !isMobileVerified && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor="otpCode" mb="5px" display="block">
                Verification OTP
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <CustomTextField
                  id="otpCode"
                  name="otpCode"
                  placeholder="Enter 6-digit OTP"
                  variant="outlined"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  fullWidth
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconKey size={18} color="#00D4AA" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleVerifyOtp}
                  disabled={isVerifyingOtp}
                  sx={{ height: '43px', minWidth: '95px' }}
                >
                  Verify
                </Button>
              </Stack>
            </Grid>
          )}
        </Grid>
        <Button
          color="primary"
          variant="contained"
          size="large"
          fullWidth
          type="submit"
          disabled={isSignUpDisabled}
        >
          Sign Up
        </Button>
      </Box>
      {subtitle}
    </>
  );
};
export default AuthRegister;
