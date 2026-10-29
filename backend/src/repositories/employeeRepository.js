import { query } from '../config/db.js';
import supabase from '../config/supabase.js';

/**
 * Employee Repository
 * Handles direct database operations for the `employees` table.
 * Supports direct Supabase Data API client as well as standard PostgreSQL pool (pg).
 */

const useSupabaseClient = () => {
  return Boolean(supabase && !process.env.DATABASE_URL && process.env.NODE_ENV !== 'test');
};

/**
 * Insert a new employee into the database.
 * @param {Object} employeeData - { name, email, department }
 * @returns {Promise<Object>} Created employee row
 */
export async function create({ name, email, department }) {
  if (useSupabaseClient()) {
    const { data, error } = await supabase
      .from('employees')
      .insert([{ name, email, department }])
      .select('id, name, email, department, created_at, updated_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        const err = new Error(`An employee with email '${email}' already exists.`);
        err.code = '23505';
        throw err;
      }
      throw error;
    }
    return data;
  }

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
  if (useSupabaseClient()) {
    let q = supabase
      .from('employees')
      .select('id, name, email, department, created_at, updated_at')
      .order('id', { ascending: true });

    if (search && search.trim() !== '') {
      const term = search.trim();
      q = q.or(`name.ilike.%${term}%,email.ilike.%${term}%,department.ilike.%${term}%`);
    }

    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

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
  if (useSupabaseClient()) {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, department, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

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
  if (useSupabaseClient()) {
    const { data, error } = await supabase
      .from('employees')
      .select('id, name, email, department, created_at, updated_at')
      .ilike('email', email)
      .maybeSingle();

    if (error) throw error;
    return data || null;
  }

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
  if (useSupabaseClient()) {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;
    return count || 0;
  }

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
