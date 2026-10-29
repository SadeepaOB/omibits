import { query } from '../config/db.js';
import supabase from '../config/supabase.js';

/**
 * Leave Request Repository
 * Handles direct database operations for the `leave_requests` table.
 * Supports direct Supabase Data API client as well as standard PostgreSQL pool (pg).
 */

const useSupabaseClient = () => {
  return Boolean(supabase && !process.env.DATABASE_URL && process.env.NODE_ENV !== 'test');
};

/**
 * Insert a new leave request.
 * Starts with default status 'Pending'.
 * @param {Object} leaveData - { employeeId, leaveType, startDate, endDate, reason }
 * @returns {Promise<Object>} Created leave request row
 */
export async function create({ employeeId, leaveType, startDate, endDate, reason }) {
  if (useSupabaseClient()) {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert([
        {
          employee_id: employeeId,
          leave_type: leaveType,
          start_date: startDate,
          end_date: endDate,
          reason,
          status: 'Pending',
        },
      ])
      .select('id, employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at, updated_at')
      .single();

    if (error) throw error;
    return data;
  }

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
  if (useSupabaseClient()) {
    let q = supabase
      .from('leave_requests')
      .select(`
        id,
        employee_id,
        leave_type,
        start_date,
        end_date,
        reason,
        status,
        rejection_reason,
        created_at,
        updated_at,
        employees (
          name,
          email,
          department
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status.trim() !== '') {
      q = q.eq('status', status.trim());
    }
    if (leaveType && leaveType.trim() !== '') {
      q = q.eq('leave_type', leaveType.trim());
    }
    if (department && department.trim() !== '') {
      q = q.eq('employees.department', department.trim());
    }
    if (search && search.trim() !== '') {
      const term = search.trim();
      q = q.or(`reason.ilike.%${term}%,employees.name.ilike.%${term}%,employees.email.ilike.%${term}%`);
    }

    if (limit) {
      const from = offset || 0;
      const to = from + Number(limit) - 1;
      q = q.range(from, to);
    }

    const { data, error } = await q;
    if (error) throw error;

    return (data || []).map((row) => ({
      id: row.id,
      employee_id: row.employee_id,
      employee_name: row.employees?.name || '',
      employee_email: row.employees?.email || '',
      employee_department: row.employees?.department || '',
      leave_type: row.leave_type,
      start_date: row.start_date,
      end_date: row.end_date,
      reason: row.reason,
      status: row.status,
      rejection_reason: row.rejection_reason,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

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
 * Count leave requests matching filter criteria.
 * @param {Object} filters
 * @returns {Promise<number>}
 */
export async function countFiltered({ status, leaveType, department, search } = {}) {
  if (useSupabaseClient()) {
    let q = supabase
      .from('leave_requests')
      .select('*, employees!inner(department)', { count: 'exact', head: true });

    if (status && status.trim() !== '') {
      q = q.eq('status', status.trim());
    }
    if (leaveType && leaveType.trim() !== '') {
      q = q.eq('leave_type', leaveType.trim());
    }
    if (department && department.trim() !== '') {
      q = q.eq('employees.department', department.trim());
    }

    const { count, error } = await q;
    if (error) throw error;
    return count || 0;
  }

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
  if (useSupabaseClient()) {
    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        id,
        employee_id,
        leave_type,
        start_date,
        end_date,
        reason,
        status,
        rejection_reason,
        created_at,
        updated_at,
        employees (
          name,
          email,
          department
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      employee_id: data.employee_id,
      employee_name: data.employees?.name || '',
      employee_email: data.employees?.email || '',
      employee_department: data.employees?.department || '',
      leave_type: data.leave_type,
      start_date: data.start_date,
      end_date: data.end_date,
      reason: data.reason,
      status: data.status,
      rejection_reason: data.rejection_reason,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

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
 * Uses conditional update: only updates when status = 'Pending'.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function approveAtomic(id) {
  if (useSupabaseClient()) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'Approved',
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'Pending')
      .select('id, employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at, updated_at')
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

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
 * Uses conditional update: only updates when status = 'Pending'.
 * @param {number|string} id
 * @param {string} rejectionReason
 * @returns {Promise<Object|null>}
 */
export async function rejectAtomic(id, rejectionReason) {
  if (useSupabaseClient()) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status: 'Rejected',
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'Pending')
      .select('id, employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at, updated_at')
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

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
 * Aggregate dashboard statistics in a single query.
 * @returns {Promise<Object>} Summary counts
 */
export async function getDashboardStats() {
  if (useSupabaseClient()) {
    const [empRes, allLeaves, pendingLeaves, approvedLeaves, rejectedLeaves] = await Promise.all([
      supabase.from('employees').select('*', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Approved'),
      supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Rejected'),
    ]);

    return {
      totalEmployees: empRes.count || 0,
      totalRequests: allLeaves.count || 0,
      pendingRequests: pendingLeaves.count || 0,
      approvedRequests: approvedLeaves.count || 0,
      rejectedRequests: rejectedLeaves.count || 0,
    };
  }

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
