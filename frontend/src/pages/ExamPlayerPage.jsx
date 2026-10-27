import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

export const ExamPlayerPage = ({ examId, onExamCompleted, onCancel }) => {
  const [exam, setExam] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // questionIndex -> selectedOptionIndex
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const timerRef = useRef(null);

  // Initialize or resume attempt
  useEffect(() => {
    let isMounted = true;

    const initAttempt = async () => {
      try {
        setLoading(true);
        setError('');

        // 1. Fetch sanitized exam questions
        const examData = await apiRequest(`/exams/${examId}/take`);
        if (!isMounted) return;
        setExam(examData.exam);

        // 2. Start or resume attempt on server
        const attemptData = await apiRequest('/attempts/start', {
          method: 'POST',
          body: JSON.stringify({ examId }),
        });
        if (!isMounted) return;

        setAttempt(attemptData.attempt);
        setRemainingSeconds(attemptData.remainingSeconds);

        // Populate already saved answers if resuming
        const initialMap = {};
        if (Array.isArray(attemptData.attempt.answers)) {
          attemptData.attempt.answers.forEach((ans) => {
            if (typeof ans.selectedOptionIndex === 'number') {
              initialMap[ans.questionIndex] = ans.selectedOptionIndex;
            }
          });
        }
        setAnswers(initialMap);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Failed to initialize exam session.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAttempt();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId]);

  // Countdown timer effect
  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds !== null]);

  // Auto-submit when countdown hits zero
  const handleAutoSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      if (!attempt?._id) return;
      const res = await apiRequest(`/attempts/${attempt._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ isAutomatic: true }),
      });
      onExamCompleted(res.result || res.attempt);
    } catch (err) {
      setError('Time expired and submission was finalized: ' + err.message);
    }
  };

  // Select an option
  const handleSelectOption = async (optionIndex) => {
    if (submitting) return;

    const newOption = answers[currentQuestionIndex] === optionIndex ? null : optionIndex;
    const updatedAnswers = {
      ...answers,
      [currentQuestionIndex]: newOption,
    };
    setAnswers(updatedAnswers);

    // Save answer asynchronously to server
    if (attempt?._id) {
      try {
        await apiRequest(`/attempts/${attempt._id}/answer`, {
          method: 'POST',
          body: JSON.stringify({
            questionIndex: currentQuestionIndex,
            selectedOptionIndex: newOption,
          }),
        });
      } catch (err) {
        if (err.code === 'TIMER_EXPIRED') {
          handleAutoSubmit();
        }
      }
    }
  };

  // Manual submission trigger
  const handleManualSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const res = await apiRequest(`/attempts/${attempt._id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ isAutomatic: false }),
      });
      onExamCompleted(res.result || res.attempt);
    } catch (err) {
      setError(err.message || 'Failed to submit examination.');
      setSubmitting(false);
    }
  };

  // Format seconds -> mm:ss
  const formatTime = (totalSec) => {
    if (totalSec === null || totalSec === undefined) return '--:--';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏱️</div>
        <h2>Preparing your examination environment...</h2>
        <p style={{ color: 'var(--slate-500)', marginTop: '0.5rem' }}>
          Synchronizing server timers and question bank.
        </p>
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="container-sm" style={{ padding: '4rem 1.5rem' }}>
        <div className="alert alert-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h4 style={{ margin: '0 0 0.25rem 0' }}>Cannot Start Exam</h4>
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        </div>
        <button onClick={onCancel} className="btn btn-secondary">
          ← Back to Available Exams
        </button>
      </div>
    );
  }

  const questions = exam?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQ = questions.length;
  const answeredCount = Object.values(answers).filter((val) => typeof val === 'number').length;
  const unansweredCount = totalQ - answeredCount;
  const isTimeCritical = remainingSeconds !== null && remainingSeconds < 120; // under 2 mins

  return (
    <div style={{ backgroundColor: 'var(--slate-100)', minHeight: 'calc(100vh - 4.25rem)', paddingBottom: '3rem' }}>
      {/* Top Fixed Exam Header Bar */}
      <div
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid var(--slate-200)',
          padding: '0.75rem 1.5rem',
          position: 'sticky',
          top: '4.25rem',
          zIndex: 40,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--slate-500)',
                letterSpacing: '0.05em',
              }}
            >
              Active Examination
            </span>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-900)', margin: 0 }}>
              {exam.title}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Live Countdown Timer Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isTimeCritical ? '#fee2e2' : 'var(--primary-50)',
                border: `1.5px solid ${isTimeCritical ? 'var(--danger-500)' : 'var(--primary-200)'}`,
                color: isTimeCritical ? 'var(--danger-600)' : 'var(--primary-800)',
                fontWeight: 700,
                fontSize: '1.15rem',
              }}
            >
              <span>⏱️</span>
              <span>{formatTime(remainingSeconds)}</span>
              {isTimeCritical && (
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--danger-600)' }}>
                  Ending Soon!
                </span>
              )}
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="btn btn-success btn-sm"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Finish & Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Examination Area */}
      <div className="container" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }} className="exam-layout">
          {/* Question View Box */}
          <div className="card" style={{ padding: '2rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--slate-200)',
                marginBottom: '1.5rem',
              }}
            >
              <span className="badge badge-primary">
                Question {currentQuestionIndex + 1} of {totalQ}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                Marks: {currentQ?.marks || 1}
              </span>
            </div>

            {/* Question Text */}
            <h3
              style={{
                fontSize: '1.25rem',
                color: 'var(--slate-900)',
                lineHeight: 1.5,
                marginBottom: '1.75rem',
                fontWeight: 600,
              }}
            >
              {currentQ?.questionText}
            </h3>

            {/* MCQ Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {currentQ?.options?.map((option, optIdx) => {
                const isSelected = answers[currentQuestionIndex] === optIdx;
                const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${
                        isSelected ? 'var(--primary-600)' : 'var(--slate-200)'
                      }`,
                      backgroundColor: isSelected ? 'var(--primary-50)' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? 'var(--shadow-sm)' : 'none',
                    }}
                  >
                    <div
                      style={{
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        border: `2px solid ${
                          isSelected ? 'var(--primary-600)' : 'var(--slate-400)'
                        }`,
                        backgroundColor: isSelected ? 'var(--primary-600)' : 'white',
                        color: isSelected ? 'white' : 'var(--slate-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}
                    >
                      {optionLetters[optIdx] || optIdx + 1}
                    </div>

                    <div style={{ flex: 1, fontSize: '0.95rem', color: 'var(--slate-800)' }}>
                      {option}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Question Navigation Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '2.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--slate-100)',
              }}
            >
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="btn btn-secondary btn-sm"
              >
                ← Previous
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption(answers[currentQuestionIndex])}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}
              >
                Clear Selection
              </button>

              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(totalQ - 1, prev + 1))
                }
                disabled={currentQuestionIndex === totalQ - 1}
                className="btn btn-primary btn-sm"
              >
                Next →
              </button>
            </div>
          </div>

          {/* Question Palette & Progress Sidebar */}
          <div>
            <div className="card" style={{ padding: '1.5rem', position: 'sticky', top: '10.5rem' }}>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--slate-800)' }}>
                Question Palette
              </h4>

              {/* Status tally */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.8rem',
                  marginBottom: '1rem',
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'var(--slate-50)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{ color: 'var(--success-700)', fontWeight: 600 }}>
                  ● {answeredCount} Answered
                </span>
                <span style={{ color: 'var(--slate-500)' }}>
                  ○ {unansweredCount} Left
                </span>
              </div>

              {/* Grid of question buttons */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 1fr)',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                }}
              >
                {questions.map((_, idx) => {
                  const isAnswered = typeof answers[idx] === 'number';
                  const isCurrent = idx === currentQuestionIndex;

                  let bgColor = 'var(--slate-100)';
                  let textColor = 'var(--slate-700)';
                  let border = '1px solid var(--slate-300)';

                  if (isAnswered) {
                    bgColor = 'var(--primary-600)';
                    textColor = 'white';
                    border = '1px solid var(--primary-700)';
                  }
                  if (isCurrent) {
                    border = '2px solid var(--warning-500)';
                    if (!isAnswered) {
                      bgColor = 'white';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      style={{
                        padding: '0.5rem 0',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: bgColor,
                        color: textColor,
                        border: border,
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Palette Legend */}
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--slate-500)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--slate-200)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'var(--primary-600)',
                      borderRadius: '2px',
                    }}
                  />
                  <span>Answered</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'white',
                      border: '2px solid var(--warning-500)',
                      borderRadius: '2px',
                    }}
                  />
                  <span>Current Question</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: 'var(--slate-100)',
                      border: '1px solid var(--slate-300)',
                      borderRadius: '2px',
                    }}
                  />
                  <span>Unanswered</span>
                </div>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                className="btn btn-success"
                style={{ width: '100%', marginTop: '1.25rem' }}
                disabled={submitting}
              >
                Submit Examination
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal before manual submit */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title="Submit Examination?"
        onConfirm={handleManualSubmit}
        onCancel={() => setShowConfirmModal(false)}
        confirmText="Yes, Finish & Submit"
        cancelText="Return to Questions"
      >
        <div
          style={{
            backgroundColor: 'var(--slate-50)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            fontSize: '0.9rem',
          }}
        >
          <p style={{ margin: '0 0 0.4rem 0' }}>
            <b>Total Questions:</b> {totalQ}
          </p>
          <p style={{ margin: '0 0 0.4rem 0', color: 'var(--success-700)' }}>
            <b>Answered:</b> {answeredCount}
          </p>
          <p style={{ margin: 0, color: unansweredCount > 0 ? 'var(--danger-600)' : 'var(--slate-500)' }}>
            <b>Unanswered:</b> {unansweredCount}
          </p>
        </div>
        <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)', margin: 0 }}>
          Once submitted, your answers will be locked and graded automatically by the server. You cannot modify your answers after this point.
        </p>
      </ConfirmModal>

      <style>{`
        @media (max-width: 800px) {
          .exam-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
