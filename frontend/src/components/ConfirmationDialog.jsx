import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'success' | 'danger'
  isLoading = false,
}) {
  if (!isOpen) return null;

  const btnClass =
    confirmVariant === 'danger'
      ? 'btn-danger'
      : confirmVariant === 'success'
      ? 'btn-success'
      : 'btn-primary';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="modal-content" style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <h3 id="dialog-title">{title}</h3>
          <button onClick={onClose} className="modal-close-btn" disabled={isLoading} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
            {message}
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={`btn ${btnClass}`} disabled={isLoading}>
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationDialog;
