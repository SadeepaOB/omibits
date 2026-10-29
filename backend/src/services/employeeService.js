import employeeRepository from '../repositories/employeeRepository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';

/**
 * Employee Service
 * Handles business rules and validation logic for employees.
 */

/**
 * Create a new employee.
 * Rules:
 * - name, email, department must not be blank.
 * - email must be unique (case-insensitive).
 * - employee_type defaults to 'Full-Time' if not provided.
 */
export async function createEmployee({ name, email, department, employee_type = 'Employee' }) {
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanDepartment = (department || '').trim();
  const cleanType = (employee_type || 'Employee').trim();

  if (!cleanName) {
    throw new BadRequestError('Employee name is required and cannot be blank.');
  }

  if (!cleanEmail) {
    throw new BadRequestError('Employee email is required.');
  }

  // Basic email pattern check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new BadRequestError('Please provide a valid email address.');
  }

  if (!cleanDepartment) {
    throw new BadRequestError('Department is required.');
  }

  const validTypes = ['Admin', 'Employee'];
  if (!validTypes.includes(cleanType)) {
    throw new BadRequestError('Employee type must be either Admin or Employee.');
  }

  // Check if an employee with this email already exists (case-insensitive)
  const existing = await employeeRepository.findByEmail(cleanEmail);
  if (existing) {
    throw new ConflictError(`An employee with email '${cleanEmail}' already exists.`);
  }

  try {
    const newEmployee = await employeeRepository.create({
      name: cleanName,
      email: cleanEmail,
      department: cleanDepartment,
      employee_type: cleanType,
    });
    return newEmployee;
  } catch (err) {
    // Catch database unique constraint violation if concurrent insert occurred
    if (err.code === '23505') {
      throw new ConflictError(`An employee with email '${cleanEmail}' already exists.`);
    }
    throw err;
  }
}

/**
 * Retrieve all employees with optional search query.
 */
export async function getAllEmployees(options = {}) {
  return employeeRepository.findAll(options);
}

/**
 * Retrieve a single employee by ID.
 */
export async function getEmployeeById(id) {
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new NotFoundError(`Employee with ID ${id} was not found.`);
  }
  return employee;
}

export default {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
};
