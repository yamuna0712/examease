import React from 'react';

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: isDanger ? '#fee2e2' : 'var(--primary-100)',
              color: isDanger ? 'var(--danger-600)' : 'var(--primary-700)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {isDanger ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{title}</h3>
            {message && (
              <p style={{ color: 'var(--slate-600)', fontSize: '0.925rem', marginBottom: '1rem' }}>
                {message}
              </p>
            )}
            {children}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
          }}
        >
          <button onClick={onCancel} className="btn btn-secondary">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
