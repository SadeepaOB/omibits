import React, { useState, useEffect } from 'react';
import { X, CalendarPlus } from 'lucide-react';
import { createLeave, getEmployees, getErrorMessage } from '../api/client';
import { useToast } from './Toast';

const LEAVE_TYPES = ['Annual', 'Casual', 'Medical'];

export function LeaveModal({ isOpen, onClose, onLeaveCreated }) {
  const { showSuccess, showError } = useToast();

  const [employees, setEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'Annual',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      loadEmployees();
    }
  }, [isOpen]);

  const loadEmployees = async () => {
    setIsLoadingEmployees(true);
    try {
      const data = await getEmployees();
      setEmployees(data || []);
      if (data && data.length > 0 && !formData.employeeId) {
        setFormData((prev) => ({ ...prev, employeeId: data[0].id }));
      }
    } catch (err) {
      showError('Failed to load employee list: ' + getErrorMessage(err));
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Please select an employee.';
    }

    if (!formData.leaveType) {
      newErrors.leaveType = 'Please select a leave type.';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required.';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required.';
    } else if (formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be on or after start date.';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Please provide a reason for the leave.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newLeave = await createLeave({
        employeeId: Number(formData.employeeId),
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason.trim(),
      });

      showSuccess('Leave request submitted successfully!');
      // Reset form
      setFormData({
        employeeId: employees[0]?.id || '',
        leaveType: 'Annual',
        startDate: '',
        endDate: '',
        reason: '',
      });
      setErrors({});
      onLeaveCreated(newLeave);
      onClose();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-leave-title">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarPlus size={20} color="var(--color-primary)" />
            <h3 id="modal-leave-title">New Leave Request</h3>
          </div>
          <button onClick={handleClose} className="modal-close-btn" disabled={isSubmitting} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {/* Employee selection */}
            <div className="form-group">
              <label htmlFor="leave-emp">
                Select Employee <span className="required">*</span>
              </label>
              <select
                id="leave-emp"
                value={formData.employeeId}
                onChange={(e) => {
                  setFormData({ ...formData, employeeId: e.target.value });
                  if (errors.employeeId) setErrors({ ...errors, employeeId: '' });
                }}
                disabled={isSubmitting || isLoadingEmployees}
                required
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.department} - {emp.email})
                  </option>
                ))}
              </select>
              {errors.employeeId && <span className="form-error">{errors.employeeId}</span>}
              {employees.length === 0 && !isLoadingEmployees && (
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  No employees found. Please add an employee first.
                </span>
              )}
            </div>

            {/* Leave type */}
            <div className="form-group">
              <label htmlFor="leave-type">
                Leave Type <span className="required">*</span>
              </label>
              <select
                id="leave-type"
                value={formData.leaveType}
                onChange={(e) => {
                  setFormData({ ...formData, leaveType: e.target.value });
                  if (errors.leaveType) setErrors({ ...errors, leaveType: '' });
                }}
                disabled={isSubmitting}
              >
                {LEAVE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type} Leave
                  </option>
                ))}
              </select>
              {errors.leaveType && <span className="form-error">{errors.leaveType}</span>}
            </div>

            {/* Date range grid */}
            <div className="form-grid-2">
              <div className="form-group">
                <label htmlFor="leave-start">
                  Start Date <span className="required">*</span>
                </label>
                <input
                  id="leave-start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => {
                    setFormData({ ...formData, startDate: e.target.value });
                    if (errors.startDate) setErrors({ ...errors, startDate: '' });
                  }}
                  disabled={isSubmitting}
                  required
                />
                {errors.startDate && <span className="form-error">{errors.startDate}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="leave-end">
                  End Date <span className="required">*</span>
                </label>
                <input
                  id="leave-end"
                  type="date"
                  value={formData.endDate}
                  min={formData.startDate || undefined}
                  onChange={(e) => {
                    setFormData({ ...formData, endDate: e.target.value });
                    if (errors.endDate) setErrors({ ...errors, endDate: '' });
                  }}
                  disabled={isSubmitting}
                  required
                />
                {errors.endDate && <span className="form-error">{errors.endDate}</span>}
              </div>
            </div>

            {/* Reason */}
            <div className="form-group">
              <label htmlFor="leave-reason">
                Reason for Leave <span className="required">*</span>
              </label>
              <textarea
                id="leave-reason"
                rows={3}
                placeholder="State the reason for this leave request..."
                value={formData.reason}
                onChange={(e) => {
                  setFormData({ ...formData, reason: e.target.value });
                  if (errors.reason) setErrors({ ...errors, reason: '' });
                }}
                disabled={isSubmitting}
                required
              />
              {errors.reason && <span className="form-error">{errors.reason}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || employees.length === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveModal;
