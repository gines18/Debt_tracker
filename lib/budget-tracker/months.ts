import {
  addMonths,
  format,
  parseISO,
  startOfMonth,
  isValid,
} from "date-fns";

/** Normalise to first day of month (UTC-safe for date-only strings). */
export function monthStartFromDate(isoDate: string): Date {
  const d = parseISO(isoDate.slice(0, 10));
  return startOfMonth(isValid(d) ? d : new Date());
}

export function monthKeyFromDate(d: Date): string {
  return format(startOfMonth(d), "yyyy-MM-dd");
}

/** Ordered column keys: starting month from budget start_date, then forward months present in data. */
export function buildMonthColumns(
  startDateIso: string,
  recordMonths: string[],
): string[] {
  const start = monthStartFromDate(startDateIso);
  const startKey = monthKeyFromDate(start);
  const set = new Set<string>([startKey, ...recordMonths.map((m) => m.slice(0, 10))]);
  const sorted = [...set].sort();
  // Ensure contiguous from start through max month (fill gaps for empty columns)
  const max = sorted[sorted.length - 1];
  if (!max) return [startKey];
  let cursor = start;
  const maxDate = parseISO(max);
  const keys: string[] = [];
  while (cursor <= maxDate) {
    keys.push(monthKeyFromDate(cursor));
    cursor = addMonths(cursor, 1);
  }
  return keys;
}

export function formatMonthHeader(isoMonth: string, isStarting: boolean): string {
  const d = parseISO(isoMonth.slice(0, 10));
  const label = format(d, "MMM yyyy");
  return isStarting ? `Starting (${label})` : label;
}

export function nextMonthKey(lastMonthIso: string): string {
  const d = addMonths(parseISO(lastMonthIso.slice(0, 10)), 1);
  return monthKeyFromDate(d);
}
