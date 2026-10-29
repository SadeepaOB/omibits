import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import ConfirmationDialog from '../components/ConfirmationDialog';
import RejectModal from '../components/RejectModal';
import EmployeeModal from '../components/EmployeeModal';
import LeaveModal from '../components/LeaveModal';
import { ToastProvider } from '../components/Toast';
import * as client from '../api/client';

// Mock the API client
vi.mock('../api/client', async () => {
  const actual = await vi.importActual('../api/client');
  return {
    ...actual,
    createEmployee: vi.fn(),
    createLeave: vi.fn(),
    getEmployees: vi.fn().mockResolvedValue([
      { id: 1, name: 'Kasun Perera', email: 'kasun@example.com', department: 'Engineering' },
    ]),
  };
});

describe('Frontend Component & Form Tests', () => {
  // 1. StatusBadge Rendering
  describe('StatusBadge Component', () => {
    it('renders Approved status badge with correct text and class', () => {
      render(<StatusBadge status="Approved" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Approved');
      expect(badge).toHaveClass('approved');
    });

    it('renders Pending status badge with correct text and class', () => {
      render(<StatusBadge status="Pending" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Pending');
      expect(badge).toHaveClass('pending');
    });

    it('renders Rejected status badge with correct text and class', () => {
      render(<StatusBadge status="Rejected" />);
      const badge = screen.getByRole('status');
      expect(badge).toHaveTextContent('Rejected');
      expect(badge).toHaveClass('rejected');
    });
  });

  // 2. Loading and Error / Empty States
  describe('Loading and Empty States', () => {
    it('renders LoadingSpinner with custom message', () => {
      render(<LoadingSpinner message="Fetching live records..." />);
      expect(screen.getByText('Fetching live records...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders EmptyState with title, description, and action button', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="No employees found"
          description="Click to register an employee"
          actionLabel="Add One"
          onAction={handleAction}
        />
      );

      expect(screen.getByText('No employees found')).toBeInTheDocument();
      expect(screen.getByText('Click to register an employee')).toBeInTheDocument();

      const btn = screen.getByRole('button', { name: 'Add One' });
      fireEvent.click(btn);
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  // 3. Confirmation Dialog
  describe('ConfirmationDialog Component', () => {
    it('triggers onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      const onClose = vi.fn();

      render(
        <ConfirmationDialog
          isOpen={true}
          title="Approve Request"
          message="Confirm approval?"
          onConfirm={onConfirm}
          onClose={onClose}
        />
      );

      expect(screen.getByText('Approve Request')).toBeInTheDocument();
      expect(screen.getByText('Confirm approval?')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  // 4. RejectModal Validation
  describe('RejectModal Component', () => {
    const mockLeave = {
      id: 5,
      employee_name: 'Kasun Perera',
      employee_department: 'Engineering',
      leave_type: 'Annual',
      start_date: '2026-11-01',
      end_date: '2026-11-04',
      reason: 'Holiday',
    };

    it('requires a non-empty rejection reason before submission', async () => {
      const onConfirm = vi.fn();
      render(
        <RejectModal
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={onConfirm}
          leaveRequest={mockLeave}
        />
      );

      expect(screen.getByText('Reject Leave Request')).toBeInTheDocument();
      expect(screen.getByText(/Kasun Perera/)).toBeInTheDocument();

      // Submit button is disabled when reason is empty
      const submitBtn = screen.getByRole('button', { name: 'Confirm Rejection' });
      expect(submitBtn).toBeDisabled();

      // Enter a reason and submit
      const textarea = screen.getByLabelText(/Rejection Reason/i);
      fireEvent.change(textarea, { target: { value: 'Project deadline conflict.' } });

      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);

      expect(onConfirm).toHaveBeenCalledWith(5, 'Project deadline conflict.');
    });
  });

  // 5. Employee Form Validation
  describe('EmployeeModal Form Validation', () => {
    it('validates required fields and invalid email format', async () => {
      render(
        <ToastProvider>
          <EmployeeModal
            isOpen={true}
            onClose={vi.fn()}
            onEmployeeCreated={vi.fn()}
          />
        </ToastProvider>
      );

      const submitBtn = screen.getByRole('button', { name: 'Add Employee' });

      // Click submit with empty fields
      fireEvent.click(submitBtn);

      expect(await screen.findByText('Employee name is required.')).toBeInTheDocument();
      expect(await screen.findByText('Email address is required.')).toBeInTheDocument();

      // Enter invalid email
      const emailInput = screen.getByLabelText(/Email Address/i);
      fireEvent.change(emailInput, { target: { value: 'not-valid' } });

      const nameInput = screen.getByLabelText(/Full Name/i);
      fireEvent.change(nameInput, { target: { value: 'Nuwan Silva' } });

      fireEvent.click(submitBtn);
      expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    });
  });

  // 6. Leave Request Form Validation
  describe('LeaveModal Form Validation', () => {
    it('validates that end date cannot be earlier than start date', async () => {
      render(
        <ToastProvider>
          <LeaveModal
            isOpen={true}
            onClose={vi.fn()}
            onLeaveCreated={vi.fn()}
          />
        </ToastProvider>
      );

      // Wait for employees to load
      await waitFor(() => {
        expect(client.getEmployees).toHaveBeenCalled();
      });

      const startDateInput = screen.getByLabelText(/Start Date/i);
      const endDateInput = screen.getByLabelText(/End Date/i);
      const reasonInput = screen.getByLabelText(/Reason for Leave/i);

      fireEvent.change(startDateInput, { target: { value: '2026-11-10' } });
      fireEvent.change(endDateInput, { target: { value: '2026-11-05' } }); // Before start date
      fireEvent.change(reasonInput, { target: { value: 'Vacation' } });

      const submitBtn = screen.getByRole('button', { name: 'Submit Request' });
      fireEvent.click(submitBtn);

      expect(await screen.findByText('End date must be on or after start date.')).toBeInTheDocument();
    });
  });
});
