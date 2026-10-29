import axios from 'axios';

// Base URL for the Express backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Helper to extract user-friendly error messages from axios error responses.
 */
export function getErrorMessage(error) {
  if (error.response && error.response.data) {
    if (error.response.data.message) {
      return error.response.data.message;
    }
    if (error.response.data.errors && error.response.data.errors.length > 0) {
      return error.response.data.errors.map((e) => e.message).join(', ');
    }
  }
  if (error.message) {
    return error.message;
  }
  return 'A network error occurred. Please make sure the backend server is running.';
}

// ==========================================
// Dashboard API
// ==========================================
export async function getDashboardStats() {
  const response = await api.get('/dashboard/stats');
  return response.data.data;
}

// ==========================================
// Employee APIs
// ==========================================
export async function getEmployees(searchTerm = '') {
  const params = {};
  if (searchTerm && searchTerm.trim() !== '') {
    params.search = searchTerm.trim();
  }
  const response = await api.get('/employees', { params });
  return response.data.data;
}

/**
 * Creates an employee using the required POST /api/em endpoint.
 */
export async function createEmployee(employeeData) {
  const response = await api.post('/em', employeeData);
  return response.data.data;
}

// ==========================================
// Leave Request APIs
// ==========================================
export async function getLeaves(filters = {}) {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.leaveType) params.leaveType = filters.leaveType;
  if (filters.department) params.department = filters.department;
  if (filters.search) params.search = filters.search;

  const response = await api.get('/leaves', { params });
  return response.data.data;
}

export async function createLeave(leaveData) {
  const response = await api.post('/leaves', leaveData);
  return response.data.data;
}

export async function approveLeave(id) {
  const response = await api.patch(`/leaves/${id}/approve`);
  return response.data.data;
}

export async function rejectLeave(id, rejectionReason) {
  const response = await api.patch(`/leaves/${id}/reject`, { rejectionReason });
  return response.data.data;
}

export default {
  getDashboardStats,
  getEmployees,
  createEmployee,
  getLeaves,
  createLeave,
  approveLeave,
  rejectLeave,
  getErrorMessage,
};
