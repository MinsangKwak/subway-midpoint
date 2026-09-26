import { useEffect, useMemo, useState } from 'react';
import { KakaoMap, type MapMarker, type MapRoute } from '@/features/map/KakaoMap';
import { PlannerPanel } from '@/features/planner/PlannerPanel';
import { usePlanner } from '@/features/planner/usePlanner';
import { Icon } from '@/components/Icon';

const MOBILE_QUERY = '(max-width: 720px)';

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => window.matchMedia(MOBILE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return mobile;
};

export const App = () => {
  const planner = usePlanner();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const { state, selected, colorOf, candidate } = planner;

  const markers = useMemo<MapMarker[]>(
    () =>
      selected.map((d) => ({
        id: d.id,
        position: { latitude: d.station.latitude, longitude: d.station.longitude },
        color: colorOf(d.id),
        label: d.station.name,
      })),
    [selected, colorOf],
  );

  const routes = useMemo<MapRoute[]>(
    () =>
      candidate
        ? candidate.legs.map((leg) => {
            const dep = state.departures[leg.index];
            return { id: `${candidate.stationKey}-${leg.index}`, color: dep ? colorOf(dep.id) : '#999', points: leg.points };
          })
        : [],
    [candidate, state.departures, colorOf],
  );

  // 마지막으로 고른 출발지로 지도를 옮긴다
  const focus = useMemo(() => {
    const last = selected[selected.length - 1];
    return last ? { latitude: last.station.latitude, longitude: last.station.longitude } : null;
  }, [selected]);

  const midpoint = candidate
    ? { latitude: candidate.latitude, longitude: candidate.longitude, name: candidate.name }
    : null;

  return (
    <div className="app">
      <div className="app__map">
        <KakaoMap
          focus={focus}
          markers={markers}
          routes={routes}
          midpoint={midpoint}
          insetLeft={isMobile ? 0 : 380 + 16}
          insetBottom={isMobile ? (collapsed ? 96 : 320) : 0}
        />
      </div>

      <aside
        className={['app__panel', isMobile && collapsed ? 'app__panel--collapsed' : ''].join(' ')}
        aria-label="중간지점 찾기"
      >
        {isMobile && (
          <button
            type="button"
            className="app__handle"
            aria-label={collapsed ? '패널 펼치기' : '패널 접기'}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((v) => !v)}
          >
            <span hidden>
              <Icon name={collapsed ? 'chevronUp' : 'chevronDown'} />
            </span>
          </button>
        )}
        <div className="app__panelBody">
          <PlannerPanel planner={planner} onComputed={() => isMobile && setCollapsed(true)} />
        </div>
      </aside>
    </div>
  );
};
