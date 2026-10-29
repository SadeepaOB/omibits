# Omibits Employee Leave Management System - Architectural & Design Decisions

This document details the architectural choices, database engineering patterns, and design principles implemented in the Employee Leave Management System. It is written in simple, clear terms suitable for junior engineers and technical interview preparation.

---

## 1. Why PostgreSQL and Supabase?

1. **Relational Data Integrity**:
   Leave management is fundamentally relational. Leave requests strictly belong to employees. PostgreSQL provides robust relational capabilities: ACID transactions, foreign key constraints, CHECK constraints, and unique indexes that prevent corrupted data.
2. **Supabase Cloud Convenience**:
   Supabase provides a fully managed, enterprise-grade PostgreSQL instance with zero server maintenance, built-in SSL encryption, and high availability.
3. **Standard Node.js `pg` Driver**:
   Instead of coupling the backend to proprietary client SDKs, we use the industry-standard `pg` (node-postgres) driver with connection pooling. This guarantees that the backend can connect to any PostgreSQL database (Supabase, AWS RDS, Neon, or local Docker) without changing application code.

---

## 2. Why Store Employees and Leave Requests in Separate Tables?

- **Database Normalization (3NF)**:
  An employee submits many leave requests over time (one-to-many relationship).
  If employee details (name, email, department) were stored inside the leave table:
  - We would introduce massive data redundancy.
  - Updating an employee's department would require updating hundreds of historical records (update anomaly).
  - Deleting a leave record could accidentally delete employee info (deletion anomaly).
- **Separation of Concerns**:
  The `employees` table models company personnel. The `leave_requests` table models time-off events. By normalizing them into two tables linked by `employee_id`, queries remain fast, clean, and structured.

---

## 3. Why Use a Foreign Key with `ON DELETE RESTRICT`?

In `leave_requests`, `employee_id` is defined as:
```sql
employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT
```

**Why this decision matters:**
- If we used `ON DELETE CASCADE`, deleting an employee would silently and permanently wipe all their historical leave applications, medical absences, and approval audits from the company record.
- In corporate systems, historical audits are legally and operationally required.
- `ON DELETE RESTRICT` guarantees that an employee cannot be deleted while leave records exist referencing them, preventing accidental data loss.

---

## 4. Case-Insensitive Unique Email Enforcement

In the `employees` table:
```sql
CREATE UNIQUE INDEX idx_employees_email_lower ON employees (LOWER(email));
```

**Why this decision matters:**
- Standard PostgreSQL `UNIQUE(email)` is case-sensitive: it would allow both `kasun@omibits.com` and `KASUN@omibits.com` to be registered.
- Email RFCs and standard workplace communication treat email addresses as case-insensitive.
- Enforcing `LOWER(email)` at the database level guarantees integrity regardless of what tool or developer queries the database.

---

## 5. Dual-Layer Validation: Frontend and Backend

### Why Not Frontend Alone?
- Frontend validation (HTML5 / JavaScript) is for **User Experience (UX)**. It gives immediate feedback (e.g. highlighting a missing field before network latency).
- Frontend validation **can never be trusted for security or data integrity**. Any user can open curl, Postman, or browser developer tools to send arbitrary payloads directly to the backend API.

### Why Not Backend Alone?
- Backend validation ensures **absolute system security and consistency**.
- However, relying solely on backend responses creates a sluggish user experience with unnecessary network round-trips.
- Therefore, we validate on the frontend for speed and clarity, and strictly re-validate on the backend (using `express-validator` and service rules) and enforce constraints in PostgreSQL.

---

## 6. Layered Backend Architecture (Route → Controller → Service → Repository)

The backend follows a strict separation of concerns:
```
HTTP Request 
   ⬇
Route (defines path and assigns validation rules)
   ⬇
Validator Middleware (validates request format using express-validator)
   ⬇
Controller (extracts HTTP parameters, delegates to service, sends status code)
   ⬇
Service (applies core business logic: status transitions, date checks, conflicts)
   ⬇
Repository (runs parameterized SQL queries against PostgreSQL)
   ⬇
PostgreSQL Database
```

### Benefits for Interns & Teams:
1. **Easy to Test**: You can unit test services and business logic without spinning up an HTTP server.
2. **Easy to Maintain**: If the database changes from PostgreSQL to another tool, only the Repository layer changes; Controllers and Services stay untouched.
3. **No Bloated Handlers**: Express routes remain 5–10 lines of readable code instead of giant 200-line spaghetti files.

---

## 7. How Invalid Status Transitions & Concurrency Race Conditions Are Prevented

### Business Rule:
- A new request starts as `Pending`.
- Only `Pending` requests can be Approved or Rejected.
- An `Approved` request cannot be Approved again or Rejected.
- A `Rejected` request cannot be Approved or Rejected again.

### The Race Condition Problem:
Suppose two administrators click "Approve" and "Reject" at the exact same millisecond. If the server does a naive "read then update":
1. Admin A reads status: 'Pending'.
2. Admin B reads status: 'Pending'.
3. Admin A updates to 'Approved'.
4. Admin B updates to 'Rejected' (overwriting Admin A).
The database ends in an inconsistent state.

### The Solution: Atomic Conditional SQL
In `leaveRepository.js`:
```sql
UPDATE leave_requests
SET status = 'Approved', updated_at = NOW()
WHERE id = $1 AND status = 'Pending'
RETURNING *;
```
- The `WHERE status = 'Pending'` condition is executed **atomically** by PostgreSQL's internal row locks.
- If two requests arrive simultaneously, the first transaction updates the row and returns it. The second transaction finds 0 rows matching `status = 'Pending'`.
- The service detects `rowCount === 0`, checks the current row, and immediately returns a clean `409 Conflict` error explaining that the request was already finalized.

---

## 8. How Administrator Actions Would Be Secured in a Future Version

Authentication was explicitly excluded from the assignment's required scope. To secure the application in production:
1. **Authentication**:
   - Implement JWT (JSON Web Tokens) or HTTP-only secure session cookies using Supabase Auth or standard bcrypt password hashing.
2. **Role-Based Access Control (RBAC)**:
   - Introduce roles: `Employee` vs. `Admin` / `Manager`.
   - Regular employees can only submit leaves and view their own records (`WHERE employee_id = req.user.id`).
   - Only users with `Admin` or `HR_Manager` role can invoke `/api/leaves/:id/approve` and `/api/leaves/:id/reject`.
3. **Audit Logging**:
   - Add an `audit_logs` table tracking who approved or rejected each request (`admin_id`, `timestamp`, `action`).

---

## 9. Known Limitations and Future Improvements

1. **Leave Balances**:
   The current implementation tracks requests and dates. A future upgrade would track annual leave allowances (e.g. 14 days annual leave) and deduct approved days.
2. **Overlapping Leave Detection**:
   Add an advisory warning or constraint if an employee submits a new leave request covering date ranges they already requested.
3. **Email Notifications**:
   Integrate Nodemailer or Resend to automatically email the employee when their request is approved or rejected with the administrative reason.
