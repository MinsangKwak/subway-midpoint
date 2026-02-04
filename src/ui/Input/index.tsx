import type { InputHTMLAttributes } from 'react';
import styles from './style.module.css';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement>;

export const TextField = (props: TextFieldProps) => {
  return (
    <input
      {...props}
      className={styles.input}
    />
  );
};
