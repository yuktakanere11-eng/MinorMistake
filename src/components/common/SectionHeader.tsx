import type { ReactElement, ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  align?: 'start' | 'center';
  className?: string;
}

export default function SectionHeader({
  title,
  description,
  action,
  align = 'start',
  className = '',
}: SectionHeaderProps): ReactElement {
  return (
    <div
      className={`mm-section-header mm-section-header--${align}${
        className ? ` ${className}` : ''
      }`}
    >
      <div className="mm-section-header__copy">
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>

      {action ? <div className="mm-section-header__action">{action}</div> : null}
    </div>
  );
}