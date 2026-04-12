import React, { useEffect, useState } from 'react';
import { Grid, Box, Card, Typography, CircularProgress } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import ExamForm from './components/ExamForm';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetExamByIdQuery, useUpdateExamMutation } from '../../slices/examApiSlice.js';

const examValidationSchema = yup.object({
  examName: yup.string().required('Exam Name is required'),
  examType: yup.string().oneOf(['objective', 'subjective', 'both']).required('Exam Type is required'),
  allowedAttempts: yup
    .number()
    .typeError('Allowed Attempts must be a number')
    .integer('Allowed Attempts must be an integer')
    .min(1, 'Allowed Attempts must be at least 1')
    .required('Allowed Attempts is required'),
  totalQuestions: yup
    .number()
    .typeError('Total Number of Questions must be a number')
    .integer('Total Number of Questions must be an integer')
    .positive('Total Number of Questions must be positive')
    .required('Total Number of Questions is required'),
  duration: yup
    .number()
    .typeError('Exam Duration must be a number')
    .integer('Exam Duration must be an integer')
    .min(1, 'Exam Duration must be at least 1 minute')
    .required('Exam Duration is required'),
  liveDate: yup.date().required('Live Date and Time is required'),
  deadDate: yup.date().required('Dead Date and Time is required'),
});

const EditExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { data: examData, isLoading, isError } = useGetExamByIdQuery(examId);
  const [updateExam] = useUpdateExamMutation();
  const [initialValues, setInitialValues] = useState(null);

  useEffect(() => {
    if (examData) {
      // Format dates for html datetime-local input
      const formatHtmlDateTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      };

      setInitialValues({
        examName: examData.examName || '',
        examType: examData.examType || 'objective',
        allowedAttempts: examData.allowedAttempts || 1,
        totalQuestions: examData.totalQuestions || '',
        duration: examData.duration || '',
        liveDate: formatHtmlDateTime(examData.liveDate),
        deadDate: formatHtmlDateTime(examData.deadDate),
        requiresThirdEye: examData.requiresThirdEye || false,
        allowNegativeMarking: examData.allowNegativeMarking || false,
        negativeMarks: examData.negativeMarks || 1,
        description: examData.description || '',
        allowedUsers: examData.allowedUsers ? examData.allowedUsers.join(', ') : '',
      });
    }
  }, [examData]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues || {
      // Fallback empty structure while loading
      examName: '', examType: 'objective', allowedAttempts: 1, totalQuestions: '', duration: '',
      liveDate: '', deadDate: '', requiresThirdEye: false, allowNegativeMarking: false,
      negativeMarks: 1, description: '', allowedUsers: '',
    },
    validationSchema: examValidationSchema,
    onSubmit: async (values) => {
      try {
        await updateExam({ id: examId, ...values }).unwrap();
        toast.success('Exam Updated successfully!');
        navigate('/dashboard'); // Go back to dashboard after editing
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'Failed to update exam');
      }
    },
  });

  if (isLoading) {
    return (
      <PageContainer title="Edit Exam">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer title="Error">
        <Typography color="error" align="center" mt={4}>Failed to load exam. Please try again.</Typography>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Edit Exam" description="Modify an existing exam">
      <Box
        sx={{
          position: 'relative',
          '&:before': {
            content: '""',
            background: 'radial-gradient(#d2f1df, #d3d7fa, #bad8f4)',
            backgroundSize: '400% 400%',
            animation: 'gradient 15s ease infinite',
            position: 'absolute',
            height: '100%',
            width: '100%',
            opacity: '0.3',
          },
        }}
      >
        <Grid container spacing={0} justifyContent="center" sx={{ minHeight: '100vh', py: { xs: 4, md: 8 } }}>
          <Grid item xs={12} sm={12} lg={10} xl={8} display="flex" justifyContent="center" alignItems="center">
            <Card elevation={9} sx={{ p: 4, zIndex: 1, width: '100%', maxWidth: '900px', borderRadius: '16px' }}>
              <ExamForm
                formik={formik}
                onSubmit={formik.handleSubmit}
                title={
                  <Typography variant="h3" textAlign="center" color="textPrimary" mb={1}>
                    Edit Exam
                  </Typography>
                }
              />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default EditExamPage;
