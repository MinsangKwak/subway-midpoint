import { describe, expect, it } from 'vitest';
import { stationCatalog } from '@/data/subway';
import {
  hasDuplicateStations,
  initialPlannerState,
  MAX_DEPARTURES,
  plannerReducer,
  selectedStations,
} from './plannerReducer';

const gangnam = stationCatalog.byKey['강남'];
const hongdae = stationCatalog.byKey['홍대입구'];

describe('plannerReducer', () => {
  it('starts with two empty departures', () => {
    const s = initialPlannerState();
    expect(s.departures).toHaveLength(2);
    expect(selectedStations(s)).toHaveLength(0);
  });

  it('caps departures and never drops below two', () => {
    let s = initialPlannerState();
    for (let i = 0; i < 10; i++) s = plannerReducer(s, { type: 'add' });
    expect(s.departures).toHaveLength(MAX_DEPARTURES);

    for (const d of [...s.departures]) s = plannerReducer(s, { type: 'remove', id: d.id });
    expect(s.departures).toHaveLength(2);
  });

  it('selecting a station fills the query and editing it clears the station', () => {
    let s = initialPlannerState();
    const id = s.departures[0].id;
    s = plannerReducer(s, { type: 'select', id, station: gangnam });
    expect(s.departures[0].query).toBe('강남');
    expect(s.departures[0].station?.key).toBe('강남');

    s = plannerReducer(s, { type: 'setQuery', id, query: '강' });
    expect(s.departures[0].station).toBeNull();
  });

  it('invalidates a result when departures change', () => {
    let s = initialPlannerState();
    const fakeResult = { best: { name: 'x' }, candidates: [] } as never;
    s = plannerReducer(s, { type: 'computed', result: fakeResult });
    expect(s.result).not.toBeNull();
    s = plannerReducer(s, { type: 'add' });
    expect(s.result).toBeNull();
  });

  it('detects duplicate stations', () => {
    let s = initialPlannerState();
    s = plannerReducer(s, { type: 'select', id: s.departures[0].id, station: gangnam });
    s = plannerReducer(s, { type: 'select', id: s.departures[1].id, station: gangnam });
    expect(hasDuplicateStations(s)).toBe(true);
    s = plannerReducer(s, { type: 'select', id: s.departures[1].id, station: hongdae });
    expect(hasDuplicateStations(s)).toBe(false);
  });
});
