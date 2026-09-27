import { useEffect, useState } from 'react';
import { lineById, subwayGraph } from '@/data/subway';
import type { MidpointCandidate, MidpointResult } from '@/domain/subway/midpoint';
import { formatLineNames, formatMinutes, formatTransfers } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/Button/Button';
import { LineBadges } from '@/features/planner/ui/LineBadge/LineBadge';
import type { Departure } from '../model/plannerReducer';
import styles from './ResultCard.module.css';

type Props = {
  result: MidpointResult;
  candidate: MidpointCandidate;
  selectedIndex: number;
  departures: Departure[];
  colorOf: (departureId: string) => string;
  onPick: (index: number) => void;
};

const lineIdsOf = (name: string) =>
  Array.from(new Set(Object.values(subwayGraph.nodes).filter((n) => n.name === name).map((n) => n.lineId))).sort(
    (a, b) => Number(a) - Number(b),
  );

// 역명판 테두리: 노선이 하나면 그 색, 여럿이면 색을 잘라 이은 그라데이션
const signBorder = (lineIds: string[]) => {
  const colors = lineIds.map((id) => lineById.get(id)?.color ?? '#999');
  if (colors.length === 0) return 'var(--signal)';
  if (colors.length === 1) return colors[0];
  const step = 100 / colors.length;
  return `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`).join(', ')})`;
};

const buildShareText = (c: MidpointCandidate, departures: Departure[]) => {
  const lines = c.legs.map((leg) => {
    const from = departures[leg.index]?.station?.name ?? '출발지';
    return `- ${from} → ${formatMinutes(leg.minutes)} (${formatTransfers(leg.transfers)})`;
  });
  return [`중간지점: ${c.name}역 (${formatLineNames(lineIdsOf(c.name))})`, ...lines].join('\n');
};

export const ResultCard = ({ result, candidate, selectedIndex, departures, colorOf, onPick }: Props) => {
  const [copied, setCopied] = useState(false);
  const lineIds = lineIdsOf(candidate.name);
  const average = candidate.legs.length ? candidate.totalMinutes / candidate.legs.length : null;

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const share = async () => {
    const text = buildShareText(candidate, departures);
    try {
      if (navigator.share) {
        await navigator.share({ title: '지하철 중간지점', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // 사용자가 공유 시트를 닫은 경우 등. 조용히 넘긴다
    }
  };

  return (
    <section className={styles.card} aria-live="polite">
      <header
        className={styles.sign}
        style={{ '--sign-border': signBorder(lineIds) } as React.CSSProperties}
      >
        <div>
          <p className={styles.eyebrow}>{selectedIndex === 0 ? '가장 공평한 중간지점' : `${selectedIndex + 1}번째 후보`}</p>
          <h2 className={styles.title}>
            {candidate.name}
            <span className={styles.titleSuffix}>역</span>
          </h2>
          <div className={styles.lines}>
            <LineBadges lineIds={lineIds} size="md" />
            <span className={styles.lineNames}>{formatLineNames(lineIds)}</span>
          </div>
        </div>
        <IconButton label={copied ? '복사됨' : '결과 공유'} onClick={share}>
          <Icon name={copied ? 'check' : 'share'} />
        </IconButton>
      </header>

      <dl className={styles.stats}>
        <div>
          <dt>가장 오래 걸리는 사람</dt>
          <dd>{formatMinutes(candidate.maxMinutes)}</dd>
        </div>
        <div>
          <dt>평균</dt>
          <dd>{formatMinutes(average)}</dd>
        </div>
      </dl>

      <ul className={styles.legs}>
        {candidate.legs.map((leg) => {
          const dep = departures[leg.index];
          return (
            <li key={leg.index} className={styles.leg}>
              <span
                className={styles.legDot}
                style={{ '--legColor': dep ? colorOf(dep.id) : 'var(--ink-3)' } as React.CSSProperties}
              />
              <span className={styles.legName}>{dep?.station?.name ?? '출발지'}</span>
              <span className={styles.legMeta}>{formatTransfers(leg.transfers)}</span>
              <span className={styles.legTime}>{formatMinutes(leg.minutes)}</span>
            </li>
          );
        })}
      </ul>

      {result.candidates.length > 1 && (
        <div className={styles.alt}>
          <p className={styles.altLabel}>다른 후보</p>
          <div className={styles.chips} role="tablist" aria-label="중간지점 후보">
            {result.candidates.map((c, i) => (
              <button
                key={c.stationKey}
                type="button"
                role="tab"
                aria-selected={i === selectedIndex}
                className={[styles.chip, i === selectedIndex ? styles.chipActive : ''].join(' ')}
                onClick={() => onPick(i)}
              >
                {c.name}
                <span className={styles.chipTime}>{formatMinutes(c.maxMinutes)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <p className={styles.note}>소요시간은 역 간 거리로 추정한 값이라 실제와 다를 수 있어요.</p>
    </section>
  );
};
