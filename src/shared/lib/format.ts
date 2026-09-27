// 화면에 숫자를 그대로 보간하지 않고 여기서 문자열로 바꾼다. NaN·Infinity 는 대시로.
export const formatMinutes = (minutes: number | null | undefined): string => {
  if (minutes == null || !Number.isFinite(minutes)) return '—';
  const m = Math.max(1, Math.round(minutes));
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest === 0 ? `${h}시간` : `${h}시간 ${rest}분`;
};

export const formatTransfers = (count: number | null | undefined): string => {
  if (count == null || !Number.isFinite(count)) return '—';
  return count === 0 ? '환승 없음' : `환승 ${count}회`;
};

export const formatLineNames = (lineIds: string[]): string =>
  lineIds.length === 0 ? '—' : `${lineIds.join('·')}호선`;
