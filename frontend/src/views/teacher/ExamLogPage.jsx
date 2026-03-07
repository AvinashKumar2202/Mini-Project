import React from 'react';
import { Box, Typography, Stack, Chip } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import CheatingTable from './components/CheatingTable';
import { IconReportAnalytics, IconShieldCheck } from '@tabler/icons-react';

const ExamLogPage = () => {
  return (
    <PageContainer title="Exam Logs" description="Monitor student exam integrity and cheating activity">
      <DashboardCard
        title={
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'linear-gradient(135deg,#6C63FF,#A78BFA)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both',
              }}
            >
              <IconReportAnalytics size={20} color="#fff" />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700}>Exam Integrity Logs</Typography>
              <Typography variant="caption" color="text.secondary">
                All recorded proctoring events for student exams
              </Typography>
            </Box>
          </Stack>
        }
      >
        {/* Info banners */}
        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
          {[
            { icon: <IconShieldCheck size={14} />, label: 'Proctored Exam System', color: '#6C63FF' },
            { icon: <IconReportAnalytics size={14} />, label: 'AI Face Detection Active', color: '#00D4AA' },
          ].map((badge) => (
            <Chip
              key={badge.label}
              icon={badge.icon}
              label={badge.label}
              size="small"
              sx={{
                fontWeight: 600, fontSize: '0.72rem',
                bgcolor: `${badge.color}14`,
                color: badge.color,
                border: `1px solid ${badge.color}33`,
              }}
            />
          ))}
        </Stack>

        <CheatingTable />
      </DashboardCard>
    </PageContainer>
  );
};

export default ExamLogPage;
