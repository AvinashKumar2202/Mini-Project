import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Stack,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import swal from 'sweetalert';
import { useCreateQuestionMutation, useGetExamsQuery } from 'src/slices/examApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';

const AddQuestionForm = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState([false, false, false, false]);
  const [selectedExamId, setSelectedExamId] = useState(null);

  const { userInfo } = useSelector((state) => state.auth);

  const handleOptionChange = (index) => {
    const updatedCorrectOptions = [...correctOptions];
    updatedCorrectOptions[index] = !correctOptions[index];
    setCorrectOptions(updatedCorrectOptions);
  };

  const [createQuestion, { isLoading }] = useCreateQuestionMutation();
  const { data: examsData } = useGetExamsQuery();

  // Filter to only show exams created by the current teacher, newest first
  // Note: backend populates createdBy as an object { _id, name, email }
  const myExams = examsData
    ? [...examsData]
      .filter((exam) => exam.createdBy?._id === userInfo?._id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(() => {
    if (myExams.length > 0 && !selectedExamId) {
      setSelectedExamId(myExams[0]._id);
    }
  }, [myExams, selectedExamId]);

  const handleAddQuestion = async () => {
    if (newQuestion.trim() === '' || newOptions.some((option) => option.trim() === '')) {
      swal('', 'Please fill out the question and all options.', 'error');
      return;
    }

    if (!correctOptions.some((isCorrect) => isCorrect)) {
      swal('', 'Please select at least one correct option before adding the question.', 'error');
      return;
    }

    const newQuestionObj = {
      question: newQuestion,
      options: newOptions.map((option, index) => ({
        optionText: option,
        isCorrect: correctOptions[index],
      })),
      examId: selectedExamId,
    };

    try {
      const res = await createQuestion(newQuestionObj).unwrap();
      if (res) {
        toast.success('Question added successfully!!!');
      }
      setQuestions([...questions, res]);
      setNewQuestion('');
      setNewOptions(['', '', '', '']);
      setCorrectOptions([false, false, false, false]);
    } catch (err) {
      swal('', 'Failed to create question. Please try again.', 'error');
    }
  };

  const handleSubmitQuestions = () => {
    setQuestions([]);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
  };

  return (
    <div>
      <Select
        label="Select Exam"
        value={selectedExamId || ''}
        onChange={(e) => {
          console.log(e.target.value, 'option ID');
          setSelectedExamId(e.target.value);
        }}
        fullWidth
        sx={{ mb: 2 }}
      >
        {myExams.length === 0 ? (
          <MenuItem disabled>No exams found. Create one first.</MenuItem>
        ) : (
          myExams.map((exam) => (
            <MenuItem key={exam._id} value={exam._id}>
              <Stack direction="column">
                <Typography variant="body1">{exam.examName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Created: {formatDate(exam.createdAt)}
                </Typography>
              </Stack>
            </MenuItem>
          ))
        )}
      </Select>

      {questions.map((questionObj, questionIndex) => (
        <div key={questionIndex}>
          <TextField
            label={`Question ${questionIndex + 1}`}
            value={questionObj.question}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
          />
          {questionObj.options.map((option, optionIndex) => (
            <div key={optionIndex}>
              <TextField
                label={`Option ${optionIndex + 1}`}
                value={option.optionText}
                fullWidth
                InputProps={{
                  readOnly: true,
                }}
              />
              <FormControlLabel
                control={<Checkbox checked={option.isCorrect} disabled />}
                label={`Correct Option ${optionIndex + 1}`}
              />
            </div>
          ))}
        </div>
      ))}

      <TextField
        label="New Question"
        value={newQuestion}
        onChange={(e) => setNewQuestion(e.target.value)}
        fullWidth
        rows={4}
        sx={{ mb: 1 }}
      />

      {newOptions.map((option, index) => (
        <Stack
          key={index}
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
          mb={1}
        >
          <TextField
            label={`Option ${index + 1}`}
            value={newOptions[index]}
            onChange={(e) => {
              const updatedOptions = [...newOptions];
              updatedOptions[index] = e.target.value;
              setNewOptions(updatedOptions);
            }}
            fullWidth
            sx={{ flex: '80%' }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={correctOptions[index]}
                onChange={() => handleOptionChange(index)}
              />
            }
            label={`Correct Option ${index + 1}`}
          />
        </Stack>
      ))}

      <Stack mt={2} direction="row" spacing={2}>
        <Button variant="outlined" onClick={handleAddQuestion}>
          Add Question
        </Button>
        <Button variant="outlined" onClick={handleSubmitQuestions}>
          Submit Questions
        </Button>
      </Stack>
    </div>
  );
};

export default AddQuestionForm;
