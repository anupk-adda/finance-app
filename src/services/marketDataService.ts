import type { PriceSeries, Quote, Ticker, TimeWindow } from '../types/market';

/** The only contract the UI depends on. Swap implementations without touching components. */
export interface MarketDataService {
  getQuotes(symbols: Ticker[]): Promise<Quote[]>;
  getHistory(symbol: Ticker, window: TimeWindow): Promise<PriceSeries>;
}
