-- ====================================================================
-- Migration: 003_add_employee_type.sql
-- Description: Adds employee_type column to the employees table.
--              Allowed values: Admin, Employee
-- Run this in your Supabase SQL Editor:
-- ====================================================================

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS employee_type VARCHAR(50) NOT NULL DEFAULT 'Employee'
CHECK (employee_type IN ('Admin', 'Employee'));
