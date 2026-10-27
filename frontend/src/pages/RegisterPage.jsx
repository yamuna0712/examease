import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = ({ setCurrentView }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (role === 'admin') {
      setError('Admin accounts cannot be self-assigned via public registration.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, role);
      setCurrentView('dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--slate-900)' }}>Create an ExamEase Account</h2>
          <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Join as a Student to take examinations, or as a Teacher to create tests
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
            <label className="form-label" htmlFor="register-name">
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              className="form-input"
              placeholder="e.g. Maya Chen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="e.g. maya@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Account Role Selector */}
          <div className="form-group">
            <label className="form-label">I want to register as:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setRole('student')}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${
                    role === 'student' ? 'var(--primary-600)' : 'var(--slate-200)'
                  }`,
                  backgroundColor: role === 'student' ? 'var(--primary-50)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🎓</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.9rem' }}>
                  Student
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Take exams & view results
                </div>
              </div>

              <div
                onClick={() => setRole('teacher')}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${
                    role === 'teacher' ? 'var(--primary-600)' : 'var(--slate-200)'
                  }`,
                  backgroundColor: role === 'teacher' ? 'var(--primary-50)' : 'white',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>🧑‍🏫</div>
                <div style={{ fontWeight: 700, color: 'var(--slate-800)', fontSize: '0.9rem' }}>
                  Teacher
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Design tests & grade
                </div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password">
              Password (min. 6 characters)
            </label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-confirm">
              Confirm Password
            </label>
            <input
              id="register-confirm"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <button
            onClick={() => setCurrentView('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary-600)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
