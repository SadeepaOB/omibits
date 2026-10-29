import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Menu,
  X,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Determine current page title based on path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/dashboard':
        return {
          title: 'Admin Dashboard',
          subtitle: 'Live overview of workforce leave requests and operational status',
        };
      case '/employees':
        return {
          title: 'Employee Directory',
          subtitle: 'Manage company personnel and view department assignments',
        };
      case '/leaves':
        return {
          title: 'Leave Requests',
          subtitle: 'Review, approve, or reject employee time-off applications',
        };
      default:
        return {
          title: 'Leave Management',
          subtitle: 'Omibits Administration Portal',
        };
    }
  };

  const { title, subtitle } = getPageTitle();

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
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

        <nav className="sidebar-nav">
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
        </nav>

        <div className="sidebar-footer">
          <div className="admin-demo-pill" title="Demonstration Mode">
            <ShieldAlert size={14} color="#f59e0b" />
            <span>Admin Demonstration</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Omibits Intern Technical Task
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
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
