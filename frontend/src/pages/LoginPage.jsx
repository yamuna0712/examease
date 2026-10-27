import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ setCurrentView }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      setCurrentView('dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="container-sm" style={{ padding: '3.5rem 1.5rem' }}>
      <div className="card" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '3.25rem',
              height: '3.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-700)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Sign in to ExamEase</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Access your examinations, question banks, or administrative controls
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="e.g. alex@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In →'}
          </button>
        </form>

        {/* Demo Fast-Fill helper */}
        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--slate-200)',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--slate-500)',
              marginBottom: '0.65rem',
              textAlign: 'center',
            }}
          >
            Fill Demo Credentials (Click to prefill)
          </span>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => fillDemo('student@examease.com', 'StudentPassword123!')}
              className="btn btn-sm btn-secondary"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => fillDemo('teacher@examease.com', 'TeacherPassword123!')}
              className="btn btn-sm btn-secondary"
            >
              🧑‍🏫 Teacher
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin@examease.com', 'AdminPassword123!')}
              className="btn btn-sm btn-secondary"
            >
              🛡️ Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem' }}>
          Don't have an account yet?{' '}
          <button
            onClick={() => setCurrentView('register')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-600)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
};
