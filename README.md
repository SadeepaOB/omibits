# Omibits Employee Leave Management System

A full-stack web application designed and built for the Software Engineering Intern Technical Assessment at **Omibits (Pvt) Ltd**.

The system enables corporate organizations to manage employee profiles and administer leave requests (Annual, Casual, Medical) through a clean, modern SaaS administrative dashboard backed by a relational PostgreSQL database.

---

## Table of Contents
1. [Key Features](#key-features)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Database Design & Entity Relationships](#database-design--entity-relationships)
5. [Prerequisites](#prerequisites)
6. [Quick Start & Installation](#quick-start--installation)
7. [Environment Configuration](#environment-configuration)
8. [Supabase Setup & Database Migrations](#supabase-setup--database-migrations)
9. [Running the Application](#running-the-application)
10. [Running Automated Tests](#running-automated-tests)
11. [API Specification & Endpoints](#api-specification--endpoints)
12. [Validation & Business Rules](#validation--business-rules)
13. [Application Screenshots](#application-screenshots)
14. [Troubleshooting Guide](#troubleshooting-guide)
15. [Interview Preparation Guide (Q&A)](#interview-preparation-guide-qa)

---

## Key Features

- **Executive Dashboard**: Real-time aggregated statistics (Total Employees, Total Requests, Pending, Approved, Rejected) with a table of recent submissions.
- **Employee Directory**: Searchable employee registry with case-insensitive unique email enforcement.
- **Leave Submission**: Modal with dynamic employee selection, leave types (Annual, Casual, Medical), date range picker, and reason input.
- **Decision Workflow**: One-click approval confirmation and rejection modal requiring a mandatory administrative justification.
- **Concurrency & State Safety**: Atomic conditional SQL updates prevent race conditions and illegal status transitions (e.g., approved requests cannot be rejected).
- **Responsive SaaS UI**: Built with a clean light theme, custom CSS design system, Lucide icons, and toast notifications.
- **Automated Testing Suite**: 31 unit and integration tests covering business rules, database constraints, input validation, and component rendering.

---

## Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend** | React 18, Vite | High-performance SPA with modern ES module builds |
| **Routing** | React Router DOM v6 | Declarative client-side routing |
| **Icons & UI** | Lucide React, Plain CSS | Accessible, minimal custom design tokens |
| **HTTP Client** | Axios | Configured with timeout and error parsing |
| **Backend** | Node.js, Express.js | Modular RESTful API with ES Modules |
| **Database** | Supabase PostgreSQL | Cloud-hosted relational database via standard `pg` pool |
| **Validation** | express-validator | Request body and query parameter validation |
| **Security** | Helmet, CORS | Standard HTTP security headers and origin gating |
| **Testing** | Vitest, Supertest, RTL | Fast unit and integration tests with jsdom |

---

## Architecture Overview

The system is organized as a clean monorepo with clear separation of concerns:

```
intern-leave-management-assignment/
├── backend/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql    # DDL for employees, leave_requests, constraints
│   │   └── 002_seed_data.sql         # Optional realistic sample records
│   ├── src/
│   │   ├── config/                   # PostgreSQL connection pool & migration runner
│   │   ├── controllers/              # HTTP request/response handlers
│   │   ├── middleware/               # Centralized error handler, 404 handler, validator
│   │   ├── repositories/             # Parameterized SQL database queries
│   │   ├── routes/                   # Express route definitions
│   │   ├── services/                 # Core business rules & atomic status transitions
│   │   ├── utils/                    # Custom AppError classes
│   │   ├── validators/               # express-validator schemas
│   │   ├── app.js                    # Express app configuration
│   │   └── server.js                 # Server startup & graceful shutdown
│   ├── tests/                        # Vitest + Supertest integration suite
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                      # Centralized Axios API client
│   │   ├── components/               # StatusBadge, Modals, Toast, SummaryCard
│   │   ├── layouts/                  # Persistent Sidebar & Top Header layout
│   │   ├── pages/                    # Dashboard, Employees, LeaveRequests, NotFound
│   │   ├── styles/                   # Design system tokens and global CSS
│   │   ├── App.jsx                   # Route registration
│   │   └── main.jsx                  # React entry point
│   ├── tests/                        # Vitest + React Testing Library suite
│   └── package.json
├── docs/                             # Detailed design decisions and API examples
├── screenshots/                      # Genuine application screenshots
├── .env.example                      # Root environment variable template
├── package.json                      # Monorepo management scripts
└── README.md                         # Documentation
```

### Layer Responsibilities
1. **Routes**: Define URL paths and link to validator schemas.
2. **Validators**: Validate input parameters and reject malformed payloads before execution.
3. **Controllers**: Handle HTTP requests, extract parameters, and return JSON responses.
4. **Services**: Enforce domain business rules (e.g. status flow, date ranges, email uniqueness).
5. **Repositories**: Execute parameterized SQL queries against PostgreSQL.

---

## Database Design & Entity Relationships

The schema consists of two normalized tables linked by a foreign key constraint:

```mermaid
erDiagram
    EMPLOYEES ||--o{ LEAVE_REQUESTS : "submits"
    
    EMPLOYEES {
        int id PK "SERIAL"
        string name "VARCHAR(255)"
        string email "VARCHAR(255) UNIQUE LOWER"
        string department "VARCHAR(100)"
        timestamp created_at "TIMESTAMPTZ"
        timestamp updated_at "TIMESTAMPTZ"
    }

    LEAVE_REQUESTS {
        int id PK "SERIAL"
        int employee_id FK "REFERENCES employees(id) ON DELETE RESTRICT"
        string leave_type "CHECK IN (Annual, Casual, Medical)"
        date start_date "DATE"
        date end_date "DATE (CHECK end_date >= start_date)"
        text reason "TEXT NOT NULL"
        string status "CHECK IN (Pending, Approved, Rejected)"
        text rejection_reason "TEXT NULL"
        timestamp created_at "TIMESTAMPTZ"
        timestamp updated_at "TIMESTAMPTZ"
    }
```

### Key Database Constraints
1. **Case-Insensitive Unique Email**: `CREATE UNIQUE INDEX idx_employees_email_lower ON employees (LOWER(email));`
2. **Restricted Foreign Key**: `ON DELETE RESTRICT` prevents accidental deletion of employees who have historical leave records.
3. **Date Consistency**: `CHECK (end_date >= start_date)` guarantees validity at the database engine level.
4. **Rejection Reason Integrity**:
   ```sql
   CONSTRAINT chk_rejection_reason_valid CHECK (
       (status = 'Rejected' AND rejection_reason IS NOT NULL AND TRIM(rejection_reason) <> '')
       OR
       (status <> 'Rejected' AND rejection_reason IS NULL)
   )
   ```
5. **Performance Indexes**: Indexes on `status`, `employee_id`, and `created_at` ensure fast search and sorting.

---

## Prerequisites

- **Node.js**: v18.0.0 or later (v20+ / v24 recommended)
- **npm**: v9.0.0 or later
- **Git**

---

## Quick Start & Installation

Clone the repository and install all dependencies:

```bash
# 1. Clone repository
git clone https://github.com/SadeepaOB/intern-leave-management-assignme.git
cd intern-leave-management-assignme

# 2. Install root dependencies
npm install

# 3. Install backend dependencies
cd backend && npm install && cd ..

# 4. Install frontend dependencies
cd frontend && npm install && cd ..
```

---

## Environment Configuration

Copy the template configuration files:

```bash
# In project root
cp .env.example .env

# In frontend directory
cp frontend/.env.example frontend/.env
```

### Backend Configuration (`.env` or `backend/.env`)
```ini
# Supabase PostgreSQL connection string
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres

# Server port (5001 is default to prevent macOS AirPlay port 5000 conflict)
PORT=5001

# Allowed frontend origin for CORS
FRONTEND_URL=http://localhost:5173

# Node environment
NODE_ENV=development
```

### Frontend Configuration (`frontend/.env`)
```ini
# Backend API Base URL
VITE_API_BASE_URL=http://localhost:5001/api
```

> **Note on Local Demonstration**: If `DATABASE_URL` is not yet configured, the backend starts in an isolated development mode pre-seeded with sample data. Once you provide `DATABASE_URL`, it automatically switches to your live Supabase database!

---

## Supabase Setup & Database Migrations

### Method 1: Using the Automated Migration Script (Recommended)
1. In your [Supabase Dashboard](https://app.supabase.com), create a new project.
2. Go to **Project Settings** → **Database** → **Connection string** (URI). Select "Connection pooling" or "Direct".
3. Copy the connection string and paste it as `DATABASE_URL` in your `.env` file (replace `[YOUR-PASSWORD]` with your database password).
4. Run the migration script:
   ```bash
   npm run migrate
   ```
5. *(Optional)* Insert realistic sample data for demo purposes:
   ```bash
   npm run seed
   ```

### Method 2: Using the Supabase SQL Editor
1. In your Supabase Dashboard, click on **SQL Editor** in the left menu.
2. Click **New query**.
3. Open [`backend/migrations/001_initial_schema.sql`](file:///Users/sadeepabandara/Documents/omibits/backend/migrations/001_initial_schema.sql) in this repository, copy its contents, paste them into the SQL Editor, and click **Run**.
4. *(Optional)* Open [`backend/migrations/002_seed_data.sql`](file:///Users/sadeepabandara/Documents/omibits/backend/migrations/002_seed_data.sql), paste into a new query, and click **Run**.

---

## Running the Application

### Option A: Run Both Frontend and Backend Concurrently (Easiest)
From the root directory:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5001`
- **Frontend App**: `http://localhost:5173`

### Option B: Run Services Individually
```bash
# Terminal 1 - Backend
npm run dev:backend
# or cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev:frontend
# or cd frontend && npm run dev
```

---

## Running Automated Tests

The project includes unit and integration tests covering all critical requirements.

```bash
# Run all tests (backend + frontend)
npm test

# Run only backend tests (22 tests)
npm run test:backend

# Run only frontend tests (9 tests)
npm run test:frontend
```

### Verified Test Cases (100% Passing):
- Creating an employee with valid input succeeds (201).
- Missing employee fields are rejected (400).
- Invalid email format is rejected (400).
- Duplicate emails (including case variations) are rejected (409).
- Listing employees works correctly (200).
- Creating a leave request with valid data succeeds (201).
- Non-existent employee cannot submit leave (404/400).
- Invalid leave type is rejected (400).
- End date before start date is rejected (400).
- Missing leave reason is rejected (400).
- Leave requests return employee details via SQL JOIN (200).
- Pending request can be approved (200).
- Pending request can be rejected with a reason (200).
- Rejection without reason fails (400).
- Request cannot be approved twice (409).
- Rejected request cannot be approved (409).
- Approved request cannot be rejected (409).
- Non-existent request returns 404.
- Concurrent updates do not produce inconsistent states (atomic update test).
- SQL injection attempts are safely parameterized.
- Dashboard aggregated stats calculate correctly.
- Status badge rendering, modal validation, loading and empty states.

---

## API Specification & Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and uptime |
| `POST` | `/api/em` | Create a new employee |
| `GET` | `/api/employees` | List employees (supports `?search=...`) |
| `POST` | `/api/leaves` | Submit a leave request |
| `GET` | `/api/leaves` | List leave requests (supports `?status=...&leaveType=...&department=...&search=...`) |
| `PATCH` | `/api/leaves/:id/approve` | Approve a pending request |
| `PATCH` | `/api/leaves/:id/reject` | Reject a pending request (requires `rejectionReason`) |
| `GET` | `/api/dashboard/stats` | Aggregated statistics for dashboard cards |

For detailed request and response payloads, refer to [`docs/api-examples.md`](file:///Users/sadeepabandara/Documents/omibits/docs/api-examples.md).

---

## Validation & Business Rules

1. **Employee Validation**:
   - `name`: Required, non-empty, max 255 chars.
   - `email`: Required, valid email format, unique (case-insensitive).
   - `department`: Required, non-empty.
2. **Leave Request Validation**:
   - `employeeId`: Required, must correspond to an existing employee.
   - `leaveType`: Required, must be one of `Annual`, `Casual`, `Medical`.
   - `startDate` & `endDate`: Required, valid dates, `endDate >= startDate`.
   - `reason`: Required, non-blank text.
3. **Status Lifecycle**:
   - Starts as `Pending`.
   - Only `Pending` requests can transition to `Approved` or `Rejected`.
   - Atomic conditional update: `UPDATE leave_requests SET status = 'Approved' WHERE id = $1 AND status = 'Pending'` prevents race conditions.

---

## Application Screenshots

Genuine screenshots captured during automated browser testing:

### 1. Dashboard Overview
![Dashboard Overview](screenshots/01_dashboard.png)

### 2. Employee Directory
![Employee Directory](screenshots/02_employees.png)

### 3. Leave Requests Table
![Leave Requests Table](screenshots/03_leave_requests.png)

### 4. Rejection Modal with Mandatory Reason
![Rejection Modal](screenshots/04_reject_modal.png)

### 5. Updated Dashboard with Live Counters
![Updated Dashboard](screenshots/05_updated_dashboard.png)

---

## Troubleshooting Guide

### 1. Port 5000 Already in Use (`EADDRINUSE`)
- **Cause**: On macOS Monterey/Ventura/Sonoma, the ControlCenter (AirPlay Receiver) listens on port 5000 by default.
- **Solution**: We configured default port **5001** for this project. If you wish to use port 5000, turn off AirPlay Receiver in macOS *System Settings* → *General* → *AirDrop & AirPlay*.

### 2. Database Connection Error (`pg` error)
- Ensure your `DATABASE_URL` in `.env` has the correct password without special characters breaking the URI, or URL-encode them.
- If using Supabase, ensure SSL is enabled (already configured in `src/config/db.js`).

---

## Interview Preparation Guide (Q&A)

Here are the most likely questions you may be asked during your technical intern interview, with simple, beginner-friendly answers:

### Q1: Why did you separate the code into Routes, Controllers, Services, and Repositories?
> **Answer**: "To maintain separation of concerns. Routes define the endpoints, Validators check request payloads, Controllers manage HTTP responses, Services implement the core business logic, and Repositories execute database queries. This makes the code organized, easy to read, and simple to unit test without coupling business rules to Express or database drivers."

### Q2: How did you prevent race conditions when two admins approve/reject simultaneously?
> **Answer**: "Instead of reading the record first and then updating it in two separate steps, I used an atomic conditional SQL update: `UPDATE leave_requests SET status = 'Approved' WHERE id = $1 AND status = 'Pending' RETURNING *;`. PostgreSQL executes this with row-level locks. If two requests hit at the same time, the first succeeds and the second updates zero rows. The service detects zero rows, inspects the current state, and returns a 409 Conflict."

### Q3: Why is email uniqueness enforced with `LOWER(email)`?
> **Answer**: "Because standard database uniqueness is case-sensitive, meaning `john@example.com` and `JOHN@example.com` would both be allowed. Email addresses in real life are case-insensitive, so creating a unique index on `LOWER(email)` enforces this rule at the database level."

### Q4: Why did you use `ON DELETE RESTRICT` for the employee foreign key?
> **Answer**: "If we used `CASCADE`, deleting an employee would permanently delete all their historical leave applications. In human resource systems, leave history must be preserved for compliance and auditing. `RESTRICT` prevents deleting an employee who has existing leave records."

### Q5: How do you prevent SQL injection?
> **Answer**: "Every single SQL query in the repository uses parameterized placeholders (`$1`, `$2`). We never concatenate user inputs directly into query strings. The PostgreSQL driver sends parameters separately to the database engine as literal values, completely neutralizing injection attacks."

---

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.