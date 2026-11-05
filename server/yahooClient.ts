import YahooFinance from 'yahoo-finance2';
import { WINDOW_QUERY } from '../src/config/timeWindows';
import type { RawChartPoint, RawQuote } from '../src/domain/normalize';
import type { TimeWindow } from '../src/types/market';

/** The only part of the server that knows about Yahoo. Tests replace it with a fake. */
export interface YahooGateway {
  quote(symbols: string[]): Promise<RawQuote[]>;
  chart(symbol: string, window: TimeWindow): Promise<RawChartPoint[]>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function createYahooGateway(): YahooGateway {
  const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

  return {
    async quote(symbols) {
      // Yahoo's quote type is a union of equity/ECN/option shapes; RawQuote is the equity subset we read.
      return (await yahoo.quote(symbols)) as RawQuote[];
    },
    async chart(symbol, window) {
      const { lookbackDays, interval } = WINDOW_QUERY[window];
      const result = await yahoo.chart(symbol, {
        period1: new Date(Date.now() - lookbackDays * DAY_MS),
        interval,
      });
      return result.quotes;
    },
  };
}
