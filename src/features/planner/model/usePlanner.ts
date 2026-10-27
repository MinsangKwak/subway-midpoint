import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { stationCatalog, subwayGraph } from '@/data/subway';
import { calculateMidpoint } from '@/domain/subway/midpoint';
import {
  DEPARTURE_COLORS,
  hasDuplicateStations,
  initialPlannerState,
  plannerReducer,
  selectedStations,
  type PlannerState,
} from './plannerReducer';
import { buildPlannerQuery, parsePlannerQuery } from './urlState';

const TOP_N = 3;
const NO_ROUTE_MESSAGE = '모든 출발지에서 갈 수 있는 역을 찾지 못했어요.';

// 공유받은 주소로 열면 출발역을 채우고 바로 계산한 상태에서 시작한다
const initFromLocation = (): PlannerState => {
  const { stations, pick } = parsePlannerQuery(window.location.search, stationCatalog);
  const state = initialPlannerState(stations);
  if (stations.length < 2) return state;
  const result = calculateMidpoint(subwayGraph, stations.map((s) => s.nodeIds), { topN: TOP_N });
  if (!result) return { ...state, error: NO_ROUTE_MESSAGE };
  return { ...state, result, selectedCandidate: result.candidates[pick] ? pick : 0 };
};

export const usePlanner = () => {
  const [state, dispatch] = useReducer(plannerReducer, undefined, initFromLocation);

  const selected = useMemo(() => selectedStations(state), [state]);
  const duplicated = useMemo(() => hasDuplicateStations(state), [state]);
  const canCompute = selected.length >= 2 && !duplicated;

  const compute = useCallback(() => {
    if (!canCompute) return;
    const result = calculateMidpoint(
      subwayGraph,
      state.departures.map((d) => d.station?.nodeIds ?? []),
      { topN: TOP_N },
    );
    if (!result) {
      dispatch({ type: 'failed', message: NO_ROUTE_MESSAGE });
      return;
    }
    dispatch({ type: 'computed', result });
  }, [canCompute, state.departures]);

  // 결과가 있을 때만 주소에 출발역과 후보를 남긴다. 뒤로 가기 기록은 쌓지 않는다
  useEffect(() => {
    const query = state.result ? buildPlannerQuery(selected.map((d) => d.station), state.selectedCandidate) : '';
    const { pathname, search, hash } = window.location;
    if (query === search) return;
    window.history.replaceState(null, '', `${pathname}${query}${hash}`);
  }, [state.result, state.selectedCandidate, selected]);

  const colorOf = useCallback(
    (departureId: string) => {
      const index = state.departures.findIndex((d) => d.id === departureId);
      return DEPARTURE_COLORS[Math.max(0, index) % DEPARTURE_COLORS.length];
    },
    [state.departures],
  );

  const candidate = state.result?.candidates[state.selectedCandidate] ?? null;

  return { state, dispatch, selected, duplicated, canCompute, compute, colorOf, candidate };
};

export type Planner = ReturnType<typeof usePlanner>;
