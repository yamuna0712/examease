import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';

export const StudentDashboard = ({ onStartExam, onViewResult }) => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [activeTab, setActiveTab] = useState('available'); // 'available' | 'history'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedExamForModal, setSelectedExamForModal] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [examsRes, attemptsRes] = await Promise.all([
        apiRequest('/exams/available'),
        apiRequest('/attempts/my'),
      ]);

      if (examsRes.success) setExams(examsRes.exams);
      if (attemptsRes.success) setAttempts(attemptsRes.attempts);
    } catch (err) {
      setError(err.message || 'Failed to load examinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem 1.5rem' }}>
      {/* Student Welcome Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          paddingBottom: '1.5rem',
          borderBottom: '1px solid var(--slate-200)',
        }}
      >
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>
            Student Workspace
          </span>
          <h1 style={{ fontSize: '1.85rem', color: 'var(--slate-900)' }}>
            Welcome back, {user?.name}!
          </h1>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem' }}>
            Select an exam to begin, or review your historical grades and performance.
          </p>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--slate-200)',
            padding: '0.25rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <button
            onClick={() => setActiveTab('available')}
            className="btn btn-sm"
            style={{
              backgroundColor: activeTab === 'available' ? 'white' : 'transparent',
              color: activeTab === 'available' ? 'var(--primary-700)' : 'var(--slate-700)',
              boxShadow: activeTab === 'available' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Available Exams ({exams.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className="btn btn-sm"
            style={{
              backgroundColor: activeTab === 'history' ? 'white' : 'transparent',
              color: activeTab === 'history' ? 'var(--primary-700)' : 'var(--slate-700)',
              boxShadow: activeTab === 'history' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            My Attempts & Results ({attempts.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>{error}</div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--slate-500)' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
          Loading your examination catalog...
        </div>
      ) : activeTab === 'available' ? (
        /* AVAILABLE EXAMS TAB */
        <div>
          {exams.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                color: 'var(--slate-500)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📚</div>
              <h3 style={{ color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                No active exams available at the moment
              </h3>
              <p style={{ maxWidth: '480px', margin: '0 auto', fontSize: '0.9rem' }}>
                Check back shortly or contact your course instructor to verify if an examination has been scheduled and published.
              </p>
            </div>
          ) : (
            <div className="grid-cols-2">
              {exams.map((exam) => (
                <div
                  key={exam._id}
                  className="card card-hover"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '0.5rem',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span className="badge badge-primary">Active Exam</span>
                      {exam.hasActiveAttempt && (
                        <span className="badge badge-warning">● In Progress</span>
                      )}
                      {!exam.canTake && (
                        <span className="badge badge-slate">Completed</span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--slate-900)' }}>
                      {exam.title}
                    </h3>

                    <p
                      style={{
                        color: 'var(--slate-600)',
                        fontSize: '0.9rem',
                        marginBottom: '1.25rem',
                        lineHeight: 1.5,
                      }}
                    >
                      {exam.description || 'No description provided.'}
                    </p>

                    {/* Metadata chips */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '0.75rem',
                        padding: '0.85rem',
                        backgroundColor: 'var(--slate-50)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.825rem',
                        marginBottom: '1.25rem',
                      }}
                    >
                      <div>
                        <span style={{ color: 'var(--slate-500)', display: 'block' }}>Instructor</span>
                        <strong style={{ color: 'var(--slate-800)' }}>{exam.teacher}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)', display: 'block' }}>Duration</span>
                        <strong style={{ color: 'var(--slate-800)' }}>⏱️ {exam.durationMinutes} Minutes</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)', display: 'block' }}>Questions</span>
                        <strong style={{ color: 'var(--slate-800)' }}>📝 {exam.questionCount} Questions</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--slate-500)', display: 'block' }}>Total Marks</span>
                        <strong style={{ color: 'var(--slate-800)' }}>🎯 {exam.totalMarks} Marks (Pass: {exam.passPercentage}%)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '1rem',
                      borderTop: '1px solid var(--slate-100)',
                    }}
                  >
                    <button
                      onClick={() => setSelectedExamForModal(exam)}
                      className="btn btn-sm btn-secondary"
                    >
                      View Instructions
                    </button>

                    {exam.hasActiveAttempt ? (
                      <button
                        onClick={() => onStartExam(exam._id)}
                        className="btn btn-sm btn-warning"
                      >
                        ▶ Resume Attempt
                      </button>
                    ) : exam.canTake ? (
                      <button
                        onClick={() => onStartExam(exam._id)}
                        className="btn btn-sm btn-primary"
                      >
                        Start Examination →
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          exam.latestAttempt && onViewResult(exam.latestAttempt._id)
                        }
                        className="btn btn-sm btn-secondary"
                      >
                        View Prior Result
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* HISTORY TAB */
        <div>
          {attempts.length === 0 ? (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                color: 'var(--slate-500)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
              <h3 style={{ color: 'var(--slate-800)', marginBottom: '0.5rem' }}>
                No completed examination attempts yet
              </h3>
              <p style={{ maxWidth: '450px', margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
                Take your first online examination from the Available Exams tab to see your scores here.
              </p>
              <button
                onClick={() => setActiveTab('available')}
                className="btn btn-primary btn-sm"
              >
                Browse Available Exams
              </button>
            </div>
          ) : (
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Date Submitted</th>
                      <th>Status</th>
                      <th>Score</th>
                      <th>Percentage</th>
                      <th>Outcome</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((att) => (
                      <tr key={att._id}>
                        <td>
                          <strong>{att.examTitle}</strong>
                        </td>
                        <td>
                          {att.submitTime
                            ? new Date(att.submitTime).toLocaleString()
                            : new Date(att.startTime).toLocaleString()}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              att.status === 'submitted'
                                ? 'badge-success'
                                : att.status === 'expired'
                                ? 'badge-warning'
                                : 'badge-primary'
                            }`}
                          >
                            {att.status}
                          </span>
                        </td>
                        <td>
                          {att.showResultsImmediately ? (
                            <span>
                              {att.totalMarksObtained} / {att.maxPossibleMarks}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--slate-400)' }}>Hidden</span>
                          )}
                        </td>
                        <td>
                          {att.showResultsImmediately ? (
                            <strong>{att.percentage}%</strong>
                          ) : (
                            <span style={{ color: 'var(--slate-400)' }}>Pending Release</span>
                          )}
                        </td>
                        <td>
                          {att.showResultsImmediately ? (
                            <span
                              className={`badge ${
                                att.isPassed ? 'badge-success' : 'badge-danger'
                              }`}
                            >
                              {att.isPassed ? 'PASSED' : 'FAILED'}
                            </span>
                          ) : (
                            <span className="badge badge-slate">Under Review</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => onViewResult(att._id)}
                            className="btn btn-sm btn-secondary"
                          >
                            View Result
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions Modal */}
      {selectedExamForModal && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedExamForModal(null)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '540px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.35rem' }}>{selectedExamForModal.title}</h3>
              <button
                onClick={() => setSelectedExamForModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: 'var(--primary-50)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.9rem',
              }}
            >
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <b>Duration:</b> {selectedExamForModal.durationMinutes} Minutes
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <b>Total Questions:</b> {selectedExamForModal.questionCount}
              </p>
              <p style={{ margin: '0 0 0.5rem 0' }}>
                <b>Passing Score:</b> {selectedExamForModal.passPercentage}%
              </p>
              <p style={{ margin: 0 }}>
                <b>Multiple Attempts:</b>{' '}
                {selectedExamForModal.allowMultipleAttempts ? 'Allowed' : 'One attempt only'}
              </p>
            </div>

            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--slate-800)' }}>
              Important Examination Guidelines:
            </h4>
            <ul
              style={{
                paddingLeft: '1.25rem',
                fontSize: '0.875rem',
                color: 'var(--slate-600)',
                lineHeight: 1.6,
                marginBottom: '1.5rem',
              }}
            >
              <li>Once you start, the server countdown timer begins immediately.</li>
              <li>You may navigate freely between questions using the Question Palette.</li>
              <li>Your answers are automatically saved as you select them.</li>
              <li>If the timer runs out, your examination will automatically submit.</li>
              <li>Ensure you have a stable network connection before starting.</li>
            </ul>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                onClick={() => setSelectedExamForModal(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
              {selectedExamForModal.canTake && (
                <button
                  onClick={() => {
                    const id = selectedExamForModal._id;
                    setSelectedExamForModal(null);
                    onStartExam(id);
                  }}
                  className="btn btn-primary"
                >
                  Start Now →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
