import type { ReactElement } from 'react';

export type StatusBadgeTone =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'purple';

interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  dot?: boolean;
  className?: string;
}

export default function StatusBadge({
  label,
  tone = 'default',
  dot = false,
  className = '',
}: StatusBadgeProps): ReactElement {
  return (
    <span
      className={`mm-status-badge mm-status-badge--${tone}${
        className ? ` ${className}` : ''
      }`}
    >
      {dot ? <span className="mm-status-badge__dot" aria-hidden="true" /> : null}
      {label}
    </span>
  );
}