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

export const findExceptionForSlot = <T extends { date: string; start_time: string; end_time: string }>(
  exceptions: T[],
  date: string,
  startTime: string,
): T | undefined => {
  const slotStart = timeToMinutes(startTime);
  return exceptions
    .filter(exception =>
      normalizeDate(exception.date) === date &&
      slotStart >= timeToMinutes(exception.start_time) &&
      slotStart < timeToMinutes(exception.end_time)
    )
    .sort((a, b) => {
      const aStart = timeToMinutes(a.start_time);
      const bStart = timeToMinutes(b.start_time);
      const aExact = aStart === slotStart;
      const bExact = bStart === slotStart;
      if (aExact !== bExact) return aExact ? -1 : 1;
      return (timeToMinutes(a.end_time) - aStart) - (timeToMinutes(b.end_time) - bStart);
    })[0];
};

export const exceptionTypeForSlot = (status: 'REGULAR_WORKING' | 'EXTRA_WORKING' | 'BLOCKED' | 'OFF') =>
  status === 'REGULAR_WORKING' || status === 'EXTRA_WORKING' ? 'UNAVAILABLE' : 'AVAILABLE';

export const getIsoWeekDays = (todayISO: string, weekOffset = 0) => {
  const [year, month, day] = todayISO.split('-').map(Number);
  const today = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = today.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(Date.UTC(year, month - 1, day + daysToMonday + weekOffset * 7));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday.getTime() + index * 24 * 60 * 60 * 1000);
    return { isoString: date.toISOString().slice(0, 10), dayOfWeek: date.getUTCDay() };
  });
};
