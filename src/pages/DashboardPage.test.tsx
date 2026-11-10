import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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

describe('DashboardPage: user-selected company chart', () => {
  const ask = (symbol: string) => {
    fireEvent.change(screen.getByLabelText('Compare another company'), { target: { value: symbol } });
    fireEvent.click(screen.getByRole('button', { name: 'Show chart' }));
  };

  it('shows no selected-company panel and no alerts by default', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);
    await screen.findAllByText(PRICE);
    expect(screen.queryByRole('region', { name: /compared with tracked companies/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('adds a comparison panel for a valid ticker in every time window', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);
    await screen.findAllByText(PRICE);

    ask(' nvda ');
    const panel = await screen.findByRole('region', { name: 'NVDA compared with tracked companies' });
    expect(await within(panel).findByTestId('comparison-chart')).toBeInTheDocument();

    for (const tab of ['Last 7 days', 'Last quarter']) {
      fireEvent.click(screen.getByRole('tab', { name: tab }));
      const p = await screen.findByRole('region', { name: 'NVDA compared with tracked companies' });
      expect(await within(p).findByTestId('comparison-chart')).toBeInTheDocument();
    }
  });

  it('shows a clear message for an unknown ticker and keeps the dashboards', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);
    await screen.findAllByText(PRICE);

    ask('ZZZZNOPE');
    const panel = await screen.findByRole('region', { name: 'ZZZZNOPE compared with tracked companies' });
    expect(await within(panel).findByRole('alert')).toHaveTextContent('"ZZZZNOPE" was not found');
    expect(screen.getAllByText(PRICE)).toHaveLength(COMPANIES.length);
  });

  it('shows a different message when the service is down', async () => {
    const base = createMockMarketDataService();
    const service: MarketDataService = {
      ...base,
      getHistory: (symbol, window) =>
        symbol === 'NVDA' ? Promise.reject(new Error('socket hang up')) : base.getHistory(symbol, window),
    };
    render(<DashboardPage service={service} />);
    await screen.findAllByText(PRICE);

    ask('NVDA');
    expect(await screen.findByText('Could not load "NVDA". Please try again.')).toBeInTheDocument();
  });

  it('rejects malformed input locally without calling the service', async () => {
    const base = createMockMarketDataService();
    const getHistory = vi.fn(base.getHistory);
    render(<DashboardPage service={{ ...base, getHistory }} />);
    await screen.findAllByText(PRICE);
    const callsBefore = getHistory.mock.calls.length;

    ask('bad sym!');
    expect(screen.getByRole('alert')).toHaveTextContent('is not a valid ticker');
    expect(getHistory.mock.calls.length).toBe(callsBefore);
  });

  it('highlights an already-tracked company instead of adding a duplicate card', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);
    await screen.findAllByText(PRICE);

    ask('msft');
    const panel = await screen.findByRole('region', { name: 'MSFT compared with tracked companies' });
    expect(within(panel).getByRole('note')).toHaveTextContent('already tracked');
    expect(screen.getAllByRole('region', { name: companyLabel(COMPANIES[1]) })).toHaveLength(1);
  });

  it('does not refetch or change the existing dashboards when a ticker is selected', async () => {
    const base = createMockMarketDataService();
    const getHistory = vi.fn(base.getHistory);
    render(<DashboardPage service={{ ...base, getHistory }} />);
    await screen.findAllByText(PRICE);

    const before = screen.getAllByText(PRICE).map((n) => n.textContent);
    const trackedCalls = () => getHistory.mock.calls.filter(([s]) => COMPANIES.some((c) => c.symbol === s)).length;
    const callsBefore = trackedCalls();

    ask('NVDA');
    await screen.findByRole('region', { name: 'NVDA compared with tracked companies' });
    await screen.findByTestId('comparison-chart');

    expect(trackedCalls()).toBe(callsBefore);
    expect(getHistory).toHaveBeenCalledWith('NVDA', 'today');
    expect(screen.getAllByText(PRICE).map((n) => n.textContent).slice(0, before.length)).toEqual(before);
    for (const c of COMPANIES) {
      expect(screen.getByRole('region', { name: companyLabel(c) })).toBeInTheDocument();
    }
  });

  it('removes the panel when cleared', async () => {
    render(<DashboardPage service={createMockMarketDataService()} />);
    await screen.findAllByText(PRICE);
    ask('NVDA');
    await screen.findByRole('region', { name: 'NVDA compared with tracked companies' });

    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByRole('region', { name: /compared with tracked companies/ })).not.toBeInTheDocument();
  });
});
