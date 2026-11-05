import { MarketDataError, type MarketDataErrorCode } from './errors';
import type { MarketDataService } from './marketDataService';
import type { PriceSeries, Quote, Ticker, TimeWindow } from '../types/market';

interface HttpServiceOptions {
  /** Prefix for API calls. Empty string = same origin (Vite dev proxy forwards /api). */
  baseUrl?: string;
  fetchFn?: typeof fetch;
}

const KNOWN_CODES: MarketDataErrorCode[] = ['INVALID_SYMBOL', 'NO_DATA', 'NETWORK', 'UPSTREAM'];

/** Talks to the Express proxy in /server, which already returns normalized data. */
export function createHttpMarketDataService(options: HttpServiceOptions = {}): MarketDataService {
  const baseUrl = options.baseUrl ?? '';
  const doFetch = options.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  async function get<T>(path: string): Promise<T> {
    let res: Response;
    try {
      res = await doFetch(`${baseUrl}${path}`);
    } catch {
      throw new MarketDataError('NETWORK', 'Cannot reach the market data server');
    }

    if (!res.ok) {
      let code: MarketDataErrorCode = 'UPSTREAM';
      let message = `Market data server error (${res.status})`;
      try {
        const body = (await res.json()) as { error?: { code?: string; message?: string } };
        if (body.error?.code && KNOWN_CODES.includes(body.error.code as MarketDataErrorCode)) {
          code = body.error.code as MarketDataErrorCode;
        }
        if (body.error?.message) message = body.error.message;
      } catch {
        // Non-JSON body (e.g. the dev proxy could not reach the API): keep the generic message.
      }
      throw new MarketDataError(code, message);
    }
    return (await res.json()) as T;
  }

  return {
    async getQuotes(symbols: Ticker[]): Promise<Quote[]> {
      if (symbols.length === 0) return [];
      return get<Quote[]>(`/api/quotes?symbols=${encodeURIComponent(symbols.join(','))}`);
    },
    async getHistory(symbol: Ticker, window: TimeWindow): Promise<PriceSeries> {
      return get<PriceSeries>(
        `/api/history?symbol=${encodeURIComponent(symbol)}&window=${encodeURIComponent(window)}`,
      );
    },
  };
}
