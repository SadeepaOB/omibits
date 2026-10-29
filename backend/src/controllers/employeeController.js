import employeeService from '../services/employeeService.js';

/**
 * Employee Controller
 * Handles HTTP request/response cycle for employee endpoints.
 */

/**
 * POST /api/em
 * Create a new employee.
 */
export async function createEmployee(req, res, next) {
  try {
    const { name, email, department } = req.body;
    const employee = await employeeService.createEmployee({ name, email, department });

    return res.status(201).json({
      success: true,
      message: 'Employee created successfully.',
      data: employee,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/employees
 * List all employees with optional search.
 */
export async function getEmployees(req, res, next) {
  try {
    const { search } = req.query;
    const employees = await employeeService.getAllEmployees({ search });

    return res.status(200).json({
      success: true,
      data: employees,
    });
  } catch (err) {
    next(err);
  }
}

export default {
  createEmployee,
  getEmployees,
};
