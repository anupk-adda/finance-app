import { useMemo } from 'react';
import { buildRelativeRows } from '../domain/metrics';
import type { TickerState } from '../hooks/useMarketData';
import type { MarketDataErrorCode } from '../services/errors';
import type { Company, PriceSeries, Ticker, TimeWindow } from '../types/market';
import { ChartCard } from '../components/cards/ChartCard';
import { QuoteSummary } from '../components/cards/QuoteSummary';
import { ComparisonChart } from '../components/charts/ComparisonChart';

interface SelectedCompanyPanelProps {
  symbol: Ticker;
  window: TimeWindow;
  /** State of the selected ticker (its own data request). */
  selected: TickerState;
  /** The tracked companies and their already-loaded state. Read-only: this panel never refetches them. */
  companies: Company[];
  data: Record<string, TickerState>;
}

/** Maps a failed lookup to a message that tells the user what to do. */
export function describeError(symbol: Ticker, code?: MarketDataErrorCode): string {
  if (code === 'INVALID_SYMBOL') return `"${symbol}" was not found. Check the ticker symbol and try again.`;
  if (code === 'NO_DATA') return `No price data is available for "${symbol}" in this period.`;
  return `Could not load "${symbol}". Please try again.`;
}

/**
 * Comparison chart driven by the ticker the user picked: the selected ticker is the emphasised line,
 * plotted against the tracked companies. Tracked companies are only read, never refetched.
 */
export function SelectedCompanyPanel({ symbol, window, selected, companies, data }: SelectedCompanyPanelProps) {
  const tracked = companies.some((c) => c.symbol === symbol);

  const { rows, symbols } = useMemo(() => {
    const trackedSeries = companies.flatMap((c) => data[c.symbol]?.series ?? []);
    const all: PriceSeries[] = selected.series
      ? [...trackedSeries.filter((s) => s.symbol !== symbol), selected.series]
      : [];
    return {
      rows: buildRelativeRows(all, window),
      symbols: all.filter((s) => s.points.length > 0).map((s) => s.symbol),
    };
  }, [companies, data, selected.series, symbol, window]);

  const failed = selected.status === 'error';

  return (
    <ChartCard
      title={`${symbol} compared with tracked companies`}
      subtitle={window === 'today' ? '% change since market open' : '% change since start of period'}
      // The panel renders its own error text, so the card is told "success" to show it.
      status={failed ? 'success' : selected.status}
    >
      {failed ? (
        <p role="alert" className="panel-error">
          {describeError(symbol, selected.errorCode)}
        </p>
      ) : (
        <>
          {tracked && (
            <p className="panel-note" role="note">
              {symbol} is already tracked above; it is highlighted here for comparison.
            </p>
          )}
          <QuoteSummary quote={selected.quote} />
          <ComparisonChart rows={rows} symbols={symbols} primarySymbol={symbol} window={window} />
        </>
      )}
    </ChartCard>
  );
}
