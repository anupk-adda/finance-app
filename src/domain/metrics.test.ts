import { describe, expect, it } from 'vitest';
import { buildRelativeRows, percentChange, rankSummaries, summarizeSeries } from './metrics';
import type { PriceSeries } from '../types/market';

const series = (symbol: string, closes: number[], start = '2025-01-01'): PriceSeries => ({
  symbol,
  window: 'quarter',
  points: closes.map((close, i) => ({
    time: new Date(Date.parse(`${start}T00:00:00Z`) + i * 86_400_000).toISOString(),
    close,
  })),
});

describe('percentChange', () => {
  it('computes percent move and guards against a zero base', () => {
    expect(percentChange(100, 110)).toBe(10);
    expect(percentChange(200, 150)).toBe(-25);
    expect(percentChange(0, 5)).toBe(0);
  });
});

describe('summarizeSeries', () => {
  it('returns first/last/high/low and percent change', () => {
    expect(summarizeSeries(series('IBM', [100, 120, 90, 110]))).toEqual({
      symbol: 'IBM',
      first: 100,
      last: 110,
      high: 120,
      low: 90,
      changePercent: 10,
    });
  });

  it('returns null when there are fewer than two points', () => {
    expect(summarizeSeries(series('IBM', []))).toBeNull();
    expect(summarizeSeries(series('IBM', [100]))).toBeNull();
  });
});

describe('rankSummaries', () => {
  it('ranks best performer first and breaks ties alphabetically', () => {
    const s = (symbol: string, changePercent: number) => ({
      symbol,
      first: 1,
      last: 1,
      high: 1,
      low: 1,
      changePercent,
    });
    const ranked = rankSummaries([s('ORCL', 1), s('IBM', 5), s('CRM', 1), s('MSFT', -2)]);
    expect(ranked.map((r) => [r.rank, r.symbol])).toEqual([
      [1, 'IBM'],
      [2, 'CRM'],
      [3, 'ORCL'],
      [4, 'MSFT'],
    ]);
  });
});

describe('buildRelativeRows', () => {
  it('rebases each series to % change from its own first point and aligns by day', () => {
    const rows = buildRelativeRows(
      [series('IBM', [100, 110, 121]), series('MSFT', [200, 190, 180])],
      'quarter',
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ IBM: 0, MSFT: 0 });
    expect(rows[1]).toMatchObject({ IBM: 10, MSFT: -5 });
    expect(rows[2]).toMatchObject({ IBM: 21, MSFT: -10 });
  });

  it('merges slightly different timestamps in the same hour for the week window', () => {
    const a: PriceSeries = {
      symbol: 'IBM',
      window: 'week',
      points: [{ time: '2025-01-01T14:30:00.000Z', close: 100 }],
    };
    const b: PriceSeries = {
      symbol: 'MSFT',
      window: 'week',
      points: [{ time: '2025-01-01T14:31:07.000Z', close: 50 }],
    };
    expect(buildRelativeRows([a, b], 'week')).toHaveLength(1);
  });

  it('leaves gaps for tickers without a point in a bucket and skips empty series', () => {
    const rows = buildRelativeRows(
      [series('IBM', [100, 110]), series('MSFT', [50], '2025-01-02'), series('SAP', [])],
      'quarter',
    );
    expect(rows).toHaveLength(2);
    expect(rows[0].MSFT).toBeUndefined();
    expect(rows[1].MSFT).toBe(0);
    expect(rows.every((r) => !('SAP' in r))).toBe(true);
  });

  it('returns no rows when nothing has data', () => {
    expect(buildRelativeRows([], 'week')).toEqual([]);
  });
});
