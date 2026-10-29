import { body } from 'express-validator';

/**
 * Validation rules for creating an employee: POST /api/em
 */
export const validateCreateEmployee = [
  body('name')
    .exists({ checkFalsy: true })
    .withMessage('Employee name is required.')
    .isString()
    .withMessage('Employee name must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Employee name cannot be blank.')
    .isLength({ max: 255 })
    .withMessage('Employee name cannot exceed 255 characters.'),

  body('email')
    .exists({ checkFalsy: true })
    .withMessage('Employee email is required.')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .isLength({ max: 255 })
    .withMessage('Employee email cannot exceed 255 characters.'),

  body('department')
    .exists({ checkFalsy: true })
    .withMessage('Department is required.')
    .isString()
    .withMessage('Department must be a string.')
    .trim()
    .notEmpty()
    .withMessage('Department cannot be blank.')
    .isLength({ max: 100 })
    .withMessage('Department cannot exceed 100 characters.'),
];
