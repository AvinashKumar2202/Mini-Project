import React from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';

/**
 * ExamLayout
 * Intentionally has NO header/sidebar so students cannot navigate away.
 * The exam page itself enforces fullscreen via useExamLockdown.
 */
const ExamLayout = () => {
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        overflow: 'auto',
        bgcolor: 'background.default',
      }}
    >
      <Outlet />
    </Box>
  );
};

export default ExamLayout;

