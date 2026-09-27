import type { MidpointResult } from '@/domain/subway/midpoint';
import type { Station } from '@/domain/subway/types';

export const MAX_DEPARTURES = 6;

// 출발지별 고정 색. 인덱스로 정하므로 새로고침해도 같은 색이 나온다.
export const DEPARTURE_COLORS = ['#ff6a3d', '#2f6df6', '#12b76a', '#c026d3', '#0891b2', '#14213d'];

export type Departure = {
  id: string;
  query: string;
  station: Station | null;
};

export type PlannerState = {
  departures: Departure[];
  result: MidpointResult | null;
  // 결과 카드에서 보고 있는 후보 인덱스
  selectedCandidate: number;
  error: string | null;
};

export type PlannerAction =
  | { type: 'add' }
  | { type: 'remove'; id: string }
  | { type: 'setQuery'; id: string; query: string }
  | { type: 'select'; id: string; station: Station }
  | { type: 'clear'; id: string }
  | { type: 'computed'; result: MidpointResult }
  | { type: 'failed'; message: string }
  | { type: 'pickCandidate'; index: number }
  | { type: 'reset' };

let seq = 0;
export const createDeparture = (): Departure => ({
  id: `dep-${++seq}-${Date.now().toString(36)}`,
  query: '',
  station: null,
});

export const initialPlannerState = (): PlannerState => ({
  departures: [createDeparture(), createDeparture()],
  result: null,
  selectedCandidate: 0,
  error: null,
});

// 출발지가 바뀌면 이전 결과는 더 이상 맞지 않으므로 지운다
const invalidate = (state: PlannerState): PlannerState => ({
  ...state,
  result: null,
  selectedCandidate: 0,
  error: null,
});

export const plannerReducer = (state: PlannerState, action: PlannerAction): PlannerState => {
  switch (action.type) {
    case 'add':
      if (state.departures.length >= MAX_DEPARTURES) return state;
      return invalidate({ ...state, departures: [...state.departures, createDeparture()] });

    case 'remove': {
      // 최소 2칸은 유지한다
      if (state.departures.length <= 2) return state;
      return invalidate({
        ...state,
        departures: state.departures.filter((d) => d.id !== action.id),
      });
    }

    case 'setQuery':
      return invalidate({
        ...state,
        departures: state.departures.map((d) =>
          d.id === action.id
            ? // 입력을 바꾸면 이전에 고른 역은 무효다. 글자가 그대로면 유지한다
              { ...d, query: action.query, station: d.station?.name === action.query ? d.station : null }
            : d,
        ),
      });

    case 'select':
      return invalidate({
        ...state,
        departures: state.departures.map((d) =>
          d.id === action.id ? { ...d, query: action.station.name, station: action.station } : d,
        ),
      });

    case 'clear':
      return invalidate({
        ...state,
        departures: state.departures.map((d) =>
          d.id === action.id ? { ...d, query: '', station: null } : d,
        ),
      });

    case 'computed':
      return { ...state, result: action.result, selectedCandidate: 0, error: null };

    case 'failed':
      return { ...state, result: null, selectedCandidate: 0, error: action.message };

    case 'pickCandidate':
      if (!state.result || !state.result.candidates[action.index]) return state;
      return { ...state, selectedCandidate: action.index };

    case 'reset':
      return initialPlannerState();
  }
};

export const selectedStations = (state: PlannerState) =>
  state.departures.filter((d): d is Departure & { station: Station } => d.station !== null);

export const hasDuplicateStations = (state: PlannerState) => {
  const keys = selectedStations(state).map((d) => d.station.key);
  return new Set(keys).size !== keys.length;
};
