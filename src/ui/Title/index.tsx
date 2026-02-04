import type { ReactNode } from 'react';
import styles from './style.module.css';

type TitleProps = {
  icon?: ReactNode;
  title: string;
  align?: 'center' | 'left';
};

export const Title = ({
  icon,
  title,
  align = 'center',
}: TitleProps) => {
  return (
    <div className={[styles.wrapper, styles[align]].join(' ')}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.title}>{title}</div>
    </div>
  );
};
