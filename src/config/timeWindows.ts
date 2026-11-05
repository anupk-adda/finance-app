import type { TimeWindow } from '../types/market';

export const TIME_WINDOWS: { id: TimeWindow; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'quarter', label: 'Last quarter' },
];

export interface WindowQuery {
  /** How far back to ask Yahoo for data. */
  lookbackDays: number;
  /** Candle size. Chosen so each window has a readable number of points. */
  interval: '5m' | '1h' | '1d';
}

/**
 * Single place that maps a UI window to a Yahoo request.
 * "today" asks for a few days of 5-minute data so the latest session is still
 * available on weekends/holidays; normalization keeps only the latest trading day.
 */
export const WINDOW_QUERY: Record<TimeWindow, WindowQuery> = {
  today: { lookbackDays: 5, interval: '5m' },
  week: { lookbackDays: 7, interval: '1h' },
  quarter: { lookbackDays: 92, interval: '1d' },
};

export function isTimeWindow(value: unknown): value is TimeWindow {
  return typeof value === 'string' && TIME_WINDOWS.some((w) => w.id === value);
}
