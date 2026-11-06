import type { PricePoint, PriceSeries, Quote, Ticker, TimeWindow } from '../types/market';

/** Subset of a Yahoo quote that we depend on. Every field may be missing in practice. */
export interface RawQuote {
  symbol?: string;
  regularMarketPrice?: number | null;
  regularMarketChange?: number | null;
  regularMarketChangePercent?: number | null;
  regularMarketPreviousClose?: number | null;
}

/** Subset of a Yahoo chart candle that we depend on. */
export interface RawChartPoint {
  date?: Date | string | number | null;
  close?: number | null;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const round = (n: number): number => Math.round(n * 100) / 100;

/**
 * Raw Yahoo quote -> Quote. Returns null when there is no usable price.
 * Missing change values are derived from the previous close when possible,
 * otherwise reported as 0 so a partially filled quote still renders.
 */
export function normalizeQuote(raw: RawQuote): Quote | null {
  if (!raw.symbol || !isNum(raw.regularMarketPrice)) return null;
  const price = raw.regularMarketPrice;
  const prev = raw.regularMarketPreviousClose;

  let change = raw.regularMarketChange;
  if (!isNum(change) && isNum(prev)) change = price - prev;

  let pct = raw.regularMarketChangePercent;
  if (!isNum(pct) && isNum(change) && isNum(prev) && prev !== 0) pct = (change / prev) * 100;

  return {
    symbol: raw.symbol.toUpperCase(),
    price: round(price),
    change: round(isNum(change) ? change : 0),
    changePercent: round(isNum(pct) ? pct : 0),
  };
}

/** Keeps only the points that fall on the same (UTC) calendar day as the last point. */
export function keepLatestDay(points: PricePoint[]): PricePoint[] {
  if (points.length === 0) return points;
  const day = points[points.length - 1].time.slice(0, 10);
  return points.filter((p) => p.time.startsWith(day));
}

/**
 * Raw Yahoo candles -> PriceSeries.
 * Drops null/invalid points, de-duplicates timestamps (last one wins), sorts by time,
 * and for the "today" window keeps only the latest trading day.
 * "Day" is the UTC calendar day, which is correct for regular-session US candles (14:30-21:00 UTC).
 * Callers must not request extended-hours candles, and exchanges whose session spans midnight UTC
 * (e.g. Sydney) would be split across two days.
 */
export function normalizeSeries(symbol: Ticker, window: TimeWindow, raw: RawChartPoint[]): PriceSeries {
  const byTime = new Map<number, number>();
  for (const p of raw) {
    if (p.date == null || !isNum(p.close)) continue;
    const t = new Date(p.date).getTime();
    if (!Number.isFinite(t)) continue;
    byTime.set(t, p.close);
  }

  let points: PricePoint[] = [...byTime.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, close]) => ({ time: new Date(t).toISOString(), close: round(close) }));

  if (window === 'today') points = keepLatestDay(points);

  return { symbol: symbol.toUpperCase(), window, points };
}
