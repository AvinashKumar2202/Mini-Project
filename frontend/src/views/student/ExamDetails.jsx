import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  List,
  ListItemText,
  Stack,
  Typography,
  GlobalStyles,
  Box,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { IconArrowLeft } from '@tabler/icons-react';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import { uniqueId } from 'lodash';
import * as React from 'react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useGetQuestionsQuery, useGetExamsQuery, useGetMySubmissionsQuery } from 'src/slices/examApiSlice';
import useBattery from 'src/hooks/useBattery';

/* Hero image zoom animation */
const ExamDetailsAnimStyles = () => (
  <GlobalStyles
    styles={{
      '@keyframes heroZoom': {
        from: { transform: 'scale(1.06)' },
        to: { transform: 'scale(1)' },
      },
      '@keyframes startBtnGlow': {
        '0%, 100%': { boxShadow: '0 0 0 0 rgba(108,99,255,0)' },
        '50%': { boxShadow: '0 0 24px 8px rgba(108,99,255,0.50)' },
      },
    }}
  />
);

const DescriptionAndInstructions = () => {
  const navigate = useNavigate();

  const { examId } = useParams();
  const { data: questions, isLoading } = useGetQuestionsQuery(examId);
  const { data: exams = [] } = useGetExamsQuery();
  const { data: submissions = [] } = useGetMySubmissionsQuery();

  const currentExam = exams.find((e) => e._id === examId);
  const questionCount = questions ? questions.length : 0;
  const examDuration = currentExam?.duration || 0;
  const examName = currentExam?.examName || 'Exam';

  const userAttempts = submissions.filter((s) => (s.examId?._id || s.examId) === examId).length;
  const allowedAttempts = currentExam?.allowedAttempts || 1;
  const hasExhaustedAttempts = userAttempts >= allowedAttempts;

  const testId = uniqueId();
  const [certify, setCertify] = useState(false);
  const handleCertifyChange = () => {
    setCertify(!certify);
  };

  const { batteryLevel, isCharging, supported: batterySupported } = useBattery();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isBatterySafe = !batterySupported || batteryLevel === null || batteryLevel > 25 || isCharging;
  const isSystemReady = isOnline && isBatterySafe && !hasExhaustedAttempts;

  const handleTest = () => {
    const isValid = true;
    console.log('Test link');
    if (isValid) {
      navigate(`/exam/${examId}/${testId}`);
    } else {
      toast.error('Test date is not valid.');
    }
  };

  return (
    <Card sx={{ animation: 'fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both' }}>
      <CardContent>
        <Button
          variant="text"
          color="primary"
          startIcon={<IconArrowLeft size={18} />}
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
        >
          Go Back
        </Button>
        <Typography variant="h2" mb={3}>
          {examName}
        </Typography>
        <Typography>
          This practice test will allow you to measure your skills by
          the way of various multiple choice questions. We recommend you to score at least 75% in
          this test before moving to the next level questionnaire. It will help you in identifying
          your strength and development areas.
        </Typography>

        <Typography mt={1}>#MCQ #OnlineExam #Proctored</Typography>

        {currentExam?.description && (
          <Box mt={3} p={2} sx={{ bgcolor: 'rgba(108,99,255,0.05)', borderRadius: '8px', borderLeft: '4px solid #6C63FF' }}>
            <Typography variant="h6" mb={1} color="primary">Exam Description</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {currentExam.description}
            </Typography>
          </Box>
        )}

        <>
          {hasExhaustedAttempts && (
            <Box mt={3} p={2} sx={{ bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
              <Typography variant="h6" mb={1} color="error">Attempts Exhausted</Typography>
              <Typography variant="body2">
                You have already submitted this exam <strong>{userAttempts}</strong> time{userAttempts !== 1 ? 's' : ''}. You are not allowed to take it again because the maximum allowed attempts is <strong>{allowedAttempts}</strong>.
              </Typography>
            </Box>
          )}

          <Typography variant="h3" mb={3} mt={3}>
            Test Instructions
            <Box component="span" sx={{ float: 'right', fontSize: '1rem', fontWeight: 600, color: hasExhaustedAttempts ? 'error.main' : 'success.main', mt: 0.5 }}>
              Attempts: {userAttempts} / {allowedAttempts}
            </Box>
          </Typography>
          <List>
            <ol>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    This Practice Test consists of only <strong>MCQ questions.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    There are a total of <strong>{questionCount} questions.</strong> Test Duration is{' '}
                    <strong>{examDuration} minutes.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    {currentExam?.allowNegativeMarking ? (
                      <>There is <strong>Negative Marking</strong> for wrong answers ({currentExam?.negativeMarks || 1} mark(s) deducted per wrong answer).</>
                    ) : (
                      <>There is <strong>No Negative Marking</strong> for wrong answers.</>
                    )}
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    <strong>Do Not switch tabs </strong> while taking the test.
                    <strong> Switching Tabs will Block / End the test automatically.</strong>
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    The test will only run in <strong>full screen mode.</strong> Do not switch back
                    to tab mode. Test will end automatically.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    You may need to use blank sheets for rough work. Please arrange for blank sheets
                    before starting.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Clicking on Back or Next will save the answer.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Questions can be reattempted till the time test is running.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    Click on the finish test once you are done with the test.
                  </Typography>
                </ListItemText>
              </li>
              <li>
                <ListItemText>
                  <Typography variant="body1">
                    You will be able to view the scores once your test is complete.
                  </Typography>
                </ListItemText>
              </li>
            </ol>
          </List>
        </>

        <Typography variant="h3" mb={3} mt={3}>
          System Pre-Check Validation
        </Typography>
        <Stack spacing={2} mb={3}>
          <Box sx={{ p: 2, borderRadius: '10px', border: '1px solid', borderColor: isOnline ? 'success.main' : 'error.main', bgcolor: isOnline ? 'rgba(0,212,170,0.05)' : 'rgba(239,68,68,0.05)' }}>
             <Typography fontWeight={700} color={isOnline ? 'success.main' : 'error.main'}>
                Network Status: {isOnline ? 'Active (Connected)' : 'Disconnected (Offline)'}
             </Typography>
             {!isOnline && <Typography variant="caption" color="error">You must have an active internet connection to start the exam.</Typography>}
          </Box>
          <Box sx={{ p: 2, borderRadius: '10px', border: '1px solid', borderColor: isBatterySafe ? 'success.main' : 'error.main', bgcolor: isBatterySafe ? 'rgba(0,212,170,0.05)' : 'rgba(239,68,68,0.05)' }}>
             <Typography fontWeight={700} color={isBatterySafe ? 'success.main' : 'error.main'}>
                Battery Health: {batterySupported && batteryLevel !== null ? `${Math.round(batteryLevel)}% ${isCharging ? '(Charging)' : ''}` : 'Unknown (Supported)'}
             </Typography>
             {!isBatterySafe && <Typography variant="caption" color="error">Your battery is critically low (≤25%). Please plug in your charger to unlock the exam button.</Typography>}
          </Box>
        </Stack>

        <Typography variant="h3" mb={3} mt={3}>
          Confirmation
        </Typography>
        <Typography mb={3}>
          Your actions shall be proctored and any signs of wrongdoing may lead to suspension or
          cancellation of your test.
        </Typography>
        <Stack direction="column" alignItems="center" spacing={3}>
          <FormControlLabel
            control={<Checkbox checked={certify} onChange={handleCertifyChange} color="primary" />}
            label="I certify that I have carefully read and agree to all of the instructions mentioned above"
          />
          <Button
            variant="contained"
            color="primary"
            disabled={!certify || !isSystemReady}
            onClick={handleTest}
            sx={{
              /* Animated glow pulse when enabled */
              animation: (certify && !hasExhaustedAttempts) ? 'startBtnGlow 1.8s ease-in-out infinite' : 'none',
              transition: 'transform 0.18s ease',
              '&:not(:disabled):hover': { transform: 'scale(1.04)' },
              borderRadius: '12px',
              px: 4,
              py: 1.2,
              fontWeight: 700,
            }}
          >
            Start Test
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/dashboard')}
          >
            Go Back
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

const imgUrl =
  'https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80';

export default function ExamDetails() {
  return (
    <>
      <ExamDetailsAnimStyles />
      <Grid container sx={{ height: '100vh' }}>
        <Grid
          item
          xs={false}
          sm={4}
          md={7}
          sx={{
            overflow: 'hidden',
            backgroundColor: (t) =>
              t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          }}
        >
          {/* Hero image with zoom-in effect on load */}
          <Box
            component="img"
            src={imgUrl}
            alt="exam banner"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              animation: 'heroZoom 1.2s cubic-bezier(0.22,1,0.36,1) forwards',
              transformOrigin: 'center',
            }}
          />
        </Grid>
        <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
          <DescriptionAndInstructions />
        </Grid>
      </Grid>
    </>
  );
}
