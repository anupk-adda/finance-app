import { MarketDataError } from './errors';
import type { MarketDataService } from './marketDataService';
import type { PricePoint, PriceSeries, Quote, Ticker, TimeWindow } from '../types/market';

const POINTS: Record<TimeWindow, number> = { today: 24, week: 7, quarter: 63 };
const STEP_MS: Record<TimeWindow, number> = {
  today: 60 * 60 * 1000,
  week: 24 * 60 * 60 * 1000,
  quarter: 24 * 60 * 60 * 1000,
};

/** Deterministic pseudo-random value in [0, 1) so mock data is stable across renders and tests. */
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function hash(symbol: string): number {
  return [...symbol].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function basePrice(symbol: string): number {
  return 80 + (hash(symbol) % 200);
}

/** Tickers the mock "knows". Anything else behaves like an unknown symbol on Yahoo. */
export const MOCK_SYMBOLS: readonly string[] = [
  'IBM', 'MSFT', 'ORCL', 'SAP', 'CRM',
  'NVDA', 'AAPL', 'GOOGL', 'AMZN', 'META', 'INTC', 'ADBE',
];

/** Offline/test data source. Reference time is fixed so output is reproducible. */
export function createMockMarketDataService(
  now: Date = new Date('2025-01-31T16:00:00Z'),
): MarketDataService {
  return {
    async getQuotes(symbols) {
      // Like the real endpoint, unknown symbols are simply left out of the result.
      return symbols.filter((s) => MOCK_SYMBOLS.includes(s)).map((symbol): Quote => {
        const price = basePrice(symbol);
        const change = (seeded(hash(symbol)) - 0.5) * 6;
        return {
          symbol,
          price: round(price),
          change: round(change),
          changePercent: round((change / price) * 100),
        };
      });
    },

    async getHistory(symbol: Ticker, window: TimeWindow): Promise<PriceSeries> {
      if (!MOCK_SYMBOLS.includes(symbol)) {
        throw new MarketDataError('INVALID_SYMBOL', `Unknown or unavailable symbol: ${symbol}`);
      }
      const count = POINTS[window];
      const start = basePrice(symbol);
      const points: PricePoint[] = Array.from({ length: count }, (_, i) => {
        const drift = (seeded(hash(symbol) + i) - 0.5) * 4;
        return {
          time: new Date(now.getTime() - (count - 1 - i) * STEP_MS[window]).toISOString(),
          close: round(start + drift + i * 0.1),
        };
      });
      return { symbol, window, points };
    },
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
