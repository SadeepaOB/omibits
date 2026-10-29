import express from 'express';
import { createEmployee, getEmployees } from '../controllers/employeeController.js';
import { validateCreateEmployee } from '../validators/employeeValidator.js';
import validate from '../middleware/validate.js';

const router = express.Router();

/**
 * Required Endpoint: POST /api/em
 * Create a new employee.
 */
router.post('/em', validateCreateEmployee, validate, createEmployee);

/**
 * Endpoint: POST /api/employees
 * Alias provided for convenience while strictly keeping /api/em.
 */
router.post('/employees', validateCreateEmployee, validate, createEmployee);

/**
 * Required Endpoint: GET /api/employees
 * List all employees.
 */
router.get('/employees', getEmployees);

export default router;
