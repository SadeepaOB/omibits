import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Menu,
  X,
  Briefcase,
  Shield,
  UserCircle,
  LogOut,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();
  const { isAdmin, isEmployee, user, role, signOut } = useAuth();

  // Page title / subtitle based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return isAdmin
          ? { title: 'Admin Dashboard',    subtitle: 'Live overview of workforce leave requests and operational status' }
          : { title: 'My Leave Requests',  subtitle: 'Submit and track your leave applications' };
      case '/my-leaves':
        return { title: 'My Leave Requests', subtitle: 'Submit and track your leave applications' };
      case '/employees':
        return { title: 'Employee Directory', subtitle: 'Manage company personnel and view department assignments' };
      case '/leaves':
        return { title: 'Leave Requests',    subtitle: 'Review, approve, or reject employee time-off applications' };
      default:
        return { title: 'Leave Management',  subtitle: 'Omibits Administration Portal' };
    }
  };

  const { title, subtitle } = getPageTitle();

  const closeMobile = () => setMobileOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-container">
      {/* ── Sidebar ── */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <Briefcase size={18} />
          </div>
          <div>
            <div className="brand-text">Omibits</div>
            <div className="brand-sub">Leave Manager</div>
          </div>
        </div>

        {/* ── Role badge in sidebar ── */}
        <div
          style={{
            margin: '0 16px 8px',
            padding: '8px 12px',
            borderRadius: 'var(--radius-md)',
            background: isAdmin ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {isAdmin
            ? <Shield size={14} color="#6366f1" />
            : <UserCircle size={14} color="#10b981" />
          }
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: isAdmin ? '#6366f1' : '#10b981',
              }}
            >
              {isAdmin ? 'Admin' : 'Employee'}
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '150px',
              }}
              title={user?.email}
            >
              {user?.email}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* ── Admin navigation ── */}
          {isAdmin && (
            <>
              <NavLink
                to="/"
                end
                onClick={closeMobile}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/employees"
                onClick={closeMobile}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <Users size={18} />
                <span>Employees</span>
              </NavLink>

              <NavLink
                to="/leaves"
                onClick={closeMobile}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <CalendarCheck size={18} />
                <span>Leave Requests</span>
              </NavLink>
            </>
          )}

          {/* ── Employee navigation ── */}
          {isEmployee && (
            <NavLink
              to="/my-leaves"
              onClick={closeMobile}
              className={({ isActive }) => `nav-link ${(isActive || location.pathname === '/') ? 'active' : ''}`}
            >
              <ClipboardList size={18} />
              <span>My Leaves</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={handleSignOut}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginBottom: '12px', justifyContent: 'center' }}
            title="Sign out"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
          <div
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-bg-app)',
              fontSize: '11px',
              color: 'var(--color-text-muted)',
              textAlign: 'center',
            }}
          >
            Omibits Intern Technical Task
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="main-wrapper">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="mobile-menu-btn"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="header-title-group">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="header-right">
            <span className="current-date">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;
