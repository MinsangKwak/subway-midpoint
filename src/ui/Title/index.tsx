import type { ReactNode } from 'react';
import styles from './style.module.css';

type TitleProps = {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
};

const ALIGN_CLASS_MAP = {
  center: 'align-center',
  left: 'align-left',
} as const;

export const Title = ({
  icon,
  title,
  subtitle,
  align = 'center',
}: TitleProps) => {
  return (
    <div
      className={[
        styles['title-wrapper'],
        styles[ALIGN_CLASS_MAP[align]],
      ].join(' ')}
    >
      {icon && (
        <div className={styles['title-icon']}>
          {icon}
        </div>
      )}
      <div className={styles['title-text']}>
        {title}
        {subtitle && (
          <span className={styles['title-description']}>{subtitle}</span>
        )}
      </div>
    </div>
  );
};
