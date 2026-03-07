import { apiSlice } from './apiSlice';

// Define the base URL for the exams API
const EXAMS_URL = '/api/users';

// Inject endpoints for the exam slice
export const examApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // Get all exams
    getExams: builder.query({
      query: () => ({
        url: `${EXAMS_URL}/exam`,
        method: 'GET',
      }),
      transformResponse: (response) => response.exams || [], // unwrap payload
      // always refetch when component mounts, especially helpful after login
      refetchOnMountOrArgChange: true,
    }),
    // Create a new exam
    createExam: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam`,
        method: 'POST',
        body: data,
      }),
    }),
    // Get questions for a specific exam
    getQuestions: builder.query({
      query: (examId) => ({
        url: `${EXAMS_URL}/exam/questions/${examId}`,
        method: 'GET',
      }),
      transformResponse: (response) => response || [],
      providesTags: (result, error, arg) =>
        result ? result.map((_, idx) => ({ type: 'Question', id: idx })) : [],
    }),
    // Create a new question for an exam
    createQuestion: builder.mutation({
      query: (data) => ({
        url: `${EXAMS_URL}/exam/questions`,
        method: 'POST',
        body: data,
      }),
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
      providesTags: ['Submission'],
    }),
  }),
});

export const {
  useGetExamsQuery,
  useCreateExamMutation,
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
} = examApiSlice;

