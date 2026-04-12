import React from 'react';
import { Typography } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import AddQuestionForm from './components/AddQuestionForm';

const AddQuestions = () => {
  return (
    <PageContainer title="Manage Exam Questions" description="Add, import, and manage questions for your exams.">
      <DashboardCard title="Question Management Center">
        <AddQuestionForm />
      </DashboardCard>
    </PageContainer>
  );
};

export default AddQuestions;
