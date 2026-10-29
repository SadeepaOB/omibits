import React from 'react';

/**
 * StatusBadge Component
 * Displays a colorful, accessible badge for leave request statuses:
 * - Approved: Green
 * - Pending: Amber
 * - Rejected: Red
 */
export function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  let statusClass = 'pending';
  let label = 'Pending';

  if (normalized === 'approved') {
    statusClass = 'approved';
    label = 'Approved';
  } else if (normalized === 'rejected') {
    statusClass = 'rejected';
    label = 'Rejected';
  }

  return (
    <span className={`status-badge ${statusClass}`} role="status">
      <span className="badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export default StatusBadge;
