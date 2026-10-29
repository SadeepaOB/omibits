import React from 'react';

/**
 * SummaryCard Component
 * Displays a single dashboard metric with an icon and value.
 */
export function SummaryCard({ title, value, icon: Icon, color = 'blue' }) {
  return (
    <div className="summary-card">
      <div className={`card-icon-box ${color}`}>
        {Icon && <Icon size={24} />}
      </div>
      <div className="card-info">
        <span className="card-label">{title}</span>
        <span className="card-value">{value !== undefined && value !== null ? value : '-'}</span>
      </div>
    </div>
  );
}

export default SummaryCard;
