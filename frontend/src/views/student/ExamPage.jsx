import React from 'react';
import { Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import Exams from './Components/Exams';

const ExamPage = () => {
  return (
    <PageContainer title="Exam Page" description="Active & Upcoming Exams">
      <DashboardCard title="Active & Upcoming Exams">
        <Exams />
      </DashboardCard>
    </PageContainer>
  );
};

export default ExamPage;
