import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';

export const ExamResultPage = ({ attemptId, onBackToDashboard }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await apiRequest(`/attempts/${attemptId}`);
        setResult(data.attempt);
      } catch (err) {
        setError(err.message || 'Failed to load examination result.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '5rem 0', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
        <h2>Calculating your score...</h2>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="container-sm" style={{ padding: '4rem 1.5rem' }}>
        <div className="alert alert-error">
          <p>{error || 'Examination record not found.'}</p>
        </div>
        <button onClick={onBackToDashboard} className="btn btn-secondary">
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  const isPassed = result.isPassed;
  const questionsBreakdown = result.questionsBreakdown || [];

  return (
    <div className="container" style={{ padding: '3rem 1.5rem 5rem 1.5rem', maxWidth: '850px' }}>
      {/* Header Result Card */}
      <div
        className="card"
        style={{
          borderTop: `6px solid ${isPassed ? 'var(--success-500)' : 'var(--danger-500)'}`,
          padding: '2.5rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-lg)',
          marginBottom: '2rem',
        }}
      >
        <div
          style={{
            width: '4.5rem',
            height: '4.5rem',
            borderRadius: '50%',
            backgroundColor: isPassed ? '#d1fae5' : '#fee2e2',
            color: isPassed ? 'var(--success-700)' : 'var(--danger-600)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            marginBottom: '1rem',
          }}
        >
          {isPassed ? '🎉' : '⚠️'}
        </div>

        <span
          className={`badge ${isPassed ? 'badge-success' : 'badge-danger'}`}
          style={{ fontSize: '0.85rem', padding: '0.4rem 1rem', marginBottom: '0.75rem' }}
        >
          {isPassed ? 'PASSED EXAMINATION' : 'FAILED - DID NOT MEET PASS CRITERIA'}
        </span>

        <h1 style={{ fontSize: '2rem', color: 'var(--slate-900)', marginBottom: '0.25rem' }}>
          {result.examTitle}
        </h1>

        <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          Submitted on {new Date(result.submitTime || result.updatedAt).toLocaleString()}
          {result.submittedAutomatically && (
            <span style={{ color: 'var(--warning-600)', display: 'block', fontWeight: 600, marginTop: '0.2rem' }}>
              (Submitted automatically upon time expiration)
            </span>
          )}
        </p>

        {/* Score Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1rem',
            backgroundColor: 'var(--slate-50)',
            padding: '1.5rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--slate-200)',
          }}
        >
          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Marks Awarded
            </span>
            <strong style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>
              {result.totalMarksObtained} <span style={{ fontSize: '1rem', color: 'var(--slate-400)' }}>/ {result.maxPossibleMarks}</span>
            </strong>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Final Percentage
            </span>
            <strong
              style={{
                fontSize: '1.75rem',
                color: isPassed ? 'var(--success-700)' : 'var(--danger-600)',
              }}
            >
              {result.percentage}%
            </strong>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Outcome
            </span>
            <strong
              style={{
                fontSize: '1.75rem',
                color: isPassed ? 'var(--success-700)' : 'var(--danger-600)',
              }}
            >
              {isPassed ? 'Pass' : 'Needs Retake'}
            </strong>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      {questionsBreakdown.length > 0 ? (
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--slate-900)', marginBottom: '1.25rem' }}>
            Question Breakdown & Explanations
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {questionsBreakdown.map((item, idx) => {
              const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
              const isCorrect = item.isCorrect;
              const hasAnswered = typeof item.selectedOptionIndex === 'number';

              return (
                <div
                  key={idx}
                  className="card"
                  style={{
                    borderLeft: `5px solid ${
                      isCorrect ? 'var(--success-500)' : 'var(--danger-500)'
                    }`,
                    padding: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--slate-700)' }}>
                      Question {idx + 1}
                    </span>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className={`badge ${
                          isCorrect
                            ? 'badge-success'
                            : hasAnswered
                            ? 'badge-danger'
                            : 'badge-slate'
                        }`}
                      >
                        {isCorrect
                          ? 'Correct'
                          : hasAnswered
                          ? 'Incorrect'
                          : 'Skipped'}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                        +{item.marksObtained} / {item.maxMarks} marks
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '1rem', color: 'var(--slate-900)', marginBottom: '1rem', fontWeight: 500 }}>
                    {item.questionText}
                  </p>

                  {/* Options List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                    {item.options.map((opt, optIdx) => {
                      const isStudentChoice = item.selectedOptionIndex === optIdx;
                      const isCorrectChoice = item.correctOptionIndex === optIdx;

                      let optBg = 'var(--slate-50)';
                      let optBorder = 'var(--slate-200)';
                      let label = null;

                      if (isCorrectChoice) {
                        optBg = '#d1fae5';
                        optBorder = 'var(--success-500)';
                        label = '✓ Correct Answer';
                      } else if (isStudentChoice && !isCorrect) {
                        optBg = '#fee2e2';
                        optBorder = 'var(--danger-500)';
                        label = '✗ Your Choice';
                      }

                      return (
                        <div
                          key={optIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.9rem',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: optBg,
                            border: `1.5px solid ${optBorder}`,
                            fontSize: '0.9rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--slate-600)' }}>
                              {optionLetters[optIdx]}.
                            </span>
                            <span style={{ color: 'var(--slate-800)' }}>{opt}</span>
                          </div>

                          {label && (
                            <span
                              style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                color: isCorrectChoice ? 'var(--success-700)' : 'var(--danger-600)',
                              }}
                            >
                              {label}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Note */}
                  {item.explanation && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--primary-50)',
                        border: '1px solid var(--primary-200)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        color: 'var(--primary-900)',
                      }}
                    >
                      <b>Explanation:</b> {item.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: 'var(--slate-600)', margin: 0 }}>
            Detailed question breakdowns are configured to release after instructor grading review.
          </p>
        </div>
      )}

      {/* Bottom Action */}
      <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
        <button onClick={onBackToDashboard} className="btn btn-primary btn-lg">
          ← Return to Student Workspace
        </button>
      </div>
    </div>
  );
};
