import type { ReactElement } from 'react';

interface LoaderProps {
  label?: string;
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Loader({
  label = 'Loading...',
  fullPage = false,
  size = 'md',
  className = '',
}: LoaderProps): ReactElement {
  return (
    <div
      className={`mm-loader${fullPage ? ' mm-loader--full-page' : ''}${
        className ? ` ${className}` : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <span className={`mm-loader__spinner mm-loader__spinner--${size}`} aria-hidden="true" />
      <span className="mm-loader__label">{label}</span>
    </div>
  );
}