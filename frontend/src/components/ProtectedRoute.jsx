import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * ProtectedRoute Component
 * Guards private pages using the shared AuthContext session.
 * - If still loading session: shows a spinner.
 * - If no session: redirects to /login.
 * - If allowedRoles is specified: only users with a matching role may enter;
 *   others are redirected to their appropriate home page.
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}>          — any authenticated user
 *   <Route element={<ProtectedRoute allowedRoles={['admin']} />}>  — admins only
 */
export function ProtectedRoute({ allowedRoles, children }) {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--color-bg-app)',
        }}
      >
        <LoadingSpinner message="Verifying authentication session..." />
      </div>
    );
  }

  // Not authenticated → go to login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Role-restricted route: redirect to home if role doesn't match
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
