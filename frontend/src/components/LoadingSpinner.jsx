import React from 'react';

export function LoadingSpinner({ message = 'Loading data...' }) {
  return (
    <div className="loading-box" role="status" aria-live="polite">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}

export default LoadingSpinner;
