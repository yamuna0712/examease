import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { DbAlertBanner } from './components/DbAlertBanner';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ExamPlayerPage } from './pages/ExamPlayerPage';
import { ExamResultPage } from './pages/ExamResultPage';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export const App = () => {
  const { user, loading, isStudent, isTeacher, isAdmin } = useAuth();
  const [currentView, setCurrentView] = useState('home');
  const [activeExamId, setActiveExamId] = useState(null);
  const [activeAttemptId, setActiveAttemptId] = useState(null);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundColor: 'var(--slate-50)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎓</div>
        <h2 style={{ color: 'var(--primary-800)' }}>Initializing ExamEase...</h2>
      </div>
    );
  }

  // Navigation handlers
  const handleStartExam = (examId) => {
    setActiveExamId(examId);
    setCurrentView('exam-player');
  };

  const handleExamCompleted = (result) => {
    setActiveAttemptId(result._id);
    setCurrentView('exam-result');
  };

  const handleViewResult = (attemptId) => {
    setActiveAttemptId(attemptId);
    setCurrentView('exam-result');
  };

  // Determine what view to render
  const renderContent = () => {
    // Guest Views
    if (!user) {
      if (currentView === 'login') return <LoginPage setCurrentView={setCurrentView} />;
      if (currentView === 'register') return <RegisterPage setCurrentView={setCurrentView} />;
      return <HomePage setCurrentView={setCurrentView} />;
    }

    // Exam Player view for Student
    if (currentView === 'exam-player' && activeExamId) {
      return (
        <ExamPlayerPage
          examId={activeExamId}
          onExamCompleted={handleExamCompleted}
          onCancel={() => setCurrentView('dashboard')}
        />
      );
    }

    // Exam Result view
    if (currentView === 'exam-result' && activeAttemptId) {
      return (
        <ExamResultPage
          attemptId={activeAttemptId}
          onBackToDashboard={() => setCurrentView('dashboard')}
        />
      );
    }

    // Role-specific Dashboards
    if (isAdmin) {
      return <AdminDashboard />;
    }

    if (isTeacher) {
      return <TeacherDashboard />;
    }

    // Default to Student Dashboard
    return (
      <StudentDashboard
        onStartExam={handleStartExam}
        onViewResult={handleViewResult}
      />
    );
  };

  const isTakingExam = currentView === 'exam-player';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DbAlertBanner />
      {!isTakingExam && (
        <Navbar currentView={currentView} setCurrentView={setCurrentView} />
      )}
      <main className="main-content">{renderContent()}</main>
      {!isTakingExam && <Footer />}
    </div>
  );
};
