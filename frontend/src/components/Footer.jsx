import React from 'react';

export const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--slate-200)',
        padding: '2rem 0',
        marginTop: 'auto',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          textAlign: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.1rem',
              color: 'var(--primary-800)',
            }}
          >
            Exam<span style={{ color: 'var(--primary-500)' }}>Ease</span>
          </span>
          <span style={{ color: 'var(--slate-400)' }}>•</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
            Empowering Modern Digital Assessments
          </span>
        </div>

        <p style={{ fontSize: '0.825rem', color: 'var(--slate-500)' }}>
          Built with React, Node.js, Express, and MongoDB. Secure, role-protected, and resilient.
        </p>

        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
          © {new Date().getFullYear()} ExamEase Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
