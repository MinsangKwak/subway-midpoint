import { useCallback, useMemo, useReducer } from 'react';
import { subwayGraph } from '@/data/subway';
import { calculateMidpoint } from '@/domain/subway/midpoint';
import {
  DEPARTURE_COLORS,
  hasDuplicateStations,
  initialPlannerState,
  plannerReducer,
  selectedStations,
} from './plannerReducer';

export const usePlanner = () => {
  const [state, dispatch] = useReducer(plannerReducer, undefined, initialPlannerState);

  const selected = useMemo(() => selectedStations(state), [state]);
  const duplicated = useMemo(() => hasDuplicateStations(state), [state]);
  const canCompute = selected.length >= 2 && !duplicated;

  const compute = useCallback(() => {
    if (!canCompute) return;
    const result = calculateMidpoint(
      subwayGraph,
      state.departures.map((d) => d.station?.nodeIds ?? []),
      { topN: 3 },
    );
    if (!result) {
      dispatch({ type: 'failed', message: '모든 출발지에서 갈 수 있는 역을 찾지 못했어요.' });
      return;
    }
    dispatch({ type: 'computed', result });
  }, [canCompute, state.departures]);

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
