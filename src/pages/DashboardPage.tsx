import { useState } from 'react';
import { COMPANIES } from '../config/companies';
import { useMarketData } from '../hooks/useMarketData';
import type { MarketDataService } from '../services/marketDataService';
import type { TimeWindow } from '../types/market';
import { TimeWindowTabs } from '../components/layout/TimeWindowTabs';
import { TodayView } from '../views/TodayView';
import { TrendView } from '../views/TrendView';

const symbols = COMPANIES.map((c) => c.symbol);

export function DashboardPage({ service }: { service: MarketDataService }) {
  const [window, setWindow] = useState<TimeWindow>('today');
  const data = useMarketData(service, symbols, window);

  return (
    <main className="dashboard">
      <h1>Market Dashboard</h1>
      <p className="dashboard__subtitle">IBM versus its main competitors</p>
      <TimeWindowTabs value={window} onChange={setWindow} />
      {window === 'today' ? (
        <TodayView companies={COMPANIES} data={data} />
      ) : (
        <TrendView window={window} companies={COMPANIES} data={data} />
      )}
    </main>
  );
}
