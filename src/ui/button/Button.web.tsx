import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  size?: 'large' | 'small';
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function Button({
  children,
  size = 'large',
  fullWidth = false,
  disabled = false,
  onClick,
}: ButtonProps) {
  const height = size === 'large' ? 52 : 40;

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        height,
        width: fullWidth ? '100%' : 'auto',
        padding: '0 20px',
        borderRadius: 12,
        border: 'none',
        fontSize: size === 'large' ? 16 : 14,
        fontWeight: 600,
        backgroundColor: disabled ? '#E5E8EB' : '#3B82F6',
        color: disabled ? '#9AA0A6' : '#FFFFFF',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}
