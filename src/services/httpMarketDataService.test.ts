import { describe, expect, it, vi } from 'vitest';
import { MarketDataError } from './errors';
import { createHttpMarketDataService } from './httpMarketDataService';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }));

describe('createHttpMarketDataService', () => {
  it('requests quotes and history with encoded query params', async () => {
    const fetchFn = vi.fn().mockImplementation(() => json([]));
    const service = createHttpMarketDataService({ baseUrl: 'http://x', fetchFn });

    await service.getQuotes(['IBM', 'MSFT']);
    await service.getHistory('BRK-B', 'week');

    expect(fetchFn).toHaveBeenNthCalledWith(1, 'http://x/api/quotes?symbols=IBM%2CMSFT');
    expect(fetchFn).toHaveBeenNthCalledWith(2, 'http://x/api/history?symbol=BRK-B&window=week');
  });

  it('skips the request for an empty symbol list', async () => {
    const fetchFn = vi.fn();
    expect(await createHttpMarketDataService({ fetchFn }).getQuotes([])).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('maps API error bodies to typed MarketDataError', async () => {
    const fetchFn = vi
      .fn()
      .mockImplementation(() => json({ error: { code: 'INVALID_SYMBOL', message: 'Unknown symbol: ZZZ' } }, 404));
    const service = createHttpMarketDataService({ fetchFn });

    const err = await service.getHistory('ZZZ', 'week').catch((e) => e);
    expect(err).toBeInstanceOf(MarketDataError);
    expect(err).toMatchObject({ code: 'INVALID_SYMBOL', message: 'Unknown symbol: ZZZ' });
  });

  it('falls back to UPSTREAM for non-JSON error responses', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('Bad gateway', { status: 502 }));
    const err = await createHttpMarketDataService({ fetchFn }).getQuotes(['IBM']).catch((e) => e);
    expect(err).toMatchObject({ code: 'UPSTREAM', message: 'Market data server error (502)' });
  });

  it('reports NETWORK when fetch itself fails', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const err = await createHttpMarketDataService({ fetchFn }).getHistory('IBM', 'today').catch((e) => e);
    expect(err).toMatchObject({ code: 'NETWORK' });
  });
});
