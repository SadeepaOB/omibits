import { validationResult } from 'express-validator';

/**
 * Middleware that checks for express-validator validation errors.
 * Returns HTTP 400 with field-level details if validation fails.
 */
export function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0]?.message || 'Validation failed.',
      errors: formattedErrors,
    });
  }
  next();
}

export default validate;
