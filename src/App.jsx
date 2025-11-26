// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import WelcomePage from "./components/welcome";
import Register from "./components/Register";
import Login from "./components/Login";  // ✅ add Login
import Dashboard from "./components/Dashboard"; // ✅ add Dashboard page
import ProfileManagement from "./components/ProfileManagement";
import CVGenerator from "./components/CVGenerator";
import Candidate from "./components/Candidate";
import JobSearch from "./components/Jobsearch.jsx";
import JobListings from "./components/JobListings";
import DOMRecorder from "./components/DOMRecorder";
import RecordingDemo from "./components/RecordingDemo";
import { JobCardExample } from "./components/JobCardWithRecording";
import InterviewManagement from "./components/InterviewManagement";
import SkillAssessmentTest from "./components/SkillAssessmentTest";
import SkillAssessmentResults from "./components/SkillAssessmentResults";
import OAuthCallback from "./components/OAuthCallback";
import PostJob from "./components/PostJob";
import ForgotPassword from "./components/ForgotPassword";
import AppliedPersons from "./components/AppliedPersons";
import Notifications from "./components/Notifications";
import SavedJobs from "./components/SavedJobs";
import PassedCandidates from "./components/PassedCandidates";
import { useAuth } from "./context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Checking your session…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);

  const showAppToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type, visible: false }]);
    setTimeout(() => {
      setToasts((t) => t.map((x) => (x.id === id ? { ...x, visible: true } : x)));
    }, 10);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 2500);
  };

  useEffect(() => {
    window.appToast = showAppToast;
    return () => { try { delete window.appToast; } catch { /* ignore */ } };
  }, []);

  return (
    <>
      <Header />
      {/* Global Toasts */}
      <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
        <div className="space-y-3">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-5 py-4 rounded-xl shadow-2xl text-white text-sm sm:text-base pointer-events-auto transform transition-all duration-700 ease-out ${
                t.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-6 scale-95'
              } ${t.type === 'success' ? 'bg-green-600' : t.type === 'warn' ? 'bg-yellow-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-900'}`}
            >
              {t.message}
            </div>
          ))}
        </div>
      </div>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfileManagement /></PrivateRoute>} />
        <Route path="/cv-generator" element={<PrivateRoute><CVGenerator /></PrivateRoute>} />
        <Route path="/Candidate" element={<PrivateRoute><Candidate /></PrivateRoute>} />
        <Route path="/jobs" element={<PrivateRoute><JobSearch /></PrivateRoute>} />
        <Route path="/post-job" element={<PrivateRoute><PostJob /></PrivateRoute>} />
        <Route path="/applied-persons" element={<PrivateRoute><AppliedPersons /></PrivateRoute>} />
        <Route path="/passed-candidates" element={<PrivateRoute><PassedCandidates /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/saved" element={<PrivateRoute><SavedJobs /></PrivateRoute>} />
        <Route path="/Details" element={<PrivateRoute><JobListings /></PrivateRoute>} />
        <Route path="/recorder" element={<PrivateRoute><DOMRecorder /></PrivateRoute>} />
        <Route path="/demo" element={<PrivateRoute><RecordingDemo /></PrivateRoute>} />
        <Route path="/job-example" element={<PrivateRoute><JobCardExample /></PrivateRoute>} />
        <Route path="/interviews" element={<PrivateRoute><InterviewManagement /></PrivateRoute>} />
        <Route path="/skills-test" element={<PrivateRoute><SkillAssessmentTest /></PrivateRoute>} />
        <Route path="/skills-test/results" element={<PrivateRoute><SkillAssessmentResults /></PrivateRoute>} />
      </Routes>
    </>
  );
}

export default App;
