import { stationCatalog } from '@/data/subway';
import { Button } from '@/components/Button/Button';
import { Icon } from '@/components/Icon';
import { DepartureField } from './DepartureField';
import { MAX_DEPARTURES } from './plannerReducer';
import { ResultCard } from './ResultCard';
import type { Planner } from './usePlanner';
import styles from './PlannerPanel.module.css';

// dev 브랜치 미리보기 빌드(`--mode pages-dev`)에서만 표시를 붙인다
const IS_PREVIEW = import.meta.env.MODE === 'pages-dev';

type Props = {
  planner: Planner;
  onComputed?: () => void;
};

export const PlannerPanel = ({ planner, onComputed }: Props) => {
  const { state, dispatch, selected, duplicated, canCompute, compute, colorOf, candidate } = planner;
  const takenKeys = selected.map((d) => d.station.key);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    compute();
    onComputed?.();
  };

  return (
    <div className={styles.panel}>
      <header className={styles.header}>
        <p className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          Subway Midpoint
          {IS_PREVIEW && <span className={styles.previewTag}>dev preview</span>}
        </p>
        <h1 className={styles.title}>어디서 만날까요?</h1>
        <p className={styles.subtitle}>출발역을 2곳 이상 넣으면 모두에게 공평한 역을 찾아드려요.</p>
      </header>

      <form className={styles.form} onSubmit={submit}>
        <ul className={styles.fields}>
          {state.departures.map((d, i) => (
            <li key={d.id}>
              <DepartureField
                index={i}
                color={colorOf(d.id)}
                query={d.query}
                station={d.station}
                takenKeys={takenKeys.filter((k) => k !== d.station?.key)}
                removable={state.departures.length > 2}
                onQueryChange={(query) => dispatch({ type: 'setQuery', id: d.id, query })}
                onSelect={(station) => dispatch({ type: 'select', id: d.id, station })}
                onClear={() => dispatch({ type: 'clear', id: d.id })}
                onRemove={() => dispatch({ type: 'remove', id: d.id })}
              />
            </li>
          ))}
        </ul>

        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dispatch({ type: 'add' })}
            disabled={state.departures.length >= MAX_DEPARTURES}
          >
            <Icon name="plus" size={16} />
            출발지 추가
          </Button>
          {state.departures.some((d) => d.query) && (
            <Button variant="ghost" size="sm" onClick={() => dispatch({ type: 'reset' })}>
              모두 지우기
            </Button>
          )}
        </div>

        {duplicated && <p className={styles.warn}>같은 역이 두 번 들어 있어요.</p>}
        {state.error && <p className={styles.warn}>{state.error}</p>}

        <Button type="submit" fullWidth disabled={!canCompute}>
          중간지점 찾기
        </Button>
      </form>

      {state.result && candidate && (
        <ResultCard
          result={state.result}
          candidate={candidate}
          selectedIndex={state.selectedCandidate}
          departures={state.departures}
          colorOf={colorOf}
          onPick={(index) => dispatch({ type: 'pickCandidate', index })}
        />
      )}

      <footer className={styles.footer}>
        <p>
          수도권 전철 1~9호선 {stationCatalog.stations.length}개 역 · 역 데이터 ©{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>{' '}
          contributors
        </p>
        <a href="https://github.com/MinsangKwak/subway-midpoint" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
};
