// @vitest-environment node
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import type { YahooGateway } from './yahooClient';

let server: Server | undefined;

async function start(gateway: Partial<YahooGateway>): Promise<string> {
  const full: YahooGateway = {
    quote: async () => [],
    chart: async () => [],
    ...gateway,
  };
  const app = createApp(full);
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  return `http://127.0.0.1:${(server!.address() as AddressInfo).port}`;
}

afterEach(async () => {
  await new Promise((resolve) => (server ? server.close(resolve) : resolve(undefined)));
  server = undefined;
});

describe('GET /api/quotes', () => {
  it('returns normalized quotes and drops entries without a price', async () => {
    const base = await start({
      quote: async (symbols) => [
        { symbol: symbols[0], regularMarketPrice: 100.456, regularMarketChange: 1, regularMarketChangePercent: 1 },
        { symbol: 'NOPRICE' },
      ],
    });
    const res = await fetch(`${base}/api/quotes?symbols=ibm,msft`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ symbol: 'IBM', price: 100.46, change: 1, changePercent: 1 }]);
  });

  it('rejects missing or malformed symbols with 400 and does not call Yahoo', async () => {
    let called = false;
    const base = await start({
      quote: async () => {
        called = true;
        return [];
      },
    });
    for (const q of ['', '?symbols=', '?symbols=IBM,bad%20sym', '?symbols=' + 'A,'.repeat(11) + 'B']) {
      const res = await fetch(`${base}/api/quotes${q}`);
      expect(res.status).toBe(400);
      expect((await res.json()).error.code).toBe('INVALID_SYMBOL');
    }
    expect(called).toBe(false);
  });

  it('maps unexpected Yahoo failures to a 502 UPSTREAM error', async () => {
    const base = await start({
      quote: async () => {
        throw new Error('socket hang up');
      },
    });
    const res = await fetch(`${base}/api/quotes?symbols=IBM`);
    expect(res.status).toBe(502);
    expect((await res.json()).error.code).toBe('UPSTREAM');
  });
});

describe('GET /api/history', () => {
  it('returns a normalized series', async () => {
    const base = await start({
      chart: async () => [
        { date: '2025-01-02T00:00:00Z', close: 2 },
        { date: '2025-01-01T00:00:00Z', close: 1 },
        { date: '2025-01-03T00:00:00Z', close: null },
      ],
    });
    const res = await fetch(`${base}/api/history?symbol=ibm&window=quarter`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      symbol: 'IBM',
      window: 'quarter',
      points: [
        { time: '2025-01-01T00:00:00.000Z', close: 1 },
        { time: '2025-01-02T00:00:00.000Z', close: 2 },
      ],
    });
  });

  it('validates symbol and window', async () => {
    const base = await start({});
    expect((await fetch(`${base}/api/history?window=week`)).status).toBe(400);
    expect((await fetch(`${base}/api/history?symbol=IBM&window=year`)).status).toBe(400);
    expect((await fetch(`${base}/api/history?symbol=IBM`)).status).toBe(400);
  });

  it('returns 404 INVALID_SYMBOL when Yahoo does not know the ticker', async () => {
    const base = await start({
      chart: async () => {
        throw new Error('No data found, symbol may be delisted');
      },
    });
    const res = await fetch(`${base}/api/history?symbol=ZZZZ&window=week`);
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatchObject({ code: 'INVALID_SYMBOL' });
  });

  it('returns 404 NO_DATA when every candle is unusable', async () => {
    const base = await start({ chart: async () => [{ date: '2025-01-01T00:00:00Z', close: null }] });
    const res = await fetch(`${base}/api/history?symbol=IBM&window=week`);
    expect(res.status).toBe(404);
    expect((await res.json()).error.code).toBe('NO_DATA');
  });
});

describe('GET /api/health', () => {
  it('responds ok', async () => {
    const base = await start({});
    expect(await (await fetch(`${base}/api/health`)).json()).toEqual({ ok: true });
  });
});
