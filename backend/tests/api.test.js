import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { setMockPool } from '../src/config/db.js';
import { createMockDatabase } from './mockDb.js';

describe('Employee Leave Management Backend API Tests', () => {
  let mockDb;

  beforeEach(() => {
    mockDb = createMockDatabase();
    setMockPool({
      query: mockDb.query,
      connect: async () => ({ query: mockDb.query, release: () => {} }),
      end: async () => {},
    });
  });

  // ========================================================
  // HEALTH CHECK
  // ========================================================
  describe('GET /api/health', () => {
    it('returns 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  // ========================================================
  // EMPLOYEE MANAGEMENT
  // ========================================================
  describe('Employee Management APIs', () => {
    it('1. Creating an employee with valid input succeeds (201)', async () => {
      const res = await request(app)
        .post('/api/em')
        .send({
          name: 'Kasun Perera',
          email: 'kasun@example.com',
          department: 'Engineering',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('Kasun Perera');
      expect(res.body.data.email).toBe('kasun@example.com');
      expect(res.body.data.department).toBe('Engineering');
    });

    it('2. Missing employee fields are rejected (400)', async () => {
      const res = await request(app)
        .post('/api/em')
        .send({
          name: '',
          email: 'valid@example.com',
          department: '',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('3. Invalid email format is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/em')
        .send({
          name: 'Kasun Perera',
          email: 'not-an-email',
          department: 'Engineering',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('4. Duplicate email (including case variations) is rejected (409)', async () => {
      // First insert
      await request(app)
        .post('/api/em')
        .send({
          name: 'Kasun Perera',
          email: 'kasun@example.com',
          department: 'Engineering',
        });

      // Attempt duplicate with uppercase letters
      const res = await request(app)
        .post('/api/em')
        .send({
          name: 'Kasun Another',
          email: 'KASUN@EXAMPLE.COM',
          department: 'QA',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });

    it('5. Listing employees works (200)', async () => {
      await request(app)
        .post('/api/em')
        .send({ name: 'User 1', email: 'user1@example.com', department: 'HR' });
      await request(app)
        .post('/api/em')
        .send({ name: 'User 2', email: 'user2@example.com', department: 'Engineering' });

      const res = await request(app).get('/api/employees');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  // ========================================================
  // LEAVE REQUEST MANAGEMENT
  // ========================================================
  describe('Leave Request Management APIs', () => {
    let employeeId;

    beforeEach(async () => {
      // Create a standard test employee before each leave test
      const empRes = await request(app)
        .post('/api/em')
        .send({
          name: 'Kasun Perera',
          email: 'kasun@example.com',
          department: 'Engineering',
        });
      employeeId = empRes.body.data.id;
    });

    it('6. Creating a leave request with valid data succeeds (201)', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Annual',
          startDate: '2026-11-02',
          endDate: '2026-11-04',
          reason: 'Personal travel to Nuwara Eliya',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('Pending');
      expect(res.body.data.leave_type).toBe('Annual');
      expect(res.body.data.employee_id).toBe(employeeId);
    });

    it('7. A non-existent employee cannot submit leave (400 or 404)', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .send({
          employeeId: 99999,
          leaveType: 'Casual',
          startDate: '2026-11-02',
          endDate: '2026-11-04',
          reason: 'Medical checkup',
        });

      expect([400, 404]).toContain(res.status);
      expect(res.body.success).toBe(false);
    });

    it('8. An invalid leave type is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'UnpaidVacation', // Not in Annual, Casual, Medical
          startDate: '2026-11-02',
          endDate: '2026-11-04',
          reason: 'Vacation',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('9. An end date before the start date is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Medical',
          startDate: '2026-11-10',
          endDate: '2026-11-05', // Before start date
          reason: 'Doctor rest',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('10. Missing leave reason is rejected (400)', async () => {
      const res = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Casual',
          startDate: '2026-11-02',
          endDate: '2026-11-04',
          reason: '   ', // Blank
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('11. Leave requests include employee details via JOIN (200)', async () => {
      await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Casual',
          startDate: '2026-11-02',
          endDate: '2026-11-03',
          reason: 'Personal work',
        });

      const res = await request(app).get('/api/leaves');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].employee_name).toBe('Kasun Perera');
      expect(res.body.data[0].employee_department).toBe('Engineering');
    });

    it('12. A pending request can be approved (200)', async () => {
      const leaveRes = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Annual',
          startDate: '2026-11-15',
          endDate: '2026-11-18',
          reason: 'Holiday',
        });
      const leaveId = leaveRes.body.data.id;

      const approveRes = await request(app).patch(`/api/leaves/${leaveId}/approve`);
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.success).toBe(true);
      expect(approveRes.body.data.status).toBe('Approved');
    });

    it('13. A pending request can be rejected with a reason (200)', async () => {
      const leaveRes = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Casual',
          startDate: '2026-11-20',
          endDate: '2026-11-21',
          reason: 'Attending festival',
        });
      const leaveId = leaveRes.body.data.id;

      const rejectRes = await request(app)
        .patch(`/api/leaves/${leaveId}/reject`)
        .send({
          rejectionReason: 'Team capacity is insufficient on requested dates.',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.success).toBe(true);
      expect(rejectRes.body.data.status).toBe('Rejected');
      expect(rejectRes.body.data.rejection_reason).toBe('Team capacity is insufficient on requested dates.');
    });

    it('14. Rejection without a reason fails (400)', async () => {
      const leaveRes = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Casual',
          startDate: '2026-11-20',
          endDate: '2026-11-21',
          reason: 'Attending festival',
        });
      const leaveId = leaveRes.body.data.id;

      const rejectRes = await request(app)
        .patch(`/api/leaves/${leaveId}/reject`)
        .send({
          rejectionReason: '', // Blank
        });

      expect(rejectRes.status).toBe(400);
      expect(rejectRes.body.success).toBe(false);
    });

    it('15. A request cannot be approved twice (409)', async () => {
      const leaveRes = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Annual',
          startDate: '2026-12-01',
          endDate: '2026-12-05',
          reason: 'Year end break',
        });
      const leaveId = leaveRes.body.data.id;

      // First approval succeeds
      await request(app).patch(`/api/leaves/${leaveId}/approve`);

      // Second approval must fail with 409
      const secondApprove = await request(app).patch(`/api/leaves/${leaveId}/approve`);
      expect(secondApprove.status).toBe(409);
      expect(secondApprove.body.message).toContain('already been Approved');
    });

    it('16. A rejected request cannot be approved (409)', async () => {
      const leaveRes = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Annual',
          startDate: '2026-12-01',
          endDate: '2026-12-05',
          reason: 'Year end break',
        });
      const leaveId = leaveRes.body.data.id;

      // Reject first
      await request(app)
        .patch(`/api/leaves/${leaveId}/reject`)
        .send({ rejectionReason: 'Denied due to workload.' });

      // Attempt approval on rejected request
      const approveRes = await request(app).patch(`/api/leaves/${leaveId}/approve`);
      expect(approveRes.status).toBe(409);
      expect(approveRes.body.message).toContain('already been Rejected');
    });

    it('17. An approved request cannot be rejected (409)', async () => {
      const leaveRes = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Medical',
          startDate: '2026-12-10',
          endDate: '2026-12-12',
          reason: 'Surgery follow up',
        });
      const leaveId = leaveRes.body.data.id;

      // Approve first
      await request(app).patch(`/api/leaves/${leaveId}/approve`);

      // Attempt rejection on approved request
      const rejectRes = await request(app)
        .patch(`/api/leaves/${leaveId}/reject`)
        .send({ rejectionReason: 'Changed mind.' });

      expect(rejectRes.status).toBe(409);
      expect(rejectRes.body.message).toContain('already been Approved');
    });

    it('18. Non-existent leave request returns 404', async () => {
      const approveRes = await request(app).patch('/api/leaves/99999/approve');
      expect(approveRes.status).toBe(404);

      const rejectRes = await request(app)
        .patch('/api/leaves/99999/reject')
        .send({ rejectionReason: 'Does not exist' });
      expect(rejectRes.status).toBe(404);
    });

    it('19. Concurrent status updates do not create inconsistent states', async () => {
      const leaveRes = await request(app)
        .post('/api/leaves')
        .send({
          employeeId,
          leaveType: 'Annual',
          startDate: '2026-11-25',
          endDate: '2026-11-26',
          reason: 'Personal',
        });
      const leaveId = leaveRes.body.data.id;

      // Send two simultaneous approval requests
      const [res1, res2] = await Promise.all([
        request(app).patch(`/api/leaves/${leaveId}/approve`),
        request(app).patch(`/api/leaves/${leaveId}/approve`),
      ]);

      const statuses = [res1.status, res2.status].sort();
      // Exactly one must succeed (200) and the other must be rejected with conflict (409)
      expect(statuses).toEqual([200, 409]);
    });

    it('20. SQL injection attempts are safely handled via parameterized queries', async () => {
      const res = await request(app)
        .post('/api/em')
        .send({
          name: "Robert'); DROP TABLE employees;--",
          email: "drop@example.com",
          department: "Security",
        });

      // Safely treated as literal string input
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe("Robert'); DROP TABLE employees;--");
    });
  });

  // ========================================================
  // DASHBOARD AGGREGATED STATS
  // ========================================================
  describe('GET /api/dashboard/stats', () => {
    it('returns aggregated statistics correctly', async () => {
      const empRes = await request(app)
        .post('/api/em')
        .send({ name: 'Kasun', email: 'kasun@stats.com', department: 'Engineering' });

      await request(app).post('/api/leaves').send({
        employeeId: empRes.body.data.id,
        leaveType: 'Annual',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        reason: 'Rest',
      });

      const res = await request(app).get('/api/dashboard/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalEmployees).toBe(1);
      expect(res.body.data.totalRequests).toBe(1);
      expect(res.body.data.pendingRequests).toBe(1);
    });
  });
});
