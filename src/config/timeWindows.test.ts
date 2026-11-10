import { describe, expect, it } from 'vitest';
import { TIME_WINDOWS, WINDOW_QUERY, chartOptions, isTimeWindow } from './timeWindows';

describe('chartOptions', () => {
  const now = Date.parse('2026-11-06T00:00:00Z');

  it('requests regular-session candles only, for every window', () => {
    for (const { id } of TIME_WINDOWS) expect(chartOptions(id, now).includePrePost).toBe(false);
  });

  it('looks back and uses the interval configured for each window', () => {
    for (const { id } of TIME_WINDOWS) {
      const o = chartOptions(id, now);
      expect(o.interval).toBe(WINDOW_QUERY[id].interval);
      expect(now - o.period1.getTime()).toBe(WINDOW_QUERY[id].lookbackDays * 86_400_000);
    }
  });
});

describe('isTimeWindow', () => {
  it('accepts only known windows', () => {
    expect(isTimeWindow('week')).toBe(true);
    expect(isTimeWindow('year')).toBe(false);
    expect(isTimeWindow(undefined)).toBe(false);
  });
});
