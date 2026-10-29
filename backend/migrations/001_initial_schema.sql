-- ====================================================================
-- Omibits Employee Leave Management System
-- Migration: 001_initial_schema.sql
-- Description: Creates employees and leave_requests tables,
--              sets up primary keys, foreign keys, check constraints,
--              and performance indexes.
-- ====================================================================

-- 1. Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive unique index on email
-- This prevents "john@example.com" and "JOHN@example.com" from co-existing.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_lower 
ON employees (LOWER(email));

-- 2. Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id SERIAL PRIMARY KEY,
    -- Foreign key referencing employees with RESTRICT so deleting an employee
    -- does NOT silently wipe historical leave records.
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
    
    -- Leave type restricted to allowed enum-like values
    leave_type VARCHAR(50) NOT NULL CHECK (leave_type IN ('Annual', 'Casual', 'Medical')),
    
    -- Date range
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Leave reason submitted by the employee
    reason TEXT NOT NULL,
    
    -- Status lifecycle: Pending -> Approved OR Pending -> Rejected
    status VARCHAR(50) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    
    -- Rejection reason (must be provided if and only if status is Rejected)
    rejection_reason TEXT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure end_date is on or after start_date
    CONSTRAINT chk_leave_dates_valid CHECK (end_date >= start_date),
    
    -- Ensure rejection_reason is populated for Rejected, and NULL for Pending/Approved
    CONSTRAINT chk_rejection_reason_valid CHECK (
        (status = 'Rejected' AND rejection_reason IS NOT NULL AND TRIM(rejection_reason) <> '')
        OR
        (status <> 'Rejected' AND rejection_reason IS NULL)
    )
);

-- Indexes for frequent query filtering and sorting
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id 
ON leave_requests (employee_id);

CREATE INDEX IF NOT EXISTS idx_leave_requests_status 
ON leave_requests (status);

CREATE INDEX IF NOT EXISTS idx_leave_requests_created_at 
ON leave_requests (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_leave_requests_dates 
ON leave_requests (start_date, end_date);
