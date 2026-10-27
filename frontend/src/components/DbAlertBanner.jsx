import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkHealth } from '../services/api';

export const DbAlertBanner = () => {
  const { dbState } = useAuth();
  const [checking, setChecking] = useState(false);

  if (dbState.isConnected) return null;

  const handleRetry = async () => {
    setChecking(true);
    await checkHealth();
    setTimeout(() => setChecking(false), 600);
  };

  return (
    <div
      style={{
        backgroundColor: '#fef2f2',
        borderBottom: '2px solid #ef4444',
        padding: '0.85rem 1.5rem',
        color: '#991b1b',
        boxShadow: '0 2px 4px rgba(239, 68, 68, 0.1)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem' }}>
              Database Unavailable: MongoDB is not connected
            </strong>
            <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: '0.2rem 0 0 0' }}>
              {dbState.message ||
                'Persistent storage is required. In-memory fallback is disabled per strict integrity standards.'}
            </p>
            <div
              style={{
                fontSize: '0.8rem',
                backgroundColor: 'rgba(255,255,255,0.7)',
                padding: '0.4rem 0.6rem',
                borderRadius: '4px',
                marginTop: '0.4rem',
                display: 'inline-block',
                fontFamily: 'monospace',
              }}
            >
              Windows CMD Fix: <b>net start MongoDB</b> &nbsp;|&nbsp; Or run:{' '}
              <b>mongod --dbpath "C:\data\db"</b>
            </div>
          </div>
        </div>

        <button
          onClick={handleRetry}
          disabled={checking}
          className="btn btn-sm btn-danger"
          style={{ whiteSpace: 'nowrap' }}
        >
          {checking ? 'Checking Connection...' : '↻ Check Connection Again'}
        </button>
      </div>
    </div>
  );
};
