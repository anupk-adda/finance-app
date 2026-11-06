import { describe, expect, it } from 'vitest';
import { MarketDataError } from './errors';
import { MOCK_SYMBOLS, createMockMarketDataService } from './mockMarketDataService';

describe('mock market data service', () => {
  const service = createMockMarketDataService();

  it('returns deterministic history for a known ticker', async () => {
    const a = await service.getHistory('NVDA', 'week');
    const b = await service.getHistory('NVDA', 'week');
    expect(a.points.length).toBeGreaterThan(1);
    expect(a).toEqual(b);
  });

  it('rejects an unknown ticker like Yahoo does (INVALID_SYMBOL)', async () => {
    const err = await service.getHistory('ZZZZNOPE', 'week').catch((e) => e);
    expect(err).toBeInstanceOf(MarketDataError);
    expect(err).toMatchObject({ code: 'INVALID_SYMBOL' });
    expect(err.message).toContain('ZZZZNOPE');
  });

  it('leaves unknown tickers out of quotes', async () => {
    const quotes = await service.getQuotes(['IBM', 'ZZZZNOPE']);
    expect(quotes.map((q) => q.symbol)).toEqual(['IBM']);
  });

  it('knows every tracked company', () => {
    for (const s of ['IBM', 'MSFT', 'ORCL', 'SAP', 'CRM']) expect(MOCK_SYMBOLS).toContain(s);
  });
});
