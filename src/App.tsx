import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// ── Public & Auth Pages ─────────────────────────────────────
import LandingPage from "./pages/public/LandingPage";
import LoginPage from "./pages/public/LoginPage";
import SignupPage from "./pages/public/SignupPage";
import RoleSelection from "./pages/onboarding/RoleSelection";
import WorkspaceSelection from "./pages/onboarding/WorkspaceSetup";
import ProtectedRoute from "./components/auth/ProtectedRoute";

// ── Layouts ─────────────────────────────────────────────────
import TeacherLayout from "./components/layout/TeacherLayout";
import StudentLayout from "./components/layout/StudentLayout";

// ── Teacher Pages ───────────────────────────────────────────
import TeacherDashboard from "./pages/teacher/Dashboard";
import StudentProfile from "./pages/teacher/StudentProfile";
import StudentManagement from "./pages/teacher/Students";
import ClassesPage from "./pages/teacher/MyClasses"; 
import TeacherClassDetails from "./pages/teacher/ClassDetails"; 
import TeacherAssignmentsPage from "./pages/teacher/Assignments";
import TeacherAssignmentDetail from "./pages/teacher/AssignmentDetail";
import CreateAssignment from "./pages/teacher/CreateAssignment"; 
import EditAssignment from "./pages/teacher/EditAssignment";
import ReviewSubmission from "./pages/teacher/ReviewSubmission"; 
import TeacherFeedback from "./pages/teacher/Feedback"; 
import TeacherAnalytics from "./pages/teacher/Analytics";
import TeacherSettings from "./pages/teacher/Settings";

// ── Student Pages ───────────────────────────────────────────
import StudentDashboard from "./pages/student/Dashboard";
import StudentClasses from "./pages/student/MyClasses";
import StudentClassDetail from "./pages/student/ClassWorkspace"; 
import StudentAssignments from "./pages/student/Assignments";
import StudentAssignmentDetail from "./pages/student/AssignmentDetail"; 
import StudentSubmissions from "./pages/student/Submissions";
import SubmitAssignment from "./pages/student/SubmitAssignment";  
import StudentFeedback from "./pages/student/Feedback"; 
import StudentAnalytics from "./pages/student/Analytics"; 
import StudentSettings from "./pages/student/Settings";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* ── PUBLIC & ONBOARDING ── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/onboarding/workspace" element={<WorkspaceSelection />} />

        {/* ── STANDALONE TEACHER ACTIONS ── */}
        <Route 
          path="/teacher/review/:id" 
          element={
            <ProtectedRoute role="teacher">
              <ReviewSubmission />
            </ProtectedRoute>
          } 
        />

        {/* ── TEACHER WORKFLOW ── */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/teacher/dashboard" replace />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="students" element={<StudentManagement />} />
          <Route path="students/:id" element={<StudentProfile />} /> 
          <Route path="classes" element={<ClassesPage />} />
          <Route path="classes/:classId" element={<TeacherClassDetails />} />
          <Route path="assignments" element={<TeacherAssignmentsPage />} />
          <Route path="assignments/create" element={<CreateAssignment />} />
          
          {/* ✅ FIXED: Changed :id to :assignmentId */}
          <Route path="assignments/:assignmentId" element={<TeacherAssignmentDetail />} />
          <Route path="assignments/:assignmentId/edit" element={<EditAssignment />} />
          
          <Route path="feedback" element={<TeacherFeedback />} />
          <Route path="analytics" element={<TeacherAnalytics />} />
          <Route path="settings" element={<TeacherSettings />} />
        </Route>

        {/* ── STUDENT WORKFLOW ── */}
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/student/dashboard" replace />} />
          <Route path="dashboard" element={<StudentDashboard />} />
          
          {/* Classes */}
          <Route path="classes" element={<StudentClasses />} />
          <Route path="classes/:classId" element={<StudentClassDetail />} />
          
          {/* Assignments (The Vault) */}
          <Route path="assignments" element={<StudentAssignments />} />
          
          {/* ✅ FIXED: Changed :id to :assignmentId */}
          <Route path="assignments/:assignmentId" element={<StudentAssignmentDetail />} />
          <Route path="assignments/:assignmentId/submit" element={<SubmitAssignment />} />
          
          {/* Progress & Feedback */}
          <Route path="submissions" element={<StudentSubmissions />} /> 
          <Route path="submissions/:id" element={<StudentSubmissions />} /> 
          <Route path="feedback" element={<StudentFeedback />} />
          <Route path="feedback/:id" element={<StudentFeedback />} />
          <Route path="analytics" element={<StudentAnalytics />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* CATCH-ALL REDIRECT */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}