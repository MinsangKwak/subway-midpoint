import { linesOf } from '@/data/subway';
import styles from './LineBadge.module.css';

type Props = {
  lineIds: string[];
  size?: 'sm' | 'md';
};

// 번호 노선은 노선색 원 안에 번호를, 이름 노선은 알약 모양 안에 짧은 이름을 표시한다.
// 색 위 글자는 항상 흰색이므로 어두운 노선색만 쓴다.
export const LineBadges = ({ lineIds, size = 'sm' }: Props) => {
  const lines = linesOf(lineIds);
  return (
    <span className={styles.group} aria-label={lines.map((l) => l.name).join(', ')}>
      {lines.map((line) => {
        const named = !/^\d+$/.test(line.id);
        return (
          <span
            key={line.id}
            className={[styles.badge, styles[size], named ? styles.pill : ''].join(' ')}
            style={{ background: line.color }}
          >
            {line.badge ?? line.id}
          </span>
        );
      })}
    </span>
  );
};
