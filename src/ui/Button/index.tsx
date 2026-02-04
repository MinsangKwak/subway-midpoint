import type { ReactNode } from 'react';
import styles from './style.module.css';

type ButtonProps = {
  children: ReactNode;
  size?: 'large' | 'small';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export const Button = ({
  children,
  size = 'large',
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
