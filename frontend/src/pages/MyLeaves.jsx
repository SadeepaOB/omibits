import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Search,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ClipboardList,
} from 'lucide-react';
import { getLeaves, getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import LeaveModal from '../components/LeaveModal';
import { useToast } from '../components/Toast';

export function MyLeaves() {
  const { user } = useAuth();
  const { showError } = useToast();

  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [search, setSearch]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);

  // Summary counters
  const pending  = leaves.filter((l) => l.status === 'Pending').length;
  const approved = leaves.filter((l) => l.status === 'Approved').length;
  const rejected = leaves.filter((l) => l.status === 'Rejected').length;

  useEffect(() => {
    fetchMyLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchMyLeaves = async (searchOverride) => {
    setLoading(true);
    setError(null);
    try {
      // Pass the logged-in user's email so the backend filters their requests
      const filters = {
        status: statusFilter,
        search: searchOverride !== undefined ? searchOverride : search,
        email: user?.email || '',
      };
      const data = await getLeaves(filters);
      setLeaves(data || []);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMyLeaves(search);
  };

  const handleReset = () => {
    setSearch('');
    setStatusFilter('');
    fetchMyLeaves('');
  };

  return (
    <div>
      {/* ── Mini Summary Counters ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {[
          { label: 'Pending', count: pending,  icon: Clock,        color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Approved', count: approved, icon: CheckCircle2, color: '#10b981', bg: '#ecfdf5' },
          { label: 'Rejected', count: rejected, icon: XCircle,      color: '#ef4444', bg: '#fef2f2' },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="surface-card"
            style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>
                {loading ? '—' : count}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Surface ── */}
      <div className="surface-card">
        <div className="surface-header">
          <div className="surface-title-group">
            <h2>My Leave Requests ({leaves.length})</h2>
            <p>View and track the status of your submitted leave applications</p>
          </div>

          <button
            onClick={() => setIsNewLeaveModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Request Leave</span>
          </button>
        </div>

        {/* ── Filter bar ── */}
        <div
          style={{
            padding: '14px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            alignItems: 'center',
          }}
        >
          <form onSubmit={handleSearchSubmit} className="search-box" style={{ minWidth: '220px' }}>
            <Search size={16} />
            <input
              type="text"
              placeholder="Search leave type, reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search my leave requests"
            />
          </form>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {(statusFilter || search) && (
            <button onClick={handleReset} className="btn btn-secondary btn-sm" title="Clear filters">
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div style={{ padding: '16px 24px' }}>
            <div className="alert-banner error">
              <AlertCircle size={18} />
              <div style={{ flex: 1 }}>{error}</div>
              <button onClick={() => fetchMyLeaves()} className="btn btn-secondary btn-sm">
                Retry
              </button>
            </div>
          </div>
        )}

        {/* ── Table ── */}
        {loading ? (
          <LoadingSpinner message="Loading your leave requests..." />
        ) : leaves.length === 0 ? (
          <EmptyState
            title="No leave requests yet"
            description="You haven't submitted any leave requests. Click below to request your first leave."
            actionLabel="Request Leave"
            onAction={() => setIsNewLeaveModalOpen(true)}
          />
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Admin Feedback</th>
                  <th>Applied On</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      #{leave.id}
                    </td>
                    <td>
                      <span className="leave-type-tag">{leave.leave_type}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                        {leave.start_date} → {leave.end_date}
                      </div>
                    </td>
                    <td>
                      <span className="reason-box" title={leave.reason}>
                        {leave.reason}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={leave.status} />
                    </td>
                    <td>
                      {leave.status === 'Rejected' && leave.rejection_reason ? (
                        <span
                          className="rejection-note"
                          title={leave.rejection_reason}
                          style={{ maxWidth: '200px', display: 'block' }}
                        >
                          {leave.rejection_reason}
                        </span>
                      ) : leave.status === 'Approved' ? (
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 500 }}>
                          ✓ Approved
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                          Awaiting review
                        </span>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {new Date(leave.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── New Leave Modal ── */}
      <LeaveModal
        isOpen={isNewLeaveModalOpen}
        onClose={() => setIsNewLeaveModalOpen(false)}
        onLeaveCreated={() => fetchMyLeaves()}
      />
    </div>
  );
}

export default MyLeaves;
