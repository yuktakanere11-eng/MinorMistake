import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react';
import './Button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps): ReactElement {
  const classes = [
    'mm-button',
    `mm-button--${variant}`,
    `mm-button--${size}`,
    fullWidth ? 'mm-button--full' : '',
    isLoading ? 'mm-button--loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mm-button__spinner" aria-hidden="true" />
          <span className="mm-button__content">{children}</span>
        </>
      ) : (
        <>
          {leftIcon ? <span className="mm-button__icon">{leftIcon}</span> : null}
          <span className="mm-button__content">{children}</span>
          {rightIcon ? <span className="mm-button__icon">{rightIcon}</span> : null}
        </>
      )}
    </button>
  );
}