import leaveRepository from '../repositories/leaveRepository.js';
import employeeRepository from '../repositories/employeeRepository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';

const ALLOWED_LEAVE_TYPES = ['Annual', 'Casual', 'Medical'];

/**
 * Leave Request Service
 * Implements business rules for leave requests and status transitions.
 */

/**
 * Submit a new leave request.
 * Rules:
 * - Employee must exist.
 * - Leave type must be Annual, Casual, or Medical.
 * - Dates must be valid calendar dates.
 * - End date must be on or after start date.
 * - Reason cannot be blank.
 * - New requests always start with status 'Pending'.
 */
export async function createLeaveRequest({ employeeId, leaveType, startDate, endDate, reason }) {
  if (!employeeId) {
    throw new BadRequestError('Employee ID is required.');
  }

  // Verify that the employee exists
  const employee = await employeeRepository.findById(employeeId);
  if (!employee) {
    throw new NotFoundError(`Employee with ID ${employeeId} does not exist.`);
  }

  // Verify leave type
  if (!leaveType || !ALLOWED_LEAVE_TYPES.includes(leaveType)) {
    throw new BadRequestError(`Invalid leave type. Allowed types are: ${ALLOWED_LEAVE_TYPES.join(', ')}.`);
  }

  // Verify dates
  if (!startDate || !endDate) {
    throw new BadRequestError('Both start date and end date are required.');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new BadRequestError('Invalid date format. Please provide valid calendar dates (YYYY-MM-DD).');
  }

  // Compare date strings (or day-level timestamps) to ensure end_date >= start_date
  if (startDate > endDate) {
    throw new BadRequestError('End date must be on or after start date.');
  }

  const cleanReason = (reason || '').trim();
  if (!cleanReason) {
    throw new BadRequestError('Reason for leave is required and cannot be blank.');
  }

  // Insert into database
  const created = await leaveRepository.create({
    employeeId,
    leaveType,
    startDate,
    endDate,
    reason: cleanReason,
  });

  // Return the full record joined with employee information
  const fullRecord = await leaveRepository.findById(created.id);
  return fullRecord || created;
}

/**
 * List all leave requests with optional filters.
 */
export async function getAllLeaves(filters = {}) {
  return leaveRepository.findAll(filters);
}

/**
 * Retrieve a single leave request by ID.
 */
export async function getLeaveById(id) {
  const leave = await leaveRepository.findById(id);
  if (!leave) {
    throw new NotFoundError(`Leave request with ID ${id} was not found.`);
  }
  return leave;
}

/**
 * Approve a pending leave request.
 * Business rules:
 * - Only Pending requests can be approved.
 * - Cannot approve an already Approved request (idempotency/conflict).
 * - Cannot approve a Rejected request.
 */
export async function approveLeaveRequest(id) {
  // Attempt atomic conditional update: only update if status = 'Pending'
  const updated = await leaveRepository.approveAtomic(id);

  if (updated) {
    // Return with employee details
    return leaveRepository.findById(updated.id);
  }

  // If no row was updated, inspect why
  const existing = await leaveRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`Leave request with ID ${id} was not found.`);
  }

  if (existing.status === 'Approved') {
    throw new ConflictError('This leave request has already been Approved and cannot be approved again.');
  }

  if (existing.status === 'Rejected') {
    throw new ConflictError('This leave request has already been Rejected and cannot be approved.');
  }

  throw new ConflictError(`Cannot approve leave request currently in '${existing.status}' status.`);
}

/**
 * Reject a pending leave request.
 * Business rules:
 * - Rejection reason is mandatory and cannot be blank.
 * - Only Pending requests can be rejected.
 * - Cannot reject an already Approved request.
 * - Cannot reject an already Rejected request.
 */
export async function rejectLeaveRequest(id, rejectionReason) {
  const cleanReason = (rejectionReason || '').trim();

  if (!cleanReason) {
    throw new BadRequestError('A rejection reason is required when rejecting a leave request.');
  }

  // Attempt atomic conditional update: only update if status = 'Pending'
  const updated = await leaveRepository.rejectAtomic(id, cleanReason);

  if (updated) {
    // Return with employee details
    return leaveRepository.findById(updated.id);
  }

  // If no row was updated, inspect why
  const existing = await leaveRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`Leave request with ID ${id} was not found.`);
  }

  if (existing.status === 'Approved') {
    throw new ConflictError('This leave request has already been Approved and cannot be rejected.');
  }

  if (existing.status === 'Rejected') {
    throw new ConflictError('This leave request has already been Rejected.');
  }

  throw new ConflictError(`Cannot reject leave request currently in '${existing.status}' status.`);
}

/**
 * Retrieve aggregated statistics for the dashboard.
 */
export async function getDashboardStats() {
  return leaveRepository.getDashboardStats();
}

export default {
  createLeaveRequest,
  getAllLeaves,
  getLeaveById,
  approveLeaveRequest,
  rejectLeaveRequest,
  getDashboardStats,
};
