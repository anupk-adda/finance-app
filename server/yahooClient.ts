import YahooFinance from 'yahoo-finance2';
import { chartOptions } from '../src/config/timeWindows';
import type { RawChartPoint, RawQuote } from '../src/domain/normalize';
import type { TimeWindow } from '../src/types/market';

/** The only part of the server that knows about Yahoo. Tests replace it with a fake. */
export interface YahooGateway {
  quote(symbols: string[]): Promise<RawQuote[]>;
  chart(symbol: string, window: TimeWindow): Promise<RawChartPoint[]>;
}

export function createYahooGateway(): YahooGateway {
  const yahoo = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

  return {
    async quote(symbols) {
      // Yahoo's quote type is a union of equity/ECN/option shapes; RawQuote is the equity subset we read.
      return (await yahoo.quote(symbols)) as RawQuote[];
    },
    async chart(symbol, window) {
      const result = await yahoo.chart(symbol, chartOptions(window));
      return result.quotes;
    },
  };
}
