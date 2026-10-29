-- ====================================================================
-- Omibits Employee Leave Management System
-- Optional Development Seed Data: 002_seed_data.sql
-- Description: Realistic sample employees and leave requests for testing.
-- Run this script ONLY if you want sample data in your local or test DB.
-- ====================================================================

-- Insert sample employees (if not already existing)
INSERT INTO employees (name, email, department)
VALUES
    ('Kasun Perera', 'kasun.perera@omibits.com', 'Engineering'),
    ('Dilani Fernando', 'dilani.fernando@omibits.com', 'Quality Assurance'),
    ('Nuwan Silva', 'nuwan.silva@omibits.com', 'Product Management'),
    ('Tharushi Wickramasinghe', 'tharushi.w@omibits.com', 'Engineering'),
    ('Sahan Jayawardena', 'sahan.j@omibits.com', 'Human Resources')
ON CONFLICT DO NOTHING;

-- Insert sample leave requests referencing the above employees
INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at)
SELECT 
    e.id,
    'Annual',
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '8 days',
    'Family vacation to Nuwara Eliya',
    'Pending',
    NULL,
    NOW() - INTERVAL '2 days'
FROM employees e WHERE e.email = 'kasun.perera@omibits.com'
LIMIT 1;

INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at)
SELECT 
    e.id,
    'Casual',
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '2 days',
    'Personal matter at the bank',
    'Approved',
    NULL,
    NOW() - INTERVAL '4 days'
FROM employees e WHERE e.email = 'dilani.fernando@omibits.com'
LIMIT 1;

INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at)
SELECT 
    e.id,
    'Medical',
    CURRENT_DATE - INTERVAL '3 days',
    CURRENT_DATE - INTERVAL '1 day',
    'Fever and doctor advised bed rest',
    'Approved',
    NULL,
    NOW() - INTERVAL '5 days'
FROM employees e WHERE e.email = 'nuwan.silva@omibits.com'
LIMIT 1;

INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, reason, status, rejection_reason, created_at)
SELECT 
    e.id,
    'Casual',
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '14 days',
    'Attending a tech conference abroad',
    'Rejected',
    'Critical sprint delivery deadline during this week. Please reschedule.',
    NOW() - INTERVAL '1 day'
FROM employees e WHERE e.email = 'tharushi.w@omibits.com'
LIMIT 1;
