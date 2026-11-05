import { companyLabel } from '../config/companies';
import type { TickerState } from '../hooks/useMarketData';
import type { Company } from '../types/market';
import { ChartCard } from '../components/cards/ChartCard';
import { QuoteSummary } from '../components/cards/QuoteSummary';
import { PriceLineChart } from '../components/charts/PriceLineChart';

interface TodayViewProps {
  companies: Company[];
  data: Record<string, TickerState>;
}

/** Current-day market summary: one card per company with price, day change and intraday chart. */
export function TodayView({ companies, data }: TodayViewProps) {
  return (
    <div className="grid">
      {companies.map((company) => {
        const s = data[company.symbol] ?? { status: 'loading' as const };
        return (
          <ChartCard key={company.symbol} title={companyLabel(company)} status={s.status} error={s.error}>
            <QuoteSummary quote={s.quote} />
            <PriceLineChart
              points={s.series?.points ?? []}
              color={company.isPrimary ? '#0f62fe' : '#6f6f6f'}
            />
          </ChartCard>
        );
      })}
    </div>
  );
}
