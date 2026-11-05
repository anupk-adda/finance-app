import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { COMPANIES, companyLabel } from '../config/companies';
import { createMockMarketDataService } from '../services/mockMarketDataService';
import type { MarketDataService } from '../services/marketDataService';
import { DashboardPage } from './DashboardPage';

const PRICE = /^\d+\.\d{2}$/;

describe('DashboardPage', () => {
  it('renders the today summary with a card per company', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);

    for (const c of COMPANIES) {
      expect(await screen.findByRole('region', { name: companyLabel(c) })).toBeInTheDocument();
    }
    expect(await screen.findAllByText(PRICE)).toHaveLength(COMPANIES.length);
    expect(screen.getByRole('tab', { name: 'Today' })).toHaveAttribute('aria-selected', 'true');
  });

  it('shows the 7-day comparison chart and a ranking of all companies', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));

    expect(await screen.findByTestId('comparison-chart')).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Performance ranking' });
    expect(within(table).getAllByRole('row')).toHaveLength(COMPANIES.length + 1);
    for (const c of COMPANIES) expect(within(table).getByText(c.symbol)).toBeInTheDocument();
  });

  it('shows the quarter comparison view', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));

    expect(screen.getByRole('tab', { name: 'Last quarter' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByRole('region', { name: /Last quarter/ })).toBeInTheDocument();
    expect(await screen.findByTestId('comparison-chart')).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Performance ranking' })).toBeInTheDocument();
  });

  it('keeps other cards working when one company fails (today view)', async () => {
    const base = createMockMarketDataService();
    const service: MarketDataService = {
      ...base,
      getHistory: (symbol, window) =>
        symbol === 'ORCL' ? Promise.reject(new Error('boom')) : base.getHistory(symbol, window),
    };
    render(<DashboardPage service={service} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('boom');
    expect(await screen.findAllByText(PRICE)).toHaveLength(COMPANIES.length - 1);
  });

  it('warns about failed tickers but still ranks the rest (trend view)', async () => {
    const base = createMockMarketDataService();
    const service: MarketDataService = {
      ...base,
      getHistory: (symbol, window) =>
        symbol === 'SAP' ? Promise.reject(new Error('nope')) : base.getHistory(symbol, window),
    };
    render(<DashboardPage service={service} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Last 7 days' }));

    expect(await screen.findByText(/Could not load: SAP/)).toBeInTheDocument();
    const table = await screen.findByRole('table', { name: 'Performance ranking' });
    expect(within(table).getAllByRole('row')).toHaveLength(COMPANIES.length); // header + 4
    expect(within(table).queryByText('SAP')).not.toBeInTheDocument();
  });

  it('shows an error card when every ticker fails in the trend view', async () => {
    const service: MarketDataService = {
      getQuotes: () => Promise.reject(new Error('down')),
      getHistory: () => Promise.reject(new Error('down')),
    };
    render(<DashboardPage service={service} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Last quarter' }));

    expect(await screen.findByText(/No ticker could be loaded/)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
