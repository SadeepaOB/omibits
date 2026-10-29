import { body, param, query } from 'express-validator';

const ALLOWED_LEAVE_TYPES = ['Annual', 'Casual', 'Medical'];

/**
 * Validation rules for creating a leave request: POST /api/leaves
 */
export const validateCreateLeave = [
  body('employeeId')
    .exists({ checkFalsy: true })
    .withMessage('Employee ID is required.')
    .isInt({ min: 1 })
    .withMessage('Employee ID must be a positive integer.')
    .toInt(),

  body('leaveType')
    .exists({ checkFalsy: true })
    .withMessage('Leave type is required.')
    .trim()
    .isIn(ALLOWED_LEAVE_TYPES)
    .withMessage(`Leave type must be one of: ${ALLOWED_LEAVE_TYPES.join(', ')}.`),

  body('startDate')
    .exists({ checkFalsy: true })
    .withMessage('Start date is required.')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('Start date must be a valid calendar date in YYYY-MM-DD format.'),

  body('endDate')
    .exists({ checkFalsy: true })
    .withMessage('End date is required.')
    .isISO8601({ strict: true, strictSeparator: true })
    .withMessage('End date must be a valid calendar date in YYYY-MM-DD format.')
    .custom((endDate, { req }) => {
      if (req.body.startDate && endDate < req.body.startDate) {
        throw new Error('End date must be on or after start date.');
      }
      return true;
    }),

  body('reason')
    .exists({ checkFalsy: true })
    .withMessage('Leave reason is required.')
    .isString()
    .withMessage('Leave reason must be text.')
    .trim()
    .notEmpty()
    .withMessage('Leave reason cannot be blank.'),
];

/**
 * Validation rules for rejecting a leave request: PATCH /api/leaves/:id/reject
 */
export const validateRejectLeave = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Leave request ID must be a positive integer.')
    .toInt(),

  body('rejectionReason')
    .exists({ checkFalsy: true })
    .withMessage('A rejection reason is required.')
    .isString()
    .withMessage('Rejection reason must be text.')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason cannot be blank.'),
];

/**
 * Validation rules for approving a leave request: PATCH /api/leaves/:id/approve
 */
export const validateApproveLeave = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Leave request ID must be a positive integer.')
    .toInt(),
];
