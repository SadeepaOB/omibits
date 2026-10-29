import { query } from '../config/db.js';

/**
 * Employee Repository
 * Handles all direct database operations for the `employees` table.
 * All queries use parameterized inputs ($1, $2, ...) to prevent SQL injection.
 */

/**
 * Insert a new employee into the database.
 * @param {Object} employeeData - { name, email, department }
 * @returns {Promise<Object>} Created employee row
 */
export async function create({ name, email, department }) {
  const sql = `
    INSERT INTO employees (name, email, department, created_at, updated_at)
    VALUES ($1, $2, $3, NOW(), NOW())
    RETURNING id, name, email, department, created_at, updated_at;
  `;
  const result = await query(sql, [name, email, department]);
  return result.rows[0];
}

/**
 * Find all employees with optional search query (matching name, email, or department).
 * @param {Object} options - { search }
 * @returns {Promise<Array>} List of employees
 */
export async function findAll({ search } = {}) {
  let sql = `
    SELECT id, name, email, department, created_at, updated_at
    FROM employees
  `;
  const params = [];

  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    sql += ` WHERE (name ILIKE $1 OR email ILIKE $1 OR department ILIKE $1)`;
  }

  sql += ` ORDER BY id ASC;`;

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Find an employee by their unique ID.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function findById(id) {
  const sql = `
    SELECT id, name, email, department, created_at, updated_at
    FROM employees
    WHERE id = $1;
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

/**
 * Find an employee by email address (case-insensitive search).
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function findByEmail(email) {
  const sql = `
    SELECT id, name, email, department, created_at, updated_at
    FROM employees
    WHERE LOWER(email) = LOWER($1);
  `;
  const result = await query(sql, [email]);
  return result.rows[0] || null;
}

/**
 * Get total employee count for dashboard statistics.
 * @returns {Promise<number>}
 */
export async function countAll() {
  const sql = `SELECT COUNT(*)::int AS count FROM employees;`;
  const result = await query(sql);
  return result.rows[0].count;
}

export default {
  create,
  findAll,
  findById,
  findByEmail,
  countAll,
};
