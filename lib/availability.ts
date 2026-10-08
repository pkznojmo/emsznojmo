export type TimeInterval = { start: number; end: number };

export const timeToMinutes = (value: string): number => {
  const [hours, minutes] = value.trim().split(':').map(Number);
  return hours * 60 + minutes;
};

export const intervalsOverlap = (start: number, end: number, otherStart: number, otherEnd: number) =>
  start < otherEnd && end > otherStart;

export const isRangeCovered = (start: number, end: number, intervals: TimeInterval[]) => {
  if (end <= start) return false;
  const sorted = intervals
    .filter(interval => interval.end > interval.start)
    .map(interval => ({ start: Math.max(start, interval.start), end: Math.min(end, interval.end) }))
    .filter(interval => interval.end > interval.start)
    .sort((a, b) => a.start - b.start);

  let coveredUntil = start;
  for (const interval of sorted) {
    if (interval.start > coveredUntil) return false;
    coveredUntil = Math.max(coveredUntil, interval.end);
    if (coveredUntil >= end) return true;
  }
  return false;
};

export const normalizeDate = (value: string) => value.slice(0, 10);
