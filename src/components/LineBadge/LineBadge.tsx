import { lineById } from '@/data/subway';
import styles from './LineBadge.module.css';

type Props = {
  lineIds: string[];
  size?: 'sm' | 'md';
};

// 노선 번호를 노선색 원 안에 표시한다. 색 위 글자는 항상 흰색이므로 어두운 노선색만 쓴다.
export const LineBadges = ({ lineIds, size = 'sm' }: Props) => (
  <span className={styles.group} aria-label={`${lineIds.join(', ')}호선`}>
    {lineIds.map((id) => (
      <span
        key={id}
        className={[styles.badge, styles[size]].join(' ')}
        style={{ background: lineById.get(id)?.color ?? 'var(--ink-3)' }}
      >
        {id}
      </span>
    ))}
  </span>
);
