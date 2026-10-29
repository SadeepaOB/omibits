# Omibits Employee Leave Management System - API Examples

This document provides sample HTTP requests and JSON responses for all available API endpoints.

---

## 1. Health Check

### `GET /api/health`
Checks server status and uptime.

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:5001
```

**Response (`200 OK`):**
```json
{
  "status": "ok",
  "uptime": 124.5,
  "timestamp": "2026-10-29T12:18:08.511Z"
}
```

---

## 2. Employee Endpoints

### `POST /api/em` (or `POST /api/employees`)
Creates a new employee record.

**Request:**
```http
POST /api/em HTTP/1.1
Host: localhost:5001
Content-Type: application/json

{
  "name": "Kasun Perera",
  "email": "kasun.perera@omibits.com",
  "department": "Engineering"
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Employee created successfully.",
  "data": {
    "id": 1,
    "name": "Kasun Perera",
    "email": "kasun.perera@omibits.com",
    "department": "Engineering",
    "created_at": "2026-10-29T12:00:00.000Z",
    "updated_at": "2026-10-29T12:00:00.000Z"
  }
}
```

**Error Response - Duplicate Email (`409 Conflict`):**
```json
{
  "success": false,
  "message": "An employee with email 'kasun.perera@omibits.com' already exists."
}
```

**Error Response - Validation Error (`400 Bad Request`):**
```json
{
  "success": false,
  "message": "Please provide a valid email address.",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address.",
      "value": "not-an-email"
    }
  ]
}
```

---

### `GET /api/employees`
Retrieves all employees, optionally filtered by a search query.

**Request (All Employees):**
```http
GET /api/employees HTTP/1.1
Host: localhost:5001
```

**Request (With Search):**
```http
GET /api/employees?search=Engineering HTTP/1.1
Host: localhost:5001
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Kasun Perera",
      "email": "kasun.perera@omibits.com",
      "department": "Engineering",
      "created_at": "2026-10-29T12:00:00.000Z",
      "updated_at": "2026-10-29T12:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Dilani Fernando",
      "email": "dilani.fernando@omibits.com",
      "department": "Quality Assurance",
      "created_at": "2026-10-29T12:05:00.000Z",
      "updated_at": "2026-10-29T12:05:00.000Z"
    }
  ]
}
```

---

## 3. Leave Request Endpoints

### `POST /api/leaves`
Submits a new leave request for an existing employee.

**Request:**
```http
POST /api/leaves HTTP/1.1
Host: localhost:5001
Content-Type: application/json

{
  "employeeId": 1,
  "leaveType": "Annual",
  "startDate": "2026-11-20",
  "endDate": "2026-11-24",
  "reason": "Annual family vacation and personal rest."
}
```

**Response (`201 Created`):**
```json
{
  "success": true,
  "message": "Leave request submitted successfully.",
  "data": {
    "id": 5,
    "employee_id": 1,
    "employee_name": "Kasun Perera",
    "employee_email": "kasun.perera@omibits.com",
    "employee_department": "Engineering",
    "leave_type": "Annual",
    "start_date": "2026-11-20",
    "end_date": "2026-11-24",
    "reason": "Annual family vacation and personal rest.",
    "status": "Pending",
    "rejection_reason": null,
    "created_at": "2026-10-29T12:10:00.000Z",
    "updated_at": "2026-10-29T12:10:00.000Z"
  }
}
```

**Error Response - Invalid Dates (`400 Bad Request`):**
```json
{
  "success": false,
  "message": "End date must be on or after start date.",
  "errors": [
    {
      "field": "endDate",
      "message": "End date must be on or after start date.",
      "value": "2026-11-15"
    }
  ]
}
```

---

### `GET /api/leaves`
Retrieves leave requests joined with employee details. Supports optional query parameters.

**Query Parameters:**
- `status`: `Pending` | `Approved` | `Rejected`
- `leaveType`: `Annual` | `Casual` | `Medical`
- `department`: e.g. `Engineering`
- `search`: search across employee name, email, or reason
- `page`: page number (1-based)
- `limit`: items per page

**Request:**
```http
GET /api/leaves?status=Pending&leaveType=Annual HTTP/1.1
Host: localhost:5001
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "employee_id": 1,
      "employee_name": "Kasun Perera",
      "employee_email": "kasun.perera@omibits.com",
      "employee_department": "Engineering",
      "leave_type": "Annual",
      "start_date": "2026-11-20",
      "end_date": "2026-11-24",
      "reason": "Annual family vacation and personal rest.",
      "status": "Pending",
      "rejection_reason": null,
      "created_at": "2026-10-29T12:10:00.000Z",
      "updated_at": "2026-10-29T12:10:00.000Z"
    }
  ]
}
```

---

### `PATCH /api/leaves/:id/approve`
Approves a pending leave request.

**Request:**
```http
PATCH /api/leaves/1/approve HTTP/1.1
Host: localhost:5001
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Leave request approved successfully.",
  "data": {
    "id": 1,
    "employee_id": 1,
    "employee_name": "Kasun Perera",
    "employee_email": "kasun.perera@omibits.com",
    "employee_department": "Engineering",
    "leave_type": "Annual",
    "start_date": "2026-11-05",
    "end_date": "2026-11-08",
    "reason": "Family vacation to Nuwara Eliya",
    "status": "Approved",
    "rejection_reason": null,
    "created_at": "2026-10-27T12:00:00.000Z",
    "updated_at": "2026-10-29T12:15:00.000Z"
  }
}
```

**Error Response - Already Finalized (`409 Conflict`):**
```json
{
  "success": false,
  "message": "This leave request has already been Approved and cannot be approved again."
}
```

---

### `PATCH /api/leaves/:id/reject`
Rejects a pending leave request with a mandatory rejection reason.

**Request:**
```http
PATCH /api/leaves/5/reject HTTP/1.1
Host: localhost:5001
Content-Type: application/json

{
  "rejectionReason": "Critical milestone delivery scheduled during this sprint period. Please reschedule."
}
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Leave request rejected successfully.",
  "data": {
    "id": 5,
    "employee_id": 1,
    "employee_name": "Kasun Perera",
    "employee_email": "kasun.perera@omibits.com",
    "employee_department": "Engineering",
    "leave_type": "Annual",
    "start_date": "2026-11-20",
    "end_date": "2026-11-24",
    "reason": "Annual family vacation and personal rest.",
    "status": "Rejected",
    "rejection_reason": "Critical milestone delivery scheduled during this sprint period. Please reschedule.",
    "created_at": "2026-10-29T12:10:00.000Z",
    "updated_at": "2026-10-29T12:20:00.000Z"
  }
}
```

**Error Response - Missing Rejection Reason (`400 Bad Request`):**
```json
{
  "success": false,
  "message": "A rejection reason is required.",
  "errors": [
    {
      "field": "rejectionReason",
      "message": "A rejection reason is required.",
      "value": ""
    }
  ]
}
```

---

## 4. Dashboard Statistics Endpoint

### `GET /api/dashboard/stats`
Returns aggregated counts for total employees, total requests, and requests by status.

**Request:**
```http
GET /api/dashboard/stats HTTP/1.1
Host: localhost:5001
```

**Response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "totalEmployees": 6,
    "totalRequests": 5,
    "pendingRequests": 0,
    "approvedRequests": 3,
    "rejectedRequests": 2
  }
}
```
