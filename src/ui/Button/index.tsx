import type { ReactNode } from 'react';
import styles from './style.module.css';

type ButtonProps = {
  children: ReactNode;
  size?: 'large' | 'small';
  variant?: 'primary' | 'text' | 'ghost';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export const Button = ({
  children,
  size = 'large',
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  onClick,
}: ButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
};
