import { query } from '../config/db.js';

/**
 * Leave Request Repository
 * Handles all direct database operations for the `leave_requests` table.
 * All queries use parameterized inputs ($1, $2, ...) to prevent SQL injection.
 */

/**
 * Insert a new leave request.
 * Starts with default status 'Pending'.
 * @param {Object} leaveData - { employeeId, leaveType, startDate, endDate, reason }
 * @returns {Promise<Object>} Created leave request row
 */
export async function create({ employeeId, leaveType, startDate, endDate, reason }) {
  const sql = `
    INSERT INTO leave_requests (
      employee_id, leave_type, start_date, end_date, reason, status, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, 'Pending', NOW(), NOW())
    RETURNING id, employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at, updated_at;
  `;
  const result = await query(sql, [employeeId, leaveType, startDate, endDate, reason]);
  return result.rows[0];
}

/**
 * Find all leave requests joined with employee information.
 * Supports filtering by status, leaveType, department, search term, and optional pagination.
 * @param {Object} filters - { status, leaveType, department, search, limit, offset }
 * @returns {Promise<Array>} List of leave requests with employee details
 */
export async function findAll({ status, leaveType, department, search, limit, offset } = {}) {
  let sql = `
    SELECT 
      lr.id,
      lr.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department AS employee_department,
      lr.leave_type,
      lr.start_date,
      lr.end_date,
      lr.reason,
      lr.status,
      lr.rejection_reason,
      lr.created_at,
      lr.updated_at
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
  `;

  const whereConditions = [];
  const params = [];

  if (status && status.trim() !== '') {
    params.push(status.trim());
    whereConditions.push(`lr.status = $${params.length}`);
  }

  if (leaveType && leaveType.trim() !== '') {
    params.push(leaveType.trim());
    whereConditions.push(`lr.leave_type = $${params.length}`);
  }

  if (department && department.trim() !== '') {
    params.push(department.trim());
    whereConditions.push(`e.department = $${params.length}`);
  }

  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    whereConditions.push(`(e.name ILIKE $${idx} OR e.email ILIKE $${idx} OR lr.reason ILIKE $${idx})`);
  }

  if (whereConditions.length > 0) {
    sql += ` WHERE ` + whereConditions.join(' AND ');
  }

  sql += ` ORDER BY lr.created_at DESC`;

  if (limit !== undefined && limit !== null) {
    params.push(Number(limit));
    sql += ` LIMIT $${params.length}`;

    if (offset !== undefined && offset !== null) {
      params.push(Number(offset));
      sql += ` OFFSET $${params.length}`;
    }
  }

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Count leave requests matching filter criteria (useful for pagination or counts).
 * @param {Object} filters
 * @returns {Promise<number>}
 */
export async function countFiltered({ status, leaveType, department, search } = {}) {
  let sql = `
    SELECT COUNT(*)::int AS count
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
  `;

  const whereConditions = [];
  const params = [];

  if (status && status.trim() !== '') {
    params.push(status.trim());
    whereConditions.push(`lr.status = $${params.length}`);
  }

  if (leaveType && leaveType.trim() !== '') {
    params.push(leaveType.trim());
    whereConditions.push(`lr.leave_type = $${params.length}`);
  }

  if (department && department.trim() !== '') {
    params.push(department.trim());
    whereConditions.push(`e.department = $${params.length}`);
  }

  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    const idx = params.length;
    whereConditions.push(`(e.name ILIKE $${idx} OR e.email ILIKE $${idx} OR lr.reason ILIKE $${idx})`);
  }

  if (whereConditions.length > 0) {
    sql += ` WHERE ` + whereConditions.join(' AND ');
  }

  const result = await query(sql, params);
  return result.rows[0].count;
}

/**
 * Find a single leave request by ID, including employee details.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function findById(id) {
  const sql = `
    SELECT 
      lr.id,
      lr.employee_id,
      e.name AS employee_name,
      e.email AS employee_email,
      e.department AS employee_department,
      lr.leave_type,
      lr.start_date,
      lr.end_date,
      lr.reason,
      lr.status,
      lr.rejection_reason,
      lr.created_at,
      lr.updated_at
    FROM leave_requests lr
    JOIN employees e ON lr.employee_id = e.id
    WHERE lr.id = $1;
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

/**
 * Atomically approve a pending leave request.
 * Uses conditional SQL: only updates when status = 'Pending'.
 * This guarantees race-condition safety and idempotency.
 * @param {number|string} id
 * @returns {Promise<Object|null>} Updated row if successful, null if not pending/not found
 */
export async function approveAtomic(id) {
  const sql = `
    UPDATE leave_requests
    SET status = 'Approved', rejection_reason = NULL, updated_at = NOW()
    WHERE id = $1 AND status = 'Pending'
    RETURNING id, employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at, updated_at;
  `;
  const result = await query(sql, [id]);
  return result.rows[0] || null;
}

/**
 * Atomically reject a pending leave request with a mandatory rejection reason.
 * Uses conditional SQL: only updates when status = 'Pending'.
 * @param {number|string} id
 * @param {string} rejectionReason
 * @returns {Promise<Object|null>} Updated row if successful, null if not pending/not found
 */
export async function rejectAtomic(id, rejectionReason) {
  const sql = `
    UPDATE leave_requests
    SET status = 'Rejected', rejection_reason = $2, updated_at = NOW()
    WHERE id = $1 AND status = 'Pending'
    RETURNING id, employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at, updated_at;
  `;
  const result = await query(sql, [id, rejectionReason]);
  return result.rows[0] || null;
}

/**
 * Aggregate dashboard statistics in a single efficient SQL query.
 * @returns {Promise<Object>} Summary counts
 */
export async function getDashboardStats() {
  const sql = `
    SELECT
      (SELECT COUNT(*)::int FROM employees) AS total_employees,
      (SELECT COUNT(*)::int FROM leave_requests) AS total_requests,
      (SELECT COUNT(*)::int FROM leave_requests WHERE status = 'Pending') AS pending_requests,
      (SELECT COUNT(*)::int FROM leave_requests WHERE status = 'Approved') AS approved_requests,
      (SELECT COUNT(*)::int FROM leave_requests WHERE status = 'Rejected') AS rejected_requests;
  `;
  const result = await query(sql);
  const row = result.rows[0];

  return {
    totalEmployees: row.total_employees,
    totalRequests: row.total_requests,
    pendingRequests: row.pending_requests,
    approvedRequests: row.approved_requests,
    rejectedRequests: row.rejected_requests,
  };
}

export default {
  create,
  findAll,
  countFiltered,
  findById,
  approveAtomic,
  rejectAtomic,
  getDashboardStats,
};
