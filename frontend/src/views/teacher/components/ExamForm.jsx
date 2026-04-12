import React from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  Stack,
  MenuItem,
  Grid,
} from '@mui/material';
import PhonelinkRoundedIcon from '@mui/icons-material/PhonelinkRounded';

const CreateExam = ({ formik, title, subtitle, subtext }) => {
  const { values, errors, touched, handleBlur, handleChange, handleSubmit } = formik;

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h2" mb={3}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Box component="form">
        <Grid container spacing={3}>
          
          {/* Section 1: Basic Details */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="600" color="primary">
              1. Basic Details
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              id="examName"
              name="examName"
              label="Exam Name"
              variant="outlined"
              value={values.examName}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.examName && errors.examName ? true : false}
              helperText={touched.examName && errors.examName ? errors.examName : null}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              id="examType"
              name="examType"
              select
              label="Exam Type"
              value={values.examType}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.examType && errors.examType ? true : false}
              helperText={touched.examType && errors.examType ? errors.examType : null}
              fullWidth
              required
            >
              <MenuItem value="objective">Objective (Multiple Choice)</MenuItem>
              <MenuItem value="subjective">Subjective (Text Answer)</MenuItem>
              <MenuItem value="both">Both</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12}>
            <TextField
              id="description"
              name="description"
              label="Exam Instructions / Description (Optional)"
              variant="outlined"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.description && errors.description ? true : false}
              helperText={touched.description && errors.description ? errors.description : null}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>

          {/* Section 2: Configuration */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="600" color="primary" mt={2}>
              2. Configuration
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              id="totalQuestions"
              name="totalQuestions"
              label="Questions per Student (Subset Limit)"
              type="number"
              variant="outlined"
              value={values.totalQuestions}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.totalQuestions && errors.totalQuestions ? true : false}
              helperText={touched.totalQuestions && errors.totalQuestions ? errors.totalQuestions : "Randomly picks this many questions from your bank for every attempt."}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              id="duration"
              name="duration"
              label="Duration (minutes)"
              type="number"
              variant="outlined"
              value={values.duration}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.duration && errors.duration ? true : false}
              helperText={touched.duration && errors.duration ? errors.duration : null}
              fullWidth
              required
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              id="allowedAttempts"
              name="allowedAttempts"
              label="Allowed Attempts per Student"
              type="number"
              variant="outlined"
              value={values.allowedAttempts}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.allowedAttempts && errors.allowedAttempts ? true : false}
              helperText={touched.allowedAttempts && errors.allowedAttempts ? errors.allowedAttempts : null}
              fullWidth
              required
            />
          </Grid>

          {/* Section 3: Scheduling */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="600" color="primary" mt={2}>
              3. Scheduling
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              id="liveDate"
              name="liveDate"
              label="Live Date and Time"
              type="datetime-local"
              variant="outlined"
              value={values.liveDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.liveDate && errors.liveDate ? true : false}
              helperText={touched.liveDate && errors.liveDate ? errors.liveDate : null}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              id="deadDate"
              name="deadDate"
              label="Dead Date and Time"
              type="datetime-local"
              variant="outlined"
              value={values.deadDate}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.deadDate && errors.deadDate ? true : false}
              helperText={touched.deadDate && errors.deadDate ? errors.deadDate : null}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Section 4: Access & Security */}
          <Grid item xs={12}>
            <Typography variant="h6" fontWeight="600" color="primary" mt={2}>
              4. Access & Security
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              id="allowedUsers"
              name="allowedUsers"
              label="Allowed Students (UIDs/Emails)"
              placeholder="e.g. jdoe123, student@school.edu"
              variant="outlined"
              value={values.allowedUsers || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              error={touched.allowedUsers && errors.allowedUsers ? true : false}
              helperText={
                touched.allowedUsers && errors.allowedUsers
                  ? errors.allowedUsers
                  : "Optional: Leave empty to allow ALL students. Separate multiple line inputs with commas."
              }
              fullWidth
              multiline
              rows={2}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            {/* Third Eye Toggle */}
            <Box
              sx={{
                p: 2, height: '100%',
                borderRadius: '12px',
                border: values.requiresThirdEye
                  ? '1.5px solid rgba(108,99,255,0.4)'
                  : '1.5px solid rgba(0,0,0,0.12)',
                background: values.requiresThirdEye
                  ? 'linear-gradient(135deg,rgba(108,99,255,0.06),rgba(0,212,170,0.04))'
                  : 'transparent',
                transition: 'all 0.3s ease',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" height="100%">
                <Stack direction="row" alignItems="center" spacing={1.5}>
                  <PhonelinkRoundedIcon
                    sx={{ color: values.requiresThirdEye ? '#6C63FF' : 'text.secondary', fontSize: 22, transition: 'color 0.3s' }}
                  />
                  <Box>
                    <Typography variant="body2" fontWeight={700} color={values.requiresThirdEye ? 'primary' : 'text.primary'}>
                      Require Third Eye
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Students scan a QR to stream room camera
                    </Typography>
                  </Box>
                </Stack>
                <Switch
                  name="requiresThirdEye"
                  checked={!!values.requiresThirdEye}
                  onChange={(e) => formik.setFieldValue('requiresThirdEye', e.target.checked)}
                  color="primary"
                />
              </Stack>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            {/* Negative Marking Toggle */}
            <Box
              sx={{
                p: 2, height: '100%',
                borderRadius: '12px',
                border: values.allowNegativeMarking
                  ? '1.5px solid rgba(255,107,107,0.4)'
                  : '1.5px solid rgba(0,0,0,0.12)',
                background: values.allowNegativeMarking
                  ? 'linear-gradient(135deg,rgba(255,107,107,0.06),rgba(238,82,83,0.04))'
                  : 'transparent',
                transition: 'all 0.3s ease',
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" fontWeight={700} color={values.allowNegativeMarking ? 'error' : 'text.primary'}>
                    Enable Negative Marking
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Deduct penalty for incorrect
                  </Typography>
                </Box>
                <Switch
                  name="allowNegativeMarking"
                  checked={!!values.allowNegativeMarking}
                  onChange={(e) => formik.setFieldValue('allowNegativeMarking', e.target.checked)}
                  color="error"
                />
              </Stack>

              {values.allowNegativeMarking && (
                <TextField
                  id="negativeMarks"
                  name="negativeMarks"
                  label="Penalty Marks"
                  type="number"
                  variant="outlined"
                  size="small"
                  value={values.negativeMarks}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.negativeMarks && errors.negativeMarks ? true : false}
                  helperText={touched.negativeMarks && errors.negativeMarks ? errors.negativeMarks : "e.g., 0.25, 1"}
                  inputProps={{ step: "any", min: "0" }}
                  sx={{ mt: 2, bgcolor: 'background.paper', borderRadius: '8px' }}
                  fullWidth
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} mt={2}>
            <Button color="primary" variant="contained" size="large" fullWidth onClick={handleSubmit} sx={{ py: 1.5, fontSize: '1.1rem', fontWeight: 600 }}>
              Create Exam
            </Button>
          </Grid>

        </Grid>
      </Box>

      {subtitle}
    </>
  );
};

export default CreateExam;
