import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layouts/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import LeaveRequests from './pages/LeaveRequests';
import MyLeaves from './pages/MyLeaves';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import { useAuth } from './context/AuthContext';

/**
 * RoleBasedHome
 * Decides which page to show at "/" based on the user's role.
 * Admins → Dashboard  |  Employees → My Leaves
 */
function RoleBasedHome() {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <Dashboard /> : <MyLeaves />;
}

export function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Public Authentication Routes ── */}
          <Route path="/login"    element={<SignIn />} />
          <Route path="/signin"   element={<Navigate to="/login" replace />} />
          <Route path="/signup"   element={<SignUp />} />
          <Route path="/register" element={<Navigate to="/signup" replace />} />

          {/* ── Protected Application Routes (any authenticated user) ── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              {/* Home adapts to role */}
              <Route index element={<RoleBasedHome />} />
              <Route path="dashboard" element={<Navigate to="/" replace />} />

              {/* Employee: their own leave requests */}
              <Route path="my-leaves" element={<MyLeaves />} />

              {/* Admin-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="employees" element={<Employees />} />
                <Route path="leaves"    element={<LeaveRequests />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
