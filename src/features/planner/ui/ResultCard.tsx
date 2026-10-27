import { useEffect, useState } from 'react';
import { lineById, linesOf } from '@/data/subway';
import type { MidpointCandidate, MidpointResult } from '@/domain/subway/midpoint';
import { formatLineNames, formatMinutes, formatTransfers } from '@/shared/lib/format';
import { Icon } from '@/shared/ui/Icon';
import { IconButton } from '@/shared/ui/Button/Button';
import { LineBadges } from '@/features/planner/ui/LineBadge/LineBadge';
import type { Departure } from '../model/plannerReducer';
import { buildPlannerQuery } from '../model/urlState';
import styles from './ResultCard.module.css';

type Props = {
  result: MidpointResult;
  candidate: MidpointCandidate;
  selectedIndex: number;
  departures: Departure[];
  colorOf: (departureId: string) => string;
  onPick: (index: number) => void;
};

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
  return [`중간지점: ${c.name}역 (${formatLineNames(linesOf(c.lineIds))})`, ...lines].join('\n');
};

// 받는 사람이 같은 출발역·후보로 바로 열 수 있는 주소
const buildShareUrl = (departures: Departure[], selectedIndex: number) => {
  const stations = departures.flatMap((d) => (d.station ? [d.station] : []));
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${buildPlannerQuery(stations, selectedIndex)}`;
};

export const ResultCard = ({ result, candidate, selectedIndex, departures, colorOf, onPick }: Props) => {
  const [copied, setCopied] = useState(false);
  const lineIds = candidate.lineIds;
  const average = candidate.legs.length ? candidate.totalMinutes / candidate.legs.length : null;

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  // 탭 패턴: 선택된 칩만 Tab 순서에 두고, 방향키·Home·End 로 다른 후보를 고른다
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = result.candidates.length - 1;
    const next =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? Math.min(selectedIndex + 1, last)
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? Math.max(selectedIndex - 1, 0)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null;
    if (next === null || next === selectedIndex) return;
    e.preventDefault();
    onPick(next);
    (e.currentTarget.children[next] as HTMLElement | undefined)?.focus();
  };

  const share = async () => {
    const text = buildShareText(candidate, departures);
    const url = buildShareUrl(departures, selectedIndex);
    try {
      if (navigator.share) {
        await navigator.share({ title: '지하철 중간지점', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
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
            <span className={styles.lineNames}>{formatLineNames(linesOf(lineIds))}</span>
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
          <div className={styles.chips} role="tablist" aria-label="중간지점 후보" onKeyDown={onTabKeyDown}>
            {result.candidates.map((c, i) => (
              <button
                key={c.stationKey}
                type="button"
                role="tab"
                aria-selected={i === selectedIndex}
                tabIndex={i === selectedIndex ? 0 : -1}
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
