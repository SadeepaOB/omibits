import express from 'express';
import {
  createLeave,
  getLeaves,
  approveLeave,
  rejectLeave,
} from '../controllers/leaveController.js';
import {
  validateCreateLeave,
  validateApproveLeave,
  validateRejectLeave,
} from '../validators/leaveValidator.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * Required Endpoint: POST /api/leaves
 * Submit a new leave request.
 */
router.post('/leaves', validateCreateLeave, validate, createLeave);

/**
 * Required Endpoint: GET /api/leaves
 * List all leave requests with optional filters (status, leaveType, department, search, limit, page).
 */
router.get('/leaves', getLeaves);

/**
 * Required Endpoint: PATCH /api/leaves/:id/approve
 * Approve a pending leave request.
 */
router.patch('/leaves/:id/approve', validateApproveLeave, validate, approveLeave);

/**
 * Required Endpoint: PATCH /api/leaves/:id/reject
 * Reject a pending leave request with a mandatory rejectionReason.
 */
router.patch('/leaves/:id/reject', validateRejectLeave, validate, rejectLeave);

export default router;
