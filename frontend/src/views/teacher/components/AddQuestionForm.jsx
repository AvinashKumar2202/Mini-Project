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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Divider,
  Grid,
} from '@mui/material';
import swal from 'sweetalert';
import { 
  useCreateQuestionMutation, 
  useGetExamsQuery, 
  useGetQuestionsQuery, 
  useBulkImportQuestionsMutation,
  useAiParseQuestionsMutation,
  useCsvImportQuestionsMutation,
  useClearExamQuestionsMutation,
} from 'src/slices/examApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { IconUpload, IconDownload, IconRobot, IconFileDescription, IconTrash } from '@tabler/icons-react';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const AddQuestionForm = () => {
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [correctOptions, setCorrectOptions] = useState([false, false, false, false]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [questionType, setQuestionType] = useState('objective');
  const [correctAnswerText, setCorrectAnswerText] = useState('');

  // AI Import State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [aiParseQuestions] = useAiParseQuestionsMutation();

  const { userInfo } = useSelector((state) => state.auth);

  const handleOptionChange = (index) => {
    const updatedCorrectOptions = [...correctOptions];
    updatedCorrectOptions[index] = !correctOptions[index];
    setCorrectOptions(updatedCorrectOptions);
  };

  const [createQuestion, { isLoading }] = useCreateQuestionMutation();
  const [bulkImportQuestions] = useBulkImportQuestionsMutation();
  const [csvImportQuestions] = useCsvImportQuestionsMutation();
  const [clearExamQuestions, { isLoading: isClearing }] = useClearExamQuestionsMutation();
  const { data: examsData } = useGetExamsQuery();
  const { data: existingQuestions } = useGetQuestionsQuery(selectedExamId, { skip: !selectedExamId });

  useEffect(() => {
    if (existingQuestions) {
      setQuestions(existingQuestions);
    } else {
      setQuestions([]);
    }
  }, [existingQuestions, selectedExamId]);

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

  const selectedExam = myExams.find(e => e._id === selectedExamId);
  const examType = selectedExam?.examType || 'objective';

  useEffect(() => {
    if (myExams.length > 0 && !selectedExamId) {
      setSelectedExamId(myExams[0]._id);
    }
  }, [myExams, selectedExamId]);

  useEffect(() => {
    if (examType === 'objective' || examType === 'subjective') {
      setQuestionType(examType);
    } else if (examType === 'both') {
      setQuestionType('objective');
    }
  }, [examType, selectedExamId]);

  const handleResetForm = () => {
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
    setCorrectAnswerText('');
  };

  const handleAddQuestion = async () => {
    if (!selectedExamId) {
      swal('', 'Please select or create an exam first.', 'error');
      return;
    }

    if (newQuestion.trim() === '') {
      swal('', 'Please fill out the question.', 'error');
      return;
    }
    if (questionType === 'objective') {
      if (newOptions.some((option) => option.trim() === '')) {
        swal('', 'Please fill out all options.', 'error');
        return;
      }
      if (!correctOptions.some((isCorrect) => isCorrect)) {
        swal('', 'Please select at least one correct option.', 'error');
        return;
      }
    } else {
      if (correctAnswerText.trim() === '') {
        swal('', 'Please provide the correct answer text.', 'error');
        return;
      }
    }

    const newQuestionObj = {
      question: newQuestion,
      type: questionType,
      correctAnswerText: questionType === 'subjective' ? correctAnswerText : undefined,
      options: questionType === 'objective' ? newOptions.map((option, index) => ({
        optionText: option,
        isCorrect: correctOptions[index],
      })) : [],
      examId: selectedExamId,
    };

    try {
      const res = await createQuestion(newQuestionObj).unwrap();
      toast.success('Question added successfully!');
      // res is the newly added question subdocument — append it to local preview
      setQuestions((prev) => [...(prev || []), res]);
      handleResetForm();
    } catch (err) {
      swal('', err?.data?.message || 'Failed to create question. Please try again.', 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedExamId) {
      swal('', 'Please select or create an exam first before importing.', 'error');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonContent = JSON.parse(event.target.result);
        if (!Array.isArray(jsonContent)) {
          throw new Error('File content must be a JSON array of questions.');
        }

        toast.info(`Importing ${jsonContent.length} questions... Please wait.`);

        try {
          const res = await bulkImportQuestions({
            examId: selectedExamId,
            questions: jsonContent
          }).unwrap();
          
          // Check if questions were actually imported or all skipped
          const importedCount = res.questions ? (res.questions.length - (existingQuestions?.length || 0)) : 0;
          if (res.diagnostics && res.diagnostics.skippedCount > 0 && (!res.questions || importedCount <= 0)) {
            // Show a warning with diagnostic info
            const keys = res.diagnostics.sampleKeys || 'unknown';
            toast.warn(
              `⚠️ 0 questions imported. Your JSON keys: [${keys}]. ` +
              `Rename your question field to "question" or "text". ` +
              `For options use an "options" array or A/B/C/D fields.`,
              { autoClose: 10000 }
            );
          } else {
            toast.success(res.message);
          }
          if (res.questions) {
            setQuestions(res.questions);
          }
        } catch (err) {
          toast.error(`Import failed! ${err?.data?.message || 'Server error'}`);
        }
        
        e.target.value = null;
      } catch (err) {
        swal('Import Format Error', err.message || 'Invalid JSON format', 'error');
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  // ── CSV Upload Handler ────────────────────────────────────────────────────
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedExamId) {
      swal('', 'Please select an exam first before importing.', 'error');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target.result;
        toast.info('Importing from CSV... Please wait.');
        const res = await csvImportQuestions({ examId: selectedExamId, csvText }).unwrap();
        toast.success(res.message);
        if (res.questions) setQuestions(res.questions);
      } catch (err) {
        toast.error(`CSV Import failed! ${err?.data?.message || 'Server error'}`);
      }
      e.target.value = null;
    };
    reader.readAsText(file);
  };

  // ── AI Extraction Helpers ───────────────────────────────────────────────────

  const extractTextFromPdf = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText;
  };

  const extractTextFromDocx = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  const handleAiFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedExamId) {
      swal('', 'Please select an exam first.', 'error');
      e.target.value = null;
      return;
    }

    setIsAiLoading(true);
    const toastId = toast.loading("Processing document... This may take a moment.");

    try {
      let extractedText = '';
      if (file.type === 'application/pdf') {
        extractedText = await extractTextFromPdf(file);
      } else {
        extractedText = await extractTextFromDocx(file);
      }

      if (!extractedText.trim()) throw new Error("Could not extract text from document.");

      // Call AI parse mutation
      const parsedQuestions = await aiParseQuestions({ text: extractedText }).unwrap();
      
      // Client-side cleaning: filter out any obviously empty questions returned by AI
      const validQuestions = (parsedQuestions || []).filter(q => q.question && q.question.trim().length > 0);
      
      if (validQuestions.length === 0) {
        throw new Error("AI could not extract any valid questions from the document.");
      }

      setAiQuestions(validQuestions);
      setIsPreviewOpen(true);
      toast.update(toastId, { render: "AI finished extraction!", type: "success", isLoading: false, autoClose: 3000 });
    } catch (err) {
      console.error('[AI Import Error]', err);
      const errMsg = err?.data?.message || err?.error || err?.message || 'AI parsing failed. Please try again.';
      toast.update(toastId, { render: `❌ ${errMsg}`, type: "error", isLoading: false, autoClose: 8000 });
    } finally {
      setIsAiLoading(false);
      e.target.value = null;
    }
  };

  const handleConfirmAiImport = async () => {
    const validQuestionsToImport = aiQuestions.filter(q => q.question && q.question.trim().length > 0);
    
    if (validQuestionsToImport.length === 0) {
      toast.error("No valid questions to import.");
      return;
    }

    try {
      const res = await bulkImportQuestions({
        examId: selectedExamId,
        questions: validQuestionsToImport
      }).unwrap();
      
      toast.success(res.message);
      if (res.questions) {
        setQuestions(res.questions);
      }
      setIsPreviewOpen(false);
      setAiQuestions([]);
    } catch (err) {
      swal('Import Failed', err?.data?.message || 'Server error', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    // Download a CSV template that Excel can open directly
    const csvContent = [
      'question,a,b,c,d,answer',
      'What is Python?,High-level language,Low-level language,Assembly language,None of these,A',
      'Python is case-sensitive?,Yes,No,Sometimes,Depends on IDE,A',
      'Who created Python?,Guido van Rossum,James Gosling,Dennis Ritchie,Bjarne Stroustrup,A',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleSubmitQuestions = () => {
    setQuestions([]);
    setNewQuestion('');
    setNewOptions(['', '', '', '']);
    setCorrectOptions([false, false, false, false]);
    setCorrectAnswerText('');
  };

  const handleClearQuestions = async () => {
    if (!selectedExamId) {
      swal('', 'Please select an exam first.', 'error');
      return;
    }
    if (questions.length === 0) {
      toast.info('No questions to clear.');
      return;
    }
    const confirmed = await swal({
      title: 'Delete ALL Questions?',
      text: `This will permanently remove all ${questions.length} questions from this exam. This cannot be undone.`,
      icon: 'warning',
      buttons: ['Cancel', 'Yes, Delete All'],
      dangerMode: true,
    });
    if (!confirmed) return;
    try {
      const res = await clearExamQuestions(selectedExamId).unwrap();
      toast.success(res.message || 'All questions cleared!');
      setQuestions([]);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to clear questions.');
    }
  };

  return (
    <>
      <Card 
        variant="elevation" 
        elevation={0} 
        sx={{ 
          mb: 5, 
          borderRadius: '16px', 
          bgcolor: 'rgba(108,99,255,0.04)',
          border: '1px solid rgba(108,99,255,0.1)'
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={800} color="primary" mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
             <IconFileDescription size={20} /> Selection & Quick Import
          </Typography>
          
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} md={6}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                 Select Active Exam
              </Typography>
              <Select
                value={selectedExamId || ''}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                }}
                fullWidth
                size="small"
                sx={{ 
                  borderRadius: '10px', 
                  bgcolor: '#fff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  '& fieldset': { border: 'none' }
                }}
              >
                {myExams.length === 0 ? (
                  <MenuItem disabled>No exams found. Create one first.</MenuItem>
                ) : (
                  myExams.map((exam) => (
                    <MenuItem key={exam._id} value={exam._id}>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'primary.main', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                          {exam.examName.charAt(0).toUpperCase()}
                        </Box>
                        <Stack direction="column">
                          <Typography variant="subtitle2" fontWeight={700}>{exam.examName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {formatDate(exam.createdAt)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </MenuItem>
                  ))
                )}
              </Select>
            </Grid>
            
            <Grid item xs={12} md={6}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                   Batch Tools
                </Typography>
                <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap gap={1}>
                  <Button
                    variant="contained"
                    component="label"
                    color="secondary"
                    startIcon={<IconUpload size={16} />}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', bgcolor: '#16A34A', boxShadow: '0 4px 10px rgba(22,163,74,0.2)', '&:hover': { bgcolor: '#15803D' } }}
                  >
                    CSV / Excel
                    <input type="file" accept=".csv,.xlsx,.xls" hidden onChange={handleCsvUpload} />
                  </Button>

                  <Button
                    variant="contained"
                    component="label"
                    color="secondary"
                    startIcon={<IconUpload size={16} />}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', bgcolor: '#00D4AA', boxShadow: '0 4px 10px rgba(0,212,170,0.2)', '&:hover': { bgcolor: '#00bd98' } }}
                  >
                    JSON
                    <input type="file" accept=".json" hidden onChange={handleFileUpload} />
                  </Button>

                  <Button
                    variant="contained"
                    component="label"
                    color="primary"
                    disabled={isAiLoading}
                    startIcon={isAiLoading ? <CircularProgress size={16} color="inherit" /> : <IconRobot size={16} />}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', background: 'linear-gradient(135deg,#6C63FF,#A78BFA)', boxShadow: '0 4px 10px rgba(108,99,255,0.2)' }}
                  >
                    {isAiLoading ? 'AI...' : 'AI Smart Import'}
                    <input type="file" accept=".pdf,.docx,.doc" hidden onChange={handleAiFileUpload} />
                  </Button>

                  <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<IconDownload size={16} />}
                    onClick={handleDownloadTemplate}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', border: '1.5px solid' }}
                  >
                    Template
                  </Button>

                  {questions.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={isClearing}
                      startIcon={isClearing ? <CircularProgress size={16} color="inherit" /> : <IconTrash size={16} />}
                      onClick={handleClearQuestions}
                      sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', border: '1.5px solid #FF6B6B', color: '#FF6B6B', '&:hover': { bgcolor: 'rgba(255,107,107,0.08)' } }}
                    >
                      {isClearing ? 'Clearing...' : `Clear All (${questions.length})`}
                    </Button>
                  )}
                </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* AI PREVIEW DIALOG */}
      <Dialog 
        open={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconRobot color="#6C63FF" />
          SAAN AI: Extracted Questions
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Our AI has processed your document. Please review the <strong>{aiQuestions.length}</strong> questions below before adding them to the exam.
          </Typography>
          
          <Stack spacing={3}>
            {aiQuestions.map((q, i) => (
              <Box key={i} p={2.5} borderRadius="12px" border="1px solid #eee" bgcolor="rgba(108,99,255,0.02)">
                <Typography variant="subtitle1" fontWeight={700} color="primary" mb={1}>
                  Q{i+1}: {q.question}
                </Typography>
                <Chip label={q.type} size="small" variant="outlined" sx={{ mb: 2, fontWeight: 700, textTransform: 'uppercase', fontSize: '0.65rem' }} />
                
                {q.type === 'objective' ? (
                  <List dense>
                    {q.options.map((opt, oi) => (
                      <ListItem key={oi} sx={{ py: 0.5 }}>
                        <ListItemText 
                          primary={opt.optionText} 
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            fontWeight: opt.isCorrect ? 800 : 400,
                            color: opt.isCorrect ? 'success.main' : 'text.primary'
                          }} 
                        />
                        {opt.isCorrect && <Chip label="Correct" size="small" color="success" sx={{ height: 18, fontSize: '0.6rem' }} />}
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', p: 1.5, bgcolor: '#fff', borderRadius: '8px', border: '1px dashed #ccc' }}>
                    <strong>Sample Answer:</strong> {q.correctAnswerText || 'Not provided'}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setIsPreviewOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>Discard</Button>
          <Button 
            onClick={handleConfirmAiImport} 
            variant="contained" 
            sx={{ fontWeight: 700, borderRadius: '10px', px: 4 }}
          >
            Import {aiQuestions.length} Questions
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={1} flexWrap="wrap">
          <Typography variant="h5" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconFileDescription size={24} /> Question Bank ({questions.length})
          </Typography>
          <Chip 
            label={`Limit: ${selectedExam?.totalQuestions || 0} per student`} 
            color="primary" 
            variant="outlined" 
            size="small" 
            sx={{ fontWeight: 700 }}
          />
          {questions.length < (selectedExam?.totalQuestions || 0) && (
             <Chip 
              label="Warning: Smaller than attempt limit!" 
              color="warning" 
              size="small" 
              sx={{ fontWeight: 700 }}
            />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, ml: 4.5 }}>
           The system will pick {selectedExam?.totalQuestions} random questions from these {questions.length} for every new attempt.
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Stack spacing={3} mb={5}>
          {questions.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4} sx={{ bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px dashed #ccc' }}>
              No questions added yet. Use the form below or import a file to get started.
            </Typography>
          ) : (
            questions.map((questionObj, questionIndex) => (
              <Card 
                key={questionIndex} 
                variant="outlined" 
                sx={{ 
                  borderRadius: '12px', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderColor: 'primary.main' },
                  transition: 'all 0.2s ease',
                  overflow: 'visible'
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start" mb={2}>
                    <Chip 
                      label={`Q${questionIndex + 1}`} 
                      color="primary" 
                      size="small" 
                      sx={{ fontWeight: 800, borderRadius: '6px', height: 24 }} 
                    />
                    <Box flexGrow={1}>
                      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.4 }}>
                        {questionObj.question}
                      </Typography>
                      <Chip 
                        label={questionObj.type === 'objective' ? 'MULTIPLE CHOICE' : 'THEORY / SUBJECTIVE'} 
                        size="small"
                        variant="outlined"
                        sx={{ mt: 1, fontSize: '0.62rem', fontWeight: 800, height: 18 }} 
                      />
                    </Box>
                  </Stack>
                  
                  <Box pl={6}>
                    {questionObj.type === 'subjective' ? (
                      <Box p={2} bgcolor="rgba(108,99,255,0.05)" borderRadius="10px" border="1px dashed #6C63FF">
                         <Typography variant="caption" fontWeight={800} color="primary" display="block" mb={0.5} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>EXPECTED ANSWER:</Typography>
                         <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{questionObj.correctAnswerText}</Typography>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {questionObj.options.map((option, optionIndex) => (
                          <Grid item xs={12} sm={6} key={optionIndex}>
                            <Box 
                              p={1.5} 
                              borderRadius="10px" 
                              border="1.5px solid"
                              borderColor={option.isCorrect ? 'success.main' : 'rgba(0,0,0,0.08)'}
                              bgcolor={option.isCorrect ? 'rgba(0,212,170,0.05)' : '#fff'}
                              display="flex"
                              alignItems="center"
                              gap={1.5}
                            >
                              <Box 
                                sx={{ 
                                  width: 10, 
                                  height: 10, 
                                  borderRadius: '50%', 
                                  bgcolor: option.isCorrect ? 'success.main' : '#ccc',
                                  boxShadow: option.isCorrect ? '0 0 8px rgba(0,212,170,0.6)' : 'none'
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                fontWeight={option.isCorrect ? 700 : 400}
                                color={option.isCorrect ? 'success.dark' : 'text.primary'}
                                sx={{ wordBreak: 'break-word' }}
                              >
                                {option.optionText}
                              </Typography>
                              {option.isCorrect && (
                                <Chip label="Correct Answer" size="small" color="success" sx={{ ml: 'auto', height: 18, fontSize: '0.55rem', fontWeight: 800 }} />
                              )}
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      </Box>

      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mt: 6, display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconRobot size={24} color="#6C63FF" /> Add New Question
      </Typography>
      <Divider sx={{ mb: 3 }} />

      <Card 
        variant="outlined" 
        sx={{ 
          borderRadius: '16px', 
          border: '1px solid #e0e0e0', 
          mb: 6,
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          bgcolor: '#fafafa'
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 4 } }}>
          <TextField
            label="Question Text"
            placeholder="e.g., Explain the concept of Inheritance in OOP?"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            fullWidth
            multiline
            rows={3}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                bgcolor: '#fff',
                borderRadius: '12px'
              }
            }}
          />

          {examType === 'both' && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                Question Type Selection
              </Typography>
              <Select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value)}
                fullWidth
                size="small"
                sx={{ borderRadius: '10px', bgcolor: '#fff' }}
              >
                <MenuItem value="objective">Objective (Multiple Choice)</MenuItem>
                <MenuItem value="subjective">Subjective (Text Answer)</MenuItem>
              </Select>
            </Box>
          )}

          {questionType === 'objective' ? (
            <Box>
               <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ display: 'block', mb: 2, textTransform: 'uppercase', letterSpacing: 1 }}>
                Options & Correct Answer
              </Typography>
              <Grid container spacing={2}>
                {newOptions.map((option, index) => (
                  <Grid item xs={12} key={index}>
                    <Card variant="outlined" sx={{ borderRadius: '10px', transition: 'all 0.2s', borderColor: correctOptions[index] ? 'success.main' : '#eee', bgcolor: '#fff' }}>
                      <Stack direction="row" spacing={2} px={2} py={1} alignItems="center">
                        <Box sx={{ p: 1, borderRadius: '6px', bgcolor: 'rgba(0,0,0,0.03)', fontWeight: 800 }}>{index + 1}</Box>
                        <TextField
                          placeholder={`Option ${index + 1} content...`}
                          value={newOptions[index]}
                          onChange={(e) => {
                            const updatedOptions = [...newOptions];
                            updatedOptions[index] = e.target.value;
                            setNewOptions(updatedOptions);
                          }}
                          fullWidth
                          variant="standard"
                          InputProps={{ disableUnderline: true }}
                          sx={{ py: 1 }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={correctOptions[index]}
                              onChange={() => handleOptionChange(index)}
                              color="success"
                              size="small"
                            />
                          }
                          label={<Typography variant="caption" fontWeight={700}>CORRECT</Typography>}
                          sx={{ m: 0 }}
                        />
                      </Stack>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <TextField
              label="Expected Correct Answer"
              placeholder="Provide a detailed sample answer for grading reference..."
              value={correctAnswerText}
              onChange={(e) => setCorrectAnswerText(e.target.value)}
              fullWidth
              multiline
              rows={4}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#fff',
                  borderRadius: '12px'
                }
              }}
            />
          )}

          <Stack mt={5} direction="row" spacing={2} justifyContent="flex-end">
            <Button 
                variant="text" 
                onClick={handleResetForm}
                sx={{ borderRadius: '10px', px: 3, fontWeight: 600, color: 'text.secondary' }}
            >
              Reset Form
            </Button>
            <Button 
                variant="contained" 
                onClick={handleAddQuestion}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
                sx={{ 
                    borderRadius: '10px', 
                    px: 5,
                    py: 1.2,
                    background: 'linear-gradient(135deg,#6C63FF,#8E84FF)',
                    boxShadow: '0 4px 14px rgba(108,99,255,0.39)',
                    fontWeight: 700,
                    textTransform: 'none'
                }}
            >
              {isLoading ? 'Adding...' : 'Add Question to List'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
};

export default AddQuestionForm;
