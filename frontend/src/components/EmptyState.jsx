import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'There are no items to display at this time.',
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="empty-state">
      <Icon className="empty-icon" />
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary btn-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
