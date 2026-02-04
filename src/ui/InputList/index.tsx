import type { ReactNode } from 'react';
import styles from './style.module.css';

type InputListProps = {
  children: ReactNode;
};

export const InputList = ({ children }: InputListProps) => {
  return (
    <div className={styles.list}>
      {children}
    </div>
  );
};
