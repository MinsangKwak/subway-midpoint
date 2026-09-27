import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { stationCatalog } from '@/data/subway';
import { searchStations } from '@/domain/subway/catalog';
import { normalizeStationName } from '@/domain/subway/graph';
import type { Station } from '@/domain/subway/types';
import { Icon } from '@/shared/ui/Icon';
import { LineBadges } from '@/features/planner/ui/LineBadge/LineBadge';
import styles from './DepartureField.module.css';

type Props = {
  index: number;
  color: string;
  query: string;
  station: Station | null;
  // 이미 다른 칸에서 고른 역은 목록에서 비활성화한다
  takenKeys: string[];
  removable: boolean;
  onQueryChange: (query: string) => void;
  onSelect: (station: Station) => void;
  onClear: () => void;
  onRemove: () => void;
};

// 검색어와 겹치는 부분을 굵게 표시한다. innerHTML 을 쓰지 않는다.
const Highlighted = ({ text, query }: { text: string; query: string }) => {
  const q = normalizeStationName(query);
  const at = q ? text.indexOf(q) : -1;
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className={styles.mark}>{text.slice(at, at + q.length)}</mark>
      {text.slice(at + q.length)}
    </>
  );
};

// 역 검색 콤보박스. WAI-ARIA combobox 패턴을 따르고 키보드로 고를 수 있다.
export const DepartureField = ({
  index,
  color,
  query,
  station,
  takenKeys,
  removable,
  onQueryChange,
  onSelect,
  onClear,
  onRemove,
}: Props) => {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  // 검색어가 바뀌면 강조 위치를 0으로 되돌린다. effect 대신 "마지막 검색어"를 같이 저장한다
  const [activeState, setActiveState] = useState({ query, index: 0 });
  const active = activeState.query === query ? activeState.index : 0;
  const setActive = (update: number | ((prev: number) => number)) =>
    setActiveState((s) => {
      const prev = s.query === query ? s.index : 0;
      return { query, index: typeof update === 'function' ? update(prev) : update };
    });

  const candidates = useMemo(
    () => (station ? [] : searchStations(stationCatalog, query)),
    [query, station],
  );
  const showList = open && candidates.length > 0;

  // 바깥을 누르면 목록을 닫는다
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const pick = (s: Station) => {
    if (takenKeys.includes(s.key)) return;
    onSelect(s);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 조합 중 Enter 는 글자 확정용이다. 이때 역을 고르면 안 된다
    if (e.nativeEvent.isComposing) return;
    if (!showList) {
      if (e.key === 'ArrowDown' && candidates.length > 0) setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, candidates.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const picked = candidates[active];
      if (picked) pick(picked);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={styles.root}>
      <div
        className={[styles.field, station ? styles.filled : ''].join(' ')}
        style={{ '--dep': color } as React.CSSProperties}
      >
        <span className={styles.dot} aria-hidden="true">
          {index + 1}
        </span>

        <input
          ref={inputRef}
          className={styles.input}
          role="combobox"
          aria-label={`${index + 1}번째 출발지`}
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder="출발역 이름"
          value={query}
          onChange={(e) => {
            onQueryChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />

        {station && <LineBadges lineIds={station.lineIds} />}

        {query.length > 0 ? (
          <button
            type="button"
            className={styles.action}
            aria-label="입력 지우기"
            onClick={() => {
              onClear();
              inputRef.current?.focus();
            }}
          >
            <Icon name="close" size={16} />
          </button>
        ) : removable ? (
          <button type="button" className={styles.action} aria-label="이 출발지 삭제" onClick={onRemove}>
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      {showList && (
        <ul id={listId} role="listbox" className={styles.list} aria-label="역 검색 결과">
          {candidates.map((s, i) => {
            const taken = takenKeys.includes(s.key);
            return (
              <li
                key={s.key}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                aria-disabled={taken}
                className={[styles.option, i === active ? styles.active : '', taken ? styles.taken : ''].join(' ')}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s)}
              >
                <LineBadges lineIds={s.lineIds} />
                <span className={styles.optionName}>
                  <Highlighted text={s.name} query={query} />
                </span>
                {taken && <span className={styles.takenLabel}>선택됨</span>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
