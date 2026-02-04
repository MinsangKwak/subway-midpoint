import type { ReactNode } from "react";
import styles from './style.module.css';

type ButtonContainerProps = {
  children: ReactNode;
  direction?: 'column' | 'row'
}

export const ButtonContainer = ({
  children,
  direction = 'column'
}: ButtonContainerProps) => {
  return (
    <div
      className={[
        styles.container,
        styles[direction],
      ].join(' ')}>
      {children}
    </div>
  )
}