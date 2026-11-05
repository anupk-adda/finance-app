export type Ticker = string;

export type TimeWindow = 'today' | 'week' | 'quarter';

export interface Company {
  symbol: Ticker;
  name: string;
  isPrimary?: boolean;
}

export interface Quote {
  symbol: Ticker;
  price: number;
  change: number;
  changePercent: number;
}

export interface PricePoint {
  /** ISO 8601 timestamp */
  time: string;
  close: number;
}

export interface PriceSeries {
  symbol: Ticker;
  window: TimeWindow;
  points: PricePoint[];
}

/** Aggregate view of one series over its window (first/last close, range, % move). */
export interface SeriesSummary {
  symbol: Ticker;
  first: number;
  last: number;
  high: number;
  low: number;
  changePercent: number;
}

export interface RankedSummary extends SeriesSummary {
  /** 1 = best performer in the window */
  rank: number;
}

/** One x-axis row of a multi-ticker comparison chart: `time` plus one % value per symbol. */
export interface ChartRow {
  time: string;
  [symbol: string]: string | number | undefined;
}
