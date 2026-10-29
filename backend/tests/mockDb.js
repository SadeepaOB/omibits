/**
 * In-memory PostgreSQL mock database for testing.
 * Accurately simulates PostgreSQL behavior, constraints, and error codes.
 */

export function createMockDatabase() {
  let employeeIdCounter = 1;
  let leaveIdCounter = 1;

  let employees = [];
  let leaveRequests = [];

  function reset() {
    employeeIdCounter = 1;
    leaveIdCounter = 1;
    employees = [];
    leaveRequests = [];
  }

  async function mockQuery(text, params = []) {
    const cleanSql = text.replace(/\s+/g, ' ').trim();

    // 1. INSERT INTO employees
    if (cleanSql.includes('INSERT INTO employees')) {
      const [name, email, department] = params;
      // Case-insensitive unique check
      const duplicate = employees.find((e) => e.email.toLowerCase() === email.toLowerCase());
      if (duplicate) {
        const err = new Error('duplicate key value violates unique constraint "idx_employees_email_lower"');
        err.code = '23505';
        throw err;
      }
      const newEmployee = {
        id: employeeIdCounter++,
        name,
        email,
        department,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      employees.push(newEmployee);
      return { rows: [{ ...newEmployee }], rowCount: 1 };
    }

    // 2. SELECT FROM employees WHERE LOWER(email) = LOWER($1)
    if (cleanSql.includes('FROM employees WHERE LOWER(email) = LOWER($1)')) {
      const [email] = params;
      const match = employees.find((e) => e.email.toLowerCase() === (email || '').toLowerCase());
      return { rows: match ? [{ ...match }] : [], rowCount: match ? 1 : 0 };
    }

    // 3. SELECT FROM employees WHERE id = $1
    if (cleanSql.includes('FROM employees WHERE id = $1')) {
      const [id] = params;
      const match = employees.find((e) => Number(e.id) === Number(id));
      return { rows: match ? [{ ...match }] : [], rowCount: match ? 1 : 0 };
    }

    // 4. SELECT FROM employees (all with optional search)
    if (cleanSql.includes('FROM employees') && !cleanSql.includes('leave_requests')) {
      if (cleanSql.includes('COUNT(*)')) {
        return { rows: [{ count: employees.length }] };
      }
      let result = [...employees];
      if (params.length > 0 && cleanSql.includes('ILIKE')) {
        const term = params[0].replace(/%/g, '').toLowerCase();
        result = result.filter(
          (e) =>
            e.name.toLowerCase().includes(term) ||
            e.email.toLowerCase().includes(term) ||
            e.department.toLowerCase().includes(term)
        );
      }
      return { rows: result, rowCount: result.length };
    }

    // 5. INSERT INTO leave_requests
    if (cleanSql.includes('INSERT INTO leave_requests')) {
      const [employeeId, leaveType, startDate, endDate, reason] = params;

      // Foreign key check
      const emp = employees.find((e) => Number(e.id) === Number(employeeId));
      if (!emp) {
        const err = new Error('insert or update on table "leave_requests" violates foreign key constraint');
        err.code = '23503';
        throw err;
      }

      const newLeave = {
        id: leaveIdCounter++,
        employee_id: Number(employeeId),
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'Pending',
        rejection_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      leaveRequests.push(newLeave);
      return { rows: [{ ...newLeave }], rowCount: 1 };
    }

    // 6. UPDATE leave_requests SET status = 'Approved' WHERE id = $1 AND status = 'Pending'
    if (cleanSql.includes('UPDATE leave_requests') && cleanSql.includes("status = 'Approved'")) {
      const [id] = params;
      const idx = leaveRequests.findIndex((l) => Number(l.id) === Number(id) && l.status === 'Pending');
      if (idx !== -1) {
        leaveRequests[idx].status = 'Approved';
        leaveRequests[idx].rejection_reason = null;
        leaveRequests[idx].updated_at = new Date().toISOString();
        return { rows: [{ ...leaveRequests[idx] }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 7. UPDATE leave_requests SET status = 'Rejected' WHERE id = $1 AND status = 'Pending'
    if (cleanSql.includes('UPDATE leave_requests') && cleanSql.includes("status = 'Rejected'")) {
      const [id, rejectionReason] = params;
      const idx = leaveRequests.findIndex((l) => Number(l.id) === Number(id) && l.status === 'Pending');
      if (idx !== -1) {
        leaveRequests[idx].status = 'Rejected';
        leaveRequests[idx].rejection_reason = rejectionReason;
        leaveRequests[idx].updated_at = new Date().toISOString();
        return { rows: [{ ...leaveRequests[idx] }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    // 8. SELECT FROM leave_requests lr JOIN employees e ON lr.employee_id = e.id WHERE lr.id = $1
    if (cleanSql.includes('WHERE lr.id = $1')) {
      const [id] = params;
      const leave = leaveRequests.find((l) => Number(l.id) === Number(id));
      if (!leave) return { rows: [], rowCount: 0 };
      const emp = employees.find((e) => Number(e.id) === Number(leave.employee_id)) || {};
      const full = {
        ...leave,
        employee_name: emp.name || '',
        employee_email: emp.email || '',
        employee_department: emp.department || '',
      };
      return { rows: [full], rowCount: 1 };
    }

    // 9. SELECT FROM leave_requests lr JOIN employees e (list all with filters)
    if (cleanSql.includes('FROM leave_requests lr JOIN employees e')) {
      let result = leaveRequests.map((leave) => {
        const emp = employees.find((e) => Number(e.id) === Number(leave.employee_id)) || {};
        return {
          ...leave,
          employee_name: emp.name || '',
          employee_email: emp.email || '',
          employee_department: emp.department || '',
        };
      });

      // Filter handling
      if (cleanSql.includes('COUNT(*)')) {
        return { rows: [{ count: result.length }] };
      }

      return { rows: result, rowCount: result.length };
    }

    // 10. Dashboard stats
    if (cleanSql.includes('total_employees') && cleanSql.includes('pending_requests')) {
      return {
        rows: [
          {
            total_employees: employees.length,
            total_requests: leaveRequests.length,
            pending_requests: leaveRequests.filter((l) => l.status === 'Pending').length,
            approved_requests: leaveRequests.filter((l) => l.status === 'Approved').length,
            rejected_requests: leaveRequests.filter((l) => l.status === 'Rejected').length,
          },
        ],
      };
    }

    return { rows: [], rowCount: 0 };
  }

  return {
    query: mockQuery,
    reset,
    getEmployees: () => employees,
    getLeaveRequests: () => leaveRequests,
  };
}
