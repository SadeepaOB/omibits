import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { getDashboardStats, getLeaves, getErrorMessage } from '../api/client';
import SummaryCard from '../components/SummaryCard';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import EmployeeModal from '../components/EmployeeModal';
import LeaveModal from '../components/LeaveModal';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, leavesData] = await Promise.all([
        getDashboardStats(),
        getLeaves(),
      ]);
      setStats(statsData);
      // Show most recent 5 leaves on the dashboard
      setRecentLeaves((leavesData || []).slice(0, 5));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  return (
    <div>
      {/* Action Header Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            System Summary
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Real-time synchronization with Supabase PostgreSQL database
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleRefresh} className="btn btn-secondary btn-sm" title="Refresh metrics">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button onClick={() => setIsEmployeeModalOpen(true)} className="btn btn-secondary btn-sm">
            <Plus size={14} />
            <span>Add Employee</span>
          </button>
          <button onClick={() => setIsLeaveModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={14} />
            <span>New Leave Request</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-banner error">
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>
            <strong>Unable to load dashboard data:</strong> {error}
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm">
            Try Again
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-grid">
        <SummaryCard
          title="Total Employees"
          value={stats?.totalEmployees}
          icon={Users}
          color="blue"
        />
        <SummaryCard
          title="Total Requests"
          value={stats?.totalRequests}
          icon={CalendarDays}
          color="purple"
        />
        <SummaryCard
          title="Pending Approval"
          value={stats?.pendingRequests}
          icon={Clock}
          color="amber"
        />
        <SummaryCard
          title="Approved Requests"
          value={stats?.approvedRequests}
          icon={CheckCircle2}
          color="green"
        />
        <SummaryCard
          title="Rejected Requests"
          value={stats?.rejectedRequests}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* Recent Leave Requests Surface */}
      <div className="surface-card">
        <div className="surface-header">
          <div className="surface-title-group">
            <h2>Recent Leave Applications</h2>
            <p>Latest employee submissions awaiting or updated with administrative decisions</p>
          </div>
          <Link to="/leaves" className="btn btn-secondary btn-sm">
            <span>View All Requests</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading recent leave records..." />
        ) : recentLeaves.length === 0 ? (
          <EmptyState
            title="No leave requests yet"
            description="Employees have not submitted any leave requests yet. You can submit one now for testing."
            actionLabel="Submit First Request"
            onAction={() => setIsLeaveModalOpen(true)}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {recentLeaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>
                      <div className="cell-primary">{leave.employee_name}</div>
                      <div className="cell-sub">{leave.employee_email}</div>
                    </td>
                    <td>{leave.employee_department}</td>
                    <td>
                      <span className="leave-type-tag">{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>
                        {leave.start_date} → {leave.end_date}
                      </div>
                    </td>
                    <td>
                      <span className="reason-box" title={leave.reason}>
                        {leave.reason}
                      </span>
                      {leave.status === 'Rejected' && leave.rejection_reason && (
                        <span className="rejection-note" title={leave.rejection_reason}>
                          Reason: {leave.rejection_reason}
                        </span>
                      )}
                    </td>
                    <td>
                      <StatusBadge status={leave.status} />
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                      {new Date(leave.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <EmployeeModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onEmployeeCreated={() => fetchDashboardData()}
      />

      <LeaveModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onLeaveCreated={() => fetchDashboardData()}
      />
    </div>
  );
}

export default Dashboard;
