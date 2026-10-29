import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  leaveRequest,
  isLoading = false,
}) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !leaveRequest) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanReason = rejectionReason.trim();

    if (!cleanReason) {
      setError('Please provide a specific rejection reason.');
      return;
    }

    setError('');
    onConfirm(leaveRequest.id, cleanReason);
  };

  const handleClose = () => {
    setRejectionReason('');
    setError('');
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="reject-title">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <h3 id="reject-title">Reject Leave Request</h3>
          </div>
          <button onClick={handleClose} className="modal-close-btn" disabled={isLoading} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
              <div><strong>Employee:</strong> {leaveRequest.employee_name} ({leaveRequest.employee_department})</div>
              <div><strong>Leave Type:</strong> {leaveRequest.leave_type}</div>
              <div><strong>Duration:</strong> {leaveRequest.start_date} to {leaveRequest.end_date}</div>
              <div><strong>Employee's Reason:</strong> {leaveRequest.reason}</div>
            </div>

            <div className="form-group">
              <label htmlFor="rejectionReason">
                Rejection Reason <span className="required">*</span>
              </label>
              <textarea
                id="rejectionReason"
                rows={4}
                placeholder="Explain clearly why this request cannot be approved (e.g. project deadline, coverage constraints)..."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  if (error) setError('');
                }}
                disabled={isLoading}
                required
              />
              {error && <span className="form-error" role="alert">{error}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-danger" disabled={isLoading || !rejectionReason.trim()}>
              {isLoading ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RejectModal;
