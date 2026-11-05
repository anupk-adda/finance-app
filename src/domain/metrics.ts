import type { ChartRow, PriceSeries, RankedSummary, SeriesSummary, TimeWindow } from '../types/market';

const round = (n: number): number => Math.round(n * 100) / 100;

export function percentChange(from: number, to: number): number {
  return from === 0 ? 0 : ((to - from) / from) * 100;
}

/** Needs at least two points to describe a move; otherwise returns null. */
export function summarizeSeries(series: PriceSeries): SeriesSummary | null {
  const { points } = series;
  if (points.length < 2) return null;
  const closes = points.map((p) => p.close);
  const first = closes[0];
  const last = closes[closes.length - 1];
  return {
    symbol: series.symbol,
    first,
    last,
    high: Math.max(...closes),
    low: Math.min(...closes),
    changePercent: round(percentChange(first, last)),
  };
}

/** Best performer first. Ties are broken alphabetically so the order is stable. */
export function rankSummaries(summaries: SeriesSummary[]): RankedSummary[] {
  return [...summaries]
    .sort((a, b) => b.changePercent - a.changePercent || a.symbol.localeCompare(b.symbol))
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

/** Characters of the ISO timestamp that identify a bucket (minute / hour / day). */
const BUCKET_LENGTH: Record<TimeWindow, number> = { today: 16, week: 13, quarter: 10 };

/**
 * Builds chart rows for a multi-ticker comparison. Each series is rebased to % change from
 * its own first point, then aligned across tickers by time bucket (hour for the week view,
 * day for the quarter view) because Yahoo timestamps differ slightly between symbols.
 */
export function buildRelativeRows(seriesList: PriceSeries[], window: TimeWindow): ChartRow[] {
  const rows = new Map<string, ChartRow>();
  for (const s of seriesList) {
    if (s.points.length === 0) continue;
    const base = s.points[0].close;
    for (const p of s.points) {
      const key = p.time.slice(0, BUCKET_LENGTH[window]);
      let row = rows.get(key);
      if (!row) {
        row = { time: p.time };
        rows.set(key, row);
      }
      row[s.symbol] = round(percentChange(base, p.close));
    }
  }
  return [...rows.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([, row]) => row);
}
