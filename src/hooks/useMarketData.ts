import { useEffect, useState } from 'react';
import { MarketDataError, type MarketDataErrorCode } from '../services/errors';
import type { MarketDataService } from '../services/marketDataService';
import type { PriceSeries, Quote, Ticker, TimeWindow } from '../types/market';

export type Status = 'loading' | 'success' | 'error';

export interface TickerState {
  status: Status;
  quote?: Quote;
  series?: PriceSeries;
  error?: string;
  /** Set when the failure came from the data service, so the UI can tell "unknown ticker" from "network down". */
  errorCode?: MarketDataErrorCode;
}

/**
 * Loads quote + history for each ticker independently, so one failing ticker
 * does not blank the rest of the dashboard.
 */
export function useMarketData(
  service: MarketDataService,
  symbols: Ticker[],
  window: TimeWindow,
): Record<Ticker, TickerState> {
  const key = symbols.join(',');
  const [state, setState] = useState<Record<Ticker, TickerState>>({});

  useEffect(() => {
    let cancelled = false;
    const list = key ? key.split(',') : [];
    setState(Object.fromEntries(list.map((s) => [s, { status: 'loading' } as TickerState])));

    const quotesPromise = service.getQuotes(list).catch(() => [] as Quote[]);

    list.forEach(async (symbol) => {
      try {
        const [quotes, series] = await Promise.all([quotesPromise, service.getHistory(symbol, window)]);
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          [symbol]: { status: 'success', quote: quotes.find((q) => q.symbol === symbol), series },
        }));
      } catch (e) {
        if (cancelled) return;
        const error = e instanceof Error ? e.message : 'Failed to load data';
        const errorCode = e instanceof MarketDataError ? e.code : undefined;
        setState((prev) => ({ ...prev, [symbol]: { status: 'error', error, errorCode } }));
      }
    });

    return () => {
      cancelled = true;
    };
  }, [service, key, window]);

  return state;
}
