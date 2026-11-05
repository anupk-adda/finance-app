import { useMemo } from 'react';
import { buildRelativeRows, rankSummaries, summarizeSeries } from '../domain/metrics';
import type { TickerState } from '../hooks/useMarketData';
import type { Company, PriceSeries, TimeWindow } from '../types/market';
import { ChartCard } from '../components/cards/ChartCard';
import { RankingTable } from '../components/cards/RankingTable';
import { ComparisonChart } from '../components/charts/ComparisonChart';

interface TrendViewProps {
  window: Exclude<TimeWindow, 'today'>;
  companies: Company[];
  data: Record<string, TickerState>;
}

const TITLES = {
  week: 'Last 7 days: relative performance',
  quarter: 'Last quarter: relative performance',
} as const;

/** Shared by the 7-day and quarter views: % change comparison chart plus a ranking table. */
export function TrendView({ window, companies, data }: TrendViewProps) {
  const primary = companies.find((c) => c.isPrimary)?.symbol;

  const states = companies.map((c) => ({ company: c, state: data[c.symbol] ?? { status: 'loading' as const } }));
  const loading = states.some((s) => s.state.status === 'loading');
  const failed = states.filter((s) => s.state.status === 'error');
  const series = states.flatMap((s) => (s.state.series ? [s.state.series] : [])) as PriceSeries[];

  const { rows, ranking, symbols } = useMemo(() => {
    const summaries = series.flatMap((s) => summarizeSeries(s) ?? []);
    return {
      rows: buildRelativeRows(series, window),
      ranking: rankSummaries(summaries),
      symbols: series.filter((s) => s.points.length > 0).map((s) => s.symbol),
    };
    // `series` is rebuilt every render; its contents only change when `data` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, window]);

  const status = loading ? 'loading' : series.length === 0 ? 'error' : 'success';

  return (
    <div className="trend">
      <ChartCard
        title={TITLES[window]}
        subtitle="% change since start of period"
        status={status}
        error="No ticker could be loaded"
      >
        <ComparisonChart rows={rows} symbols={symbols} primarySymbol={primary} window={window} />
        {failed.length > 0 && (
          <p role="alert" className="trend__warning">
            Could not load: {failed.map((f) => f.company.symbol).join(', ')}
          </p>
        )}
      </ChartCard>
      {status === 'success' && (
        <ChartCard title="Ranking" subtitle="Best performer first" status="success">
          <RankingTable rows={ranking} primarySymbol={primary} />
        </ChartCard>
      )}
    </div>
  );
}
