import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { createEmployee, getErrorMessage } from '../api/client';
import { useToast } from './Toast';

const DEPARTMENTS = [
  'Engineering',
  'Quality Assurance',
  'Product Management',
  'Human Resources',
  'Finance',
  'Marketing',
  'Operations',
];

const EMPLOYEE_TYPES = [
  { value: 'Employee', label: 'Employee' },
  { value: 'Admin',    label: 'Admin'    },
];

export function EmployeeModal({ isOpen, onClose, onEmployeeCreated }) {
  const { showSuccess, showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    employee_type: 'Employee',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Employee name is required.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email address.';
      }
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const newEmployee = await createEmployee({
        name: formData.name.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        employee_type: formData.employee_type,
      });

      showSuccess(`Employee '${newEmployee.name}' created successfully!`);
      // Reset form
      setFormData({ name: '', email: '', department: 'Engineering', employee_type: 'Employee' });
      setErrors({});
      onEmployeeCreated(newEmployee);
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      showError(msg);
      if (msg.toLowerCase().includes('already exists')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-emp-title">
      <div className="modal-content">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={20} color="var(--color-primary)" />
            <h3 id="modal-emp-title">Add New Employee</h3>
          </div>
          <button onClick={handleClose} className="modal-close-btn" disabled={isSubmitting} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="emp-name">
                Full Name <span className="required">*</span>
              </label>
              <input
                id="emp-name"
                type="text"
                placeholder="e.g. Kasun Perera"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                disabled={isSubmitting}
                required
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="emp-email">
                Email Address <span className="required">*</span>
              </label>
              <input
                id="emp-email"
                type="email"
                placeholder="e.g. kasun.perera@omibits.com"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: '' });
                }}
                disabled={isSubmitting}
                required
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="emp-dept">
                Department <span className="required">*</span>
              </label>
              <select
                id="emp-dept"
                value={formData.department}
                onChange={(e) => {
                  setFormData({ ...formData, department: e.target.value });
                  if (errors.department) setErrors({ ...errors, department: '' });
                }}
                disabled={isSubmitting}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && <span className="form-error">{errors.department}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="emp-type">
                Employee Type <span className="required">*</span>
              </label>
              <select
                id="emp-type"
                value={formData.employee_type}
                onChange={(e) => setFormData({ ...formData, employee_type: e.target.value })}
                disabled={isSubmitting}
              >
                {EMPLOYEE_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn btn-secondary" disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EmployeeModal;
