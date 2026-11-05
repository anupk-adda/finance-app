import type { MarketDataService } from './marketDataService';
import { createHttpMarketDataService } from './httpMarketDataService';
import { createMockMarketDataService } from './mockMarketDataService';

/**
 * Single place to choose the data source.
 * Default is the Yahoo Finance proxy; set VITE_DATA_SOURCE=mock (npm run dev:mock) for offline demos.
 */
export function createMarketDataService(): MarketDataService {
  return import.meta.env.VITE_DATA_SOURCE === 'mock'
    ? createMockMarketDataService()
    : createHttpMarketDataService();
}

export type { MarketDataService } from './marketDataService';
