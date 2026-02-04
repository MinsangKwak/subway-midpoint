import { ReactNode } from 'react';
import styles from './style.module.css';

type LayoutProps = {
  children: ReactNode
}

export const Layout = ({
  children
}: LayoutProps) => {
  return (
    <section className={styles.main}>
      {children}
    </section>
  )
}