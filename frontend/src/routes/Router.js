import React, { lazy } from 'react';
import { Navigate, Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import MobileCamPage from '../views/student/MobileCamPage';

/* ***Layouts**** */
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const ExamLayout = Loadable(lazy(() => import('../layouts/full/ExamLayout')));

/* ****Pages***** */
const Dashboard = Loadable(lazy(() => import('../views/dashboard/Dashboard')));
const SamplePage = Loadable(lazy(() => import('../views/sample-page/SamplePage')));
const Success = Loadable(lazy(() => import('../views/Success')));
// const Icons = Loadable(lazy(() => import('../views/icons/Icons')));
// const TypographyPage = Loadable(lazy(() => import('../views/utilities/TypographyPage')));
// const Shadow = Loadable(lazy(() => import('../views/utilities/Shadow')));
//Student Routes

const TestPage = Loadable(lazy(() => import('./../views/student/TestPage')));
const ExamPage = Loadable(lazy(() => import('./../views/student/ExamPage')));
const ExamDetails = Loadable(lazy(() => import('./../views/student/ExamDetails')));
const ResultPage = Loadable(lazy(() => import('./../views/student/ResultPage')));
const MyResults = Loadable(lazy(() => import('./../views/student/MyResults')));
const LeaderboardPage = Loadable(lazy(() => import('./../views/student/LeaderboardPage')));
const StudentSubmissionDetail = Loadable(lazy(() => import('./../views/student/StudentSubmissionDetail')));
const SupportPage = Loadable(lazy(() => import('./../views/student/SupportPage')));
//Auth Routes
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Register = Loadable(lazy(() => import('../views/authentication/Register')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));
const ForgotPassword = Loadable(lazy(() => import('../views/authentication/ForgotPassword')));
const UserAccount = Loadable(lazy(() => import('../views/authentication/UserAccount')));
const UserProfile = Loadable(lazy(() => import('../views/authentication/UserProfile')));

// Teacher Routes
const CreateExamPage = Loadable(lazy(() => import('./../views/teacher/CreateExamPage')));
const EditExamPage = Loadable(lazy(() => import('./../views/teacher/EditExamPage')));
const ExamLogPage = Loadable(lazy(() => import('./../views/teacher/ExamLogPage')));
const AddQuestions = Loadable(lazy(() => import('./../views/teacher/AddQuestions')));
const ExamSubmissions = Loadable(lazy(() => import('./../views/teacher/ExamSubmissions')));
const SubmissionDetail = Loadable(lazy(() => import('./../views/teacher/SubmissionDetail')));
const PrivateRoute = Loadable(lazy(() => import('src/views/authentication/PrivateRoute')));
const TeacherRoute = Loadable(lazy(() => import('src/views/authentication/TeacherRoute')));

const Router = createBrowserRouter(
  createRoutesFromElements(
    // Every router we create will now go in here as
    // they going to be child of our main App component
    <>
      {/* // Private Routes */}
      <Route path="" element={<PrivateRoute />}>
        {/* // Main layout */}
        <Route path="/" element={<FullLayout />}>
          <Route index={true} path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" exact={true} element={<Dashboard />} />
          <Route path="/sample-page" exact={true} element={<SamplePage />} />
          <Route path="/Success" exact={true} element={<Success />} />
          <Route path="/exam" exact={true} element={<ExamPage />} />
          <Route path="/result" exact={true} element={<ResultPage />} />
          <Route path="/my-results" exact={true} element={<MyResults />} />
          <Route path="/my-results/:submissionId" exact={true} element={<StudentSubmissionDetail />} />
          <Route path="/leaderboard" exact={true} element={<LeaderboardPage />} />
          <Route path="/support" exact={true} element={<SupportPage />} />
          <Route path="" element={<TeacherRoute />}>
            <Route path="/create-exam" exact={true} element={<CreateExamPage />} />
            <Route path="/edit-exam/:examId" exact={true} element={<EditExamPage />} />
            <Route path="/add-questions" exact={true} element={<AddQuestions />} />
            <Route path="/exam-log" exact={true} element={<ExamLogPage />} />
            <Route path="/exam-submissions/:examId" exact={true} element={<ExamSubmissions />} />
            <Route path="/submission-detail/:submissionId" exact={true} element={<SubmissionDetail />} />
          </Route>
        </Route>
        <Route path="/" element={<ExamLayout />}>
          <Route path="exam/:examId" exact={true} element={<ExamDetails />} />
          <Route path="exam/:examId/:testId" exact={true} element={<TestPage />} />
        </Route>
      </Route>
      {/* User layout */}
      <Route path="/user" element={<FullLayout />}>
        <Route path="profile" exact={true} element={<UserProfile />} />
        <Route path="account" exact={true} element={<UserAccount />} />
      </Route>

      {/* Authentication layout */}
      <Route path="/auth" element={<BlankLayout />}>
        <Route path="404" element={<Error />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        {/* <Route path="*" element={<Navigate to="/auth/404" />} /> */}
      </Route>

      {/* Third Eye — public mobile camera page (no login needed) */}
      <Route path="/mobile-cam/:sessionId" element={<MobileCamPage />} />
    </>,
  ),
);

export default Router;
