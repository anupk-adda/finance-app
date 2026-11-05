import { describe, expect, it } from 'vitest';
import { keepLatestDay, normalizeQuote, normalizeSeries } from './normalize';

describe('normalizeQuote', () => {
  it('maps a full Yahoo quote and rounds to 2 decimals', () => {
    expect(
      normalizeQuote({
        symbol: 'ibm',
        regularMarketPrice: 257.8123,
        regularMarketChange: -0.470001,
        regularMarketChangePercent: -0.181974,
      }),
    ).toEqual({ symbol: 'IBM', price: 257.81, change: -0.47, changePercent: -0.18 });
  });

  it('derives change and percent from the previous close when they are missing', () => {
    const q = normalizeQuote({ symbol: 'MSFT', regularMarketPrice: 110, regularMarketPreviousClose: 100 });
    expect(q).toEqual({ symbol: 'MSFT', price: 110, change: 10, changePercent: 10 });
  });

  it('reports zero change when nothing can be derived (partial data still renders)', () => {
    expect(normalizeQuote({ symbol: 'SAP', regularMarketPrice: 50 })).toEqual({
      symbol: 'SAP',
      price: 50,
      change: 0,
      changePercent: 0,
    });
  });

  it('returns null when there is no usable price or symbol', () => {
    expect(normalizeQuote({ symbol: 'X' })).toBeNull();
    expect(normalizeQuote({ symbol: 'X', regularMarketPrice: null })).toBeNull();
    expect(normalizeQuote({ symbol: 'X', regularMarketPrice: NaN })).toBeNull();
    expect(normalizeQuote({ regularMarketPrice: 10 })).toBeNull();
  });
});

describe('normalizeSeries', () => {
  it('drops null/invalid points, sorts by time and de-duplicates timestamps (last wins)', () => {
    const series = normalizeSeries('ibm', 'week', [
      { date: '2025-01-03T00:00:00Z', close: 3 },
      { date: '2025-01-01T00:00:00Z', close: 1 },
      { date: '2025-01-02T00:00:00Z', close: null },
      { date: null, close: 9 },
      { date: 'not a date', close: 7 },
      { date: '2025-01-01T00:00:00Z', close: 1.5 },
    ]);
    expect(series.symbol).toBe('IBM');
    expect(series.window).toBe('week');
    expect(series.points).toEqual([
      { time: '2025-01-01T00:00:00.000Z', close: 1.5 },
      { time: '2025-01-03T00:00:00.000Z', close: 3 },
    ]);
  });

  it('accepts Date objects and epoch numbers', () => {
    const series = normalizeSeries('IBM', 'quarter', [
      { date: new Date('2025-01-01T00:00:00Z'), close: 1 },
      { date: Date.parse('2025-01-02T00:00:00Z'), close: 2 },
    ]);
    expect(series.points.map((p) => p.close)).toEqual([1, 2]);
  });

  it('keeps only the latest trading day for the today window', () => {
    const series = normalizeSeries('IBM', 'today', [
      { date: '2025-01-30T15:00:00Z', close: 1 },
      { date: '2025-01-31T14:30:00Z', close: 2 },
      { date: '2025-01-31T15:00:00Z', close: 3 },
    ]);
    expect(series.points.map((p) => p.close)).toEqual([2, 3]);
  });

  it('returns an empty series for empty input', () => {
    expect(normalizeSeries('IBM', 'week', []).points).toEqual([]);
    expect(keepLatestDay([])).toEqual([]);
  });
});
