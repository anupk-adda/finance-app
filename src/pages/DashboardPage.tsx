import { useState } from 'react';
import { COMPANIES } from '../config/companies';
import { useMarketData } from '../hooks/useMarketData';
import type { MarketDataService } from '../services/marketDataService';
import type { Ticker, TimeWindow } from '../types/market';
import { SymbolForm } from '../components/layout/SymbolForm';
import { TimeWindowTabs } from '../components/layout/TimeWindowTabs';
import { SelectedCompanyPanel } from '../views/SelectedCompanyPanel';
import { TodayView } from '../views/TodayView';
import { TrendView } from '../views/TrendView';

const symbols = COMPANIES.map((c) => c.symbol);
const NONE: Ticker[] = [];

export function DashboardPage({ service }: { service: MarketDataService }) {
  const [window, setWindow] = useState<TimeWindow>('today');
  const [selectedSymbol, setSelectedSymbol] = useState<Ticker | null>(null);

  const data = useMarketData(service, symbols, window);
  // Separate request for the user's ticker: changing it never resets or refetches the tracked companies.
  const selectedList = selectedSymbol ? [selectedSymbol] : NONE;
  const selectedData = useMarketData(service, selectedList, window);

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
      <SymbolForm
        onSubmit={setSelectedSymbol}
        onClear={() => setSelectedSymbol(null)}
        hasSelection={selectedSymbol !== null}
      />
      {selectedSymbol && (
        <SelectedCompanyPanel
          symbol={selectedSymbol}
          window={window}
          selected={selectedData[selectedSymbol] ?? { status: 'loading' }}
          companies={COMPANIES}
          data={data}
        />
      )}
    </main>
  );
}
