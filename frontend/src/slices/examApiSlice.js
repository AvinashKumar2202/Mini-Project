import { apiSlice } from './apiSlice';

const EXAMS_URL = '/api/users';

export const examApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Get all exams
    getExams: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam`,
        method: 'GET',
      }),
      transformResponse: (response) => response.exams || [],
      // Proper cache tag so create/delete mutations invalidate this
      providesTags: ['Exam'],
    }),

    // Create a new exam
    createExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam`,
        method: 'POST',
        body: data,
      }),
      // Invalidate exam list so UI shows the new exam without a manual refresh
      invalidatesTags: ['Exam'],
    }),

    // Get a specific exam by ID
    getExamById: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'GET',
      }),
      providesTags: (result, error, arg) => [{ type: 'Exam', id: arg }],
    }),

    // Update an existing exam
    updateExam: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${EXAMS_URL}/exam/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Exam', id }, 'Exam'],
    }),

    // Get questions for a specific exam
    getQuestions: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/questions/${examId}`,
        method: 'GET',
      }),
      transformResponse: (response) => response || [],
      providesTags: (result, error, arg) => [
        { type: 'Question', id: 'LIST' },
        { type: 'Question', id: arg },
      ],
    }),

    // Create a new question for an exam
    createQuestion: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/questions`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { examId }) => [
        { type: 'Question', id: 'LIST' },
        { type: 'Question', id: examId },
      ],
    }),
    
    // Bulk import questions
    bulkImportQuestions: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/bulk-import`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { examId }) => [
        { type: 'Question', id: 'LIST' },
        { type: 'Question', id: examId },
      ],
    }),

    // Submit exam with answers and score
    submitExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/submit`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Submission'],
    }),

    // Get all submissions by logged in student
    getMySubmissions: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam/my-submissions`,
        method: 'GET',
      }),
      transformResponse: (response) => response.submissions || [],
      providesTags: ['Submission'],
    }),

    // Get notifications for the current user
    getNotifications: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam/notifications`,
        method: 'GET',
      }),
      transformResponse: (response) => response.notifications || [],
      providesTags: ['Notification'],
    }),

    // Mark all notifications as read
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: `${EXAMS_URL}/exam/notifications/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Get backend local IP for QR code
    getConfigIp: builder.query({
      query: () => ({
        url: `/api/config/ip`,
        method: 'GET',
      }),
      transformResponse: (response) => response.ip || 'localhost',
    }),

    // Delete an exam
    deleteExam: builder.mutation({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/${examId}`,
        method: 'DELETE',
      }),
      // Invalidate exam list after deletion
      invalidatesTags: ['Exam'],
    }),

    // Get all submissions for a specific exam (Teacher view)
    getExamSubmissions: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/submissions/${examId}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.submissions || [],
      providesTags: ['Submission'],
    }),

    // Get a specific student's submission detail
    getStudentSubmission: builder.query({
      query: ({ examId, studentId }) => ({
        url: `${EXAMS_URL}/exam/submission/${examId}/${studentId}`,
        method: 'GET',
      }),
    }),
    // Get a specific submission by its unique ID
    getSubmissionById: builder.query({
      query: (submissionId) => ({
        url: `${EXAMS_URL}/exam/submission/${submissionId}`,
        method: 'GET',
      }),
    }),

    // Get leaderboard
    getLeaderboard: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam/leaderboard`,
        method: 'GET',
      }),
      transformResponse: (response) => response || [],
    }),

    // AI Question Parsing
    aiParseQuestions: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/ai-parse`,
        method: 'POST',
        body: data,
      }),
    }),

    // CSV Import
    csvImportQuestions: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/csv-import`,
        method: 'POST',
        body: data,
      }),
    }),

    // Clear ALL questions from an exam (teacher only)
    clearExamQuestions: builder.mutation({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/questions/${examId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, examId) => [
        { type: 'Question', id: 'LIST' },
        { type: 'Question', id: examId },
      ],
    }),
  }),
});

export const {
  useGetExamsQuery,
  useCreateExamMutation,
  useGetExamByIdQuery,
  useUpdateExamMutation,
  useGetQuestionsQuery,
  useCreateQuestionMutation,
  useSubmitExamMutation,
  useGetMySubmissionsQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useGetConfigIpQuery,
  useDeleteExamMutation,
  useGetExamSubmissionsQuery,
  useGetStudentSubmissionQuery,
  useGetSubmissionByIdQuery,
  useGetLeaderboardQuery,
  useBulkImportQuestionsMutation,
  useAiParseQuestionsMutation,
  useCsvImportQuestionsMutation,
  useClearExamQuestionsMutation,
} = examApiSlice;
