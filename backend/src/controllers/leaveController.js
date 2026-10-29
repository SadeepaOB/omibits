import leaveService from '../services/leaveService.js';

/**
 * Leave Controller
 * Handles HTTP requests for leave submission, listing, approval, and rejection.
 */

/**
 * POST /api/leaves
 * Create a new leave request.
 */
export async function createLeave(req, res, next) {
  try {
    const { employeeId, leaveType, startDate, endDate, reason } = req.body;
    const leaveRequest = await leaveService.createLeaveRequest({
      employeeId,
      leaveType,
      startDate,
      endDate,
      reason,
    });

    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully.',
      data: leaveRequest,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/leaves
 * List all leave requests with filters (status, leaveType, department, search, limit, page).
 */
export async function getLeaves(req, res, next) {
  try {
    const { status, leaveType, department, search, limit, page } = req.query;

    let offset;
    let parsedLimit;

    if (limit) {
      parsedLimit = Math.max(1, parseInt(limit, 10) || 10);
      if (page) {
        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        offset = (parsedPage - 1) * parsedLimit;
      }
    }

    const leaves = await leaveService.getAllLeaves({
      status,
      leaveType,
      department,
      search,
      limit: parsedLimit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: leaves,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/leaves/:id/approve
 * Approve a pending leave request.
 */
export async function approveLeave(req, res, next) {
  try {
    const { id } = req.params;
    const approved = await leaveService.approveLeaveRequest(id);

    return res.status(200).json({
      success: true,
      message: 'Leave request approved successfully.',
      data: approved,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/leaves/:id/reject
 * Reject a pending leave request with a mandatory rejection reason.
 */
export async function rejectLeave(req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejected = await leaveService.rejectLeaveRequest(id, rejectionReason);

    return res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully.',
      data: rejected,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  createLeave,
  getLeaves,
  approveLeave,
  rejectLeave,
};
