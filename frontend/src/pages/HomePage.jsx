import React from 'react';
import { useAuth } from '../context/AuthContext';

export const HomePage = ({ setCurrentView }) => {
  const { user } = useAuth();

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)',
          color: 'white',
          padding: '4.5rem 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '720px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '0.35rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
              }}
            >
              <span style={{ color: '#93c5fd' }}>★</span> Next-Generation Assessment Platform
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
              }}
            >
              Effortless, Reliable & Student-Friendly Online Exams
            </h1>

            <p
              style={{
                fontSize: '1.15rem',
                color: '#dbeafe',
                lineHeight: 1.6,
                marginBottom: '2rem',
              }}
            >
              ExamEase delivers an intuitive examination environment with server-synchronized timers,
              instant automatic grading, and airtight security controls for students, teachers, and institutions.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {!user ? (
                <>
                  <button
                    onClick={() => setCurrentView('register')}
                    className="btn btn-lg"
                    style={{
                      backgroundColor: 'white',
                      color: 'var(--primary-800)',
                      fontWeight: 700,
                    }}
                  >
                    Get Started Free →
                  </button>
                  <button
                    onClick={() => setCurrentView('login')}
                    className="btn btn-lg"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                    }}
                  >
                    Log In to Your Portal
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="btn btn-lg"
                  style={{
                    backgroundColor: 'white',
                    color: 'var(--primary-800)',
                    fontWeight: 700,
                  }}
                >
                  Go to Your Dashboard →
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="container" style={{ marginTop: '-2.5rem', position: 'relative', zIndex: 10 }}>
        <div className="grid-cols-3">
          <div className="card card-hover" style={{ borderTop: '4px solid var(--primary-500)' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>For Students</h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.925rem', lineHeight: 1.5 }}>
              Distraction-free assessment player with a live countdown timer, clear question navigation,
              instant confirmation before submission, and immediate score breakdowns.
            </p>
          </div>

          <div className="card card-hover" style={{ borderTop: '4px solid var(--warning-500)' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#fef3c7',
                color: 'var(--warning-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>For Teachers</h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.925rem', lineHeight: 1.5 }}>
              Effortlessly author multiple-choice examinations, configure timers and pass thresholds,
              publish tests with scheduling windows, and track student submissions in real-time.
            </p>
          </div>

          <div className="card card-hover" style={{ borderTop: '4px solid var(--accent-teal)' }}>
            <div
              style={{
                width: '3rem',
                height: '3rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#ccfbf1',
                color: '#0f766e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>For Administrators</h3>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.925rem', lineHeight: 1.5 }}>
              Centralized platform metrics, role-based user management, account activation controls,
              and full visibility over institution-wide exams and performance analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Credentials Section */}
      <section className="container" style={{ marginTop: '3.5rem' }}>
        <div
          style={{
            backgroundColor: 'var(--primary-50)',
            border: '1.5px solid var(--primary-200)',
            borderRadius: 'var(--radius-lg)',
            padding: '2rem',
          }}
        >
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
              Quick Evaluation
            </span>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--primary-900)', marginBottom: '0.5rem' }}>
              Pre-configured Accounts Ready For Testing
            </h2>
            <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
              Once you run <code>npm run seed</code> in the backend, you can log in immediately using any of these roles:
            </p>

            <div className="grid-cols-3" style={{ textAlign: 'left' }}>
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--primary-800)', marginBottom: '0.35rem' }}>
                  🎓 Student Account
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                  Email: <b>student@examease.com</b><br />
                  Pass: <b>StudentPassword123!</b>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'white',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--warning-600)', marginBottom: '0.35rem' }}>
                  🧑‍🏫 Teacher Account
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                  Email: <b>teacher@examease.com</b><br />
                  Pass: <b>TeacherPassword123!</b>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'white',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--slate-200)',
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--danger-600)', marginBottom: '0.35rem' }}>
                  🛡️ Admin Account
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                  Email: <b>admin@examease.com</b><br />
                  Pass: <b>AdminPassword123!</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
