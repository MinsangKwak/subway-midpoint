import { describe, expect, it } from 'vitest';
import { formatLineNames, formatMinutes, formatTransfers } from './format';

describe('formatMinutes', () => {
  it('rounds and never shows 0분', () => {
    expect(formatMinutes(0.2)).toBe('1분');
    expect(formatMinutes(12.4)).toBe('12분');
  });
  it('splits hours', () => {
    expect(formatMinutes(60)).toBe('1시간');
    expect(formatMinutes(75)).toBe('1시간 15분');
  });
  it('hides invalid values behind a dash', () => {
    expect(formatMinutes(NaN)).toBe('—');
    expect(formatMinutes(Infinity)).toBe('—');
    expect(formatMinutes(null)).toBe('—');
  });
});

describe('formatTransfers / formatLineNames', () => {
  it('formats counts', () => {
    expect(formatTransfers(0)).toBe('환승 없음');
    expect(formatTransfers(2)).toBe('환승 2회');
    expect(formatTransfers(undefined)).toBe('—');
  });
  it('joins line ids', () => {
    expect(formatLineNames(['1', '3', '5'])).toBe('1·3·5호선');
    expect(formatLineNames([])).toBe('—');
  });
});
