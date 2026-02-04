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

const VARIANT_CLASS_MAP = {
  primary: 'bg-primary',
  text: 'text-primary',
  ghost: 'text-ghost',
} as const;

const SIZE_CLASS_MAP = {
  large: 'size-large',
  small: 'size-small',
} as const;

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
        styles[VARIANT_CLASS_MAP[variant]],
        styles[SIZE_CLASS_MAP[size]],
        fullWidth && styles['is-full-width'],
        disabled && styles['is-disabled'],
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
};
