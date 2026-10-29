import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

export function NotFound() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
        }}
      >
        <AlertTriangle size={32} color="#dc2626" />
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
        404 - Page Not Found
      </h1>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: '440px', marginBottom: '24px' }}>
        The administrative view or resource you are looking for does not exist or may have been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={16} />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}

export default NotFound;
