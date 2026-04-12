import React from 'react';
import { Grid, Box, Card, Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import ExamForm from './components/ExamForm';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { useCreateExamMutation } from '../../slices/examApiSlice.js';

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

const CreateExamPage = () => {
  const initialExamValues = {
    examName: '',
    examType: 'objective',
    allowedAttempts: 1,
    totalQuestions: '',
    duration: '',
    liveDate: '',
    deadDate: '',
    requiresThirdEye: false,
    allowNegativeMarking: false,
    negativeMarks: 1,
    description: '',
    allowedUsers: '',
  };

  const formik = useFormik({
    initialValues: initialExamValues,
    validationSchema: examValidationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const [createExam] = useCreateExamMutation();

  const handleSubmit = async (values) => {
    try {
      await createExam(values).unwrap();
      toast.success('Exam Created successfully');
      formik.resetForm();
    } catch (err) {
      toast.error(err?.data?.message || err.error);
    }
  };

  return (
    <PageContainer title="Create Exam" description="Create a new exam">
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
          <Grid
            item
            xs={12}
            sm={12}
            lg={10}
            xl={8}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Card elevation={9} sx={{ p: 4, zIndex: 1, width: '100%', maxWidth: '900px', borderRadius: '16px' }}>
              <ExamForm
                formik={formik}
                onSubmit={handleSubmit}
                title={
                  <Typography variant="h3" textAlign="center" color="textPrimary" mb={1}>
                    Create Exam
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

export default CreateExamPage;
