import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
  fullWidth?: boolean;
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  type = 'button',
  ...rest
}: Props) => (
  <button
    type={type}
    className={[
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.full : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </button>
);

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  // 아이콘만 있는 버튼은 반드시 접근성 이름을 받는다
  label: string;
  children: ReactNode;
  tone?: 'default' | 'accent';
};

export const IconButton = ({ label, children, tone = 'default', className, ...rest }: IconButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={[styles.iconButton, tone === 'accent' ? styles.iconAccent : '', className ?? '']
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </button>
);
