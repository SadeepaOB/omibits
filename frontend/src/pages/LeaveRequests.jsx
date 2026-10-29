import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  getLeaves,
  approveLeave,
  rejectLeave,
  getErrorMessage,
} from '../api/client';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import LeaveModal from '../components/LeaveModal';
import RejectModal from '../components/RejectModal';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { useToast } from '../components/Toast';

export function LeaveRequests() {
  const { showSuccess, showError } = useToast();

  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [filters, setFilters] = useState({
    status: '',
    leaveType: '',
    department: '',
    search: '',
  });

  // Modal & Dialog states
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);

  // Approve dialog
  const [approvingLeave, setApprovingLeave] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // Reject dialog
  const [rejectingLeave, setRejectingLeave] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, [filters.status, filters.leaveType, filters.department]);

  const fetchLeaves = async (searchOverride) => {
    setLoading(true);
    setError(null);
    try {
      const activeFilters = {
        status: filters.status,
        leaveType: filters.leaveType,
        department: filters.department,
        search: searchOverride !== undefined ? searchOverride : filters.search,
      };
      const data = await getLeaves(activeFilters);
      setLeaves(data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLeaves(filters.search);
  };

  const handleResetFilters = () => {
    const cleared = { status: '', leaveType: '', department: '', search: '' };
    setFilters(cleared);
    fetchLeaves('');
  };

  // ==========================================
  // Approve Action Handler
  // ==========================================
  const handleApproveConfirm = async () => {
    if (!approvingLeave) return;

    setIsApproving(true);
    try {
      await approveLeave(approvingLeave.id);
      showSuccess(`Leave request #${approvingLeave.id} approved successfully!`);
      setApprovingLeave(null);
      // Refresh list
      fetchLeaves();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setIsApproving(false);
    }
  };

  // ==========================================
  // Reject Action Handler
  // ==========================================
  const handleRejectConfirm = async (id, reason) => {
    setIsRejecting(true);
    try {
      await rejectLeave(id, reason);
      showSuccess(`Leave request #${id} rejected.`);
      setRejectingLeave(null);
      // Refresh list
      fetchLeaves();
    } catch (err) {
      showError(getErrorMessage(err));
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div>
      {/* Surface Card with Filters & Actions */}
      <div className="surface-card">
        <div className="surface-header">
          <div className="surface-title-group">
            <h2>Leave Applications ({leaves.length})</h2>
            <p>Filter, review, approve, and manage corporate employee leave requests</p>
          </div>

          <button onClick={() => setIsNewLeaveModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>New Leave Request</span>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="search-box" style={{ minWidth: '220px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search employee, email, reason..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              aria-label="Search leave requests"
            />
          </form>

          {/* Status Filter */}
          <select
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Leave Type Filter */}
          <select
            className="filter-select"
            value={filters.leaveType}
            onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
            aria-label="Filter by leave type"
          >
            <option value="">All Leave Types</option>
            <option value="Annual">Annual</option>
            <option value="Casual">Casual</option>
            <option value="Medical">Medical</option>
          </select>

          {/* Department Filter */}
          <select
            className="filter-select"
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            aria-label="Filter by department"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Quality Assurance">Quality Assurance</option>
            <option value="Product Management">Product Management</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance">Finance</option>
          </select>

          {/* Reset Filters */}
          {(filters.status || filters.leaveType || filters.department || filters.search) && (
            <button onClick={handleResetFilters} className="btn btn-secondary btn-sm" title="Clear all filters">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Error notification */}
        {error && (
          <div style={{ padding: '16px 24px' }}>
            <div className="alert-banner error">
              <AlertCircle size={18} />
              <div style={{ flex: 1 }}>{error}</div>
              <button onClick={() => fetchLeaves()} className="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Table Content */}
        {loading ? (
          <LoadingSpinner message="Loading leave applications..." />
        ) : leaves.length === 0 ? (
          <EmptyState
            title="No leave requests found"
            description="No applications match the current filter criteria or none have been submitted yet."
            actionLabel="Submit Leave Request"
            onAction={() => setIsNewLeaveModalOpen(true)}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Reason & Feedback</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => {
                  const isPending = leave.status === 'Pending';
                  return (
                    <tr key={leave.id}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                        #{leave.id}
                      </td>
                      <td>
                        <div className="cell-primary">{leave.employee_name}</div>
                        <div className="cell-sub">{leave.employee_email}</div>
                      </td>
                      <td>{leave.employee_department}</td>
                      <td>
                        <span className="leave-type-tag">{leave.leave_type}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {leave.start_date} → {leave.end_date}
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '300px' }}>
                          <span className="reason-box" title={leave.reason}>
                            {leave.reason}
                          </span>
                          {leave.status === 'Rejected' && leave.rejection_reason && (
                            <span className="rejection-note" title={leave.rejection_reason}>
                              <strong>Rejection reason:</strong> {leave.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={leave.status} />
                      </td>
                      <td>
                        {isPending ? (
                          <div className="action-buttons">
                            <button
                              onClick={() => setApprovingLeave(leave)}
                              className="btn btn-outline-success btn-sm"
                              title="Approve this leave request"
                            >
                              <CheckCircle size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setRejectingLeave(leave)}
                              className="btn btn-outline-danger btn-sm"
                              title="Reject this leave request with a reason"
                            >
                              <XCircle size={14} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                            Decision finalized
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Leave Request Modal */}
      <LeaveModal
        isOpen={isNewLeaveModalOpen}
        onClose={() => setIsNewLeaveModalOpen(false)}
        onLeaveCreated={() => fetchLeaves()}
      />

      {/* Confirmation Dialog for Approval */}
      <ConfirmationDialog
        isOpen={Boolean(approvingLeave)}
        onClose={() => setApprovingLeave(null)}
        onConfirm={handleApproveConfirm}
        title="Approve Leave Request"
        message={
          approvingLeave
            ? `Are you sure you want to approve ${approvingLeave.leave_type} leave for ${approvingLeave.employee_name} (${approvingLeave.start_date} to ${approvingLeave.end_date})?`
            : ''
        }
        confirmLabel="Approve Request"
        confirmVariant="success"
        isLoading={isApproving}
      />

      {/* Rejection Modal with mandatory reason */}
      <RejectModal
        isOpen={Boolean(rejectingLeave)}
        onClose={() => setRejectingLeave(null)}
        onConfirm={handleRejectConfirm}
        leaveRequest={rejectingLeave}
        isLoading={isRejecting}
      />
    </div>
  );
}

export default LeaveRequests;
