import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const Navbar = ({ currentView, setCurrentView }) => {
  const { user, logout, isStudent, isTeacher, isAdmin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (view) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--slate-200)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '4.25rem',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => handleNav(user ? 'dashboard' : 'home')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <div>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--primary-800)',
                letterSpacing: '-0.02em',
              }}
            >
              Exam<span style={{ color: 'var(--primary-500)' }}>Ease</span>
            </span>
            <span
              style={{
                display: 'block',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: 'var(--slate-500)',
                letterSpacing: '0.08em',
                lineHeight: 1,
              }}
            >
              Online Examination System
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.25rem',
          }}
          className="desktop-nav"
        >
          {!user ? (
            <>
              <button
                onClick={() => handleNav('home')}
                className={`btn btn-sm ${
                  currentView === 'home' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => handleNav('login')}
                className={`btn btn-sm ${
                  currentView === 'login' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('register')}
                className="btn btn-sm btn-primary"
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleNav('dashboard')}
                className={`btn btn-sm ${
                  currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'
                }`}
              >
                {isStudent && 'Available Exams'}
                {isTeacher && 'Teacher Portal'}
                {isAdmin && 'Admin Portal'}
              </button>

              {isStudent && (
                <button
                  onClick={() => handleNav('attempts')}
                  className={`btn btn-sm ${
                    currentView === 'attempts' ? 'btn-primary' : 'btn-secondary'
                  }`}
                >
                  My Results
                </button>
              )}

              {/* User badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  backgroundColor: 'var(--slate-100)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--success-500)',
                  }}
                />
                <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                  {user.name}
                </span>
                <span
                  className={`badge ${
                    isAdmin
                      ? 'badge-danger'
                      : isTeacher
                      ? 'badge-warning'
                      : 'badge-primary'
                  }`}
                  style={{ fontSize: '0.65rem' }}
                >
                  {user.role}
                </span>
              </div>

              <button
                onClick={() => {
                  logout();
                  handleNav('login');
                }}
                className="btn btn-sm btn-secondary"
                title="Log out of ExamEase"
              >
                Log Out
              </button>
            </>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="btn btn-sm btn-secondary mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div
          style={{
            borderTop: '1px solid var(--slate-200)',
            backgroundColor: 'white',
            padding: '1rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          {!user ? (
            <>
              <button
                onClick={() => handleNav('home')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Home
              </button>
              <button
                onClick={() => handleNav('login')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('register')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                Create Account
              </button>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: '0.5rem 0',
                  borderBottom: '1px solid var(--slate-200)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontWeight: 600 }}>{user.name}</span>
                <span
                  className={`badge ${
                    isAdmin
                      ? 'badge-danger'
                      : isTeacher
                      ? 'badge-warning'
                      : 'badge-primary'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <button
                onClick={() => handleNav('dashboard')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Dashboard
              </button>
              {isStudent && (
                <button
                  onClick={() => handleNav('attempts')}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  My Results
                </button>
              )}
              <button
                onClick={() => {
                  logout();
                  handleNav('login');
                }}
                className="btn btn-danger"
                style={{ width: '100%' }}
              >
                Log Out
              </button>
            </>
          )}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </header>
  );
};
