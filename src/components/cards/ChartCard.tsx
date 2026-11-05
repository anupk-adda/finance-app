import type { ReactNode } from 'react';
import type { Status } from '../../hooks/useMarketData';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  status: Status;
  error?: string;
  children: ReactNode;
}

/** Reusable card wrapper that owns loading/error presentation for any chart or summary content. */
export function ChartCard({ title, subtitle, status, error, children }: ChartCardProps) {
  return (
    <section className="chart-card" aria-label={title}>
      <header className="chart-card__header">
        <h3>{title}</h3>
        {subtitle && <span className="chart-card__subtitle">{subtitle}</span>}
      </header>
      <div className="chart-card__body">
        {status === 'loading' && <p role="status">Loading…</p>}
        {status === 'error' && <p role="alert">Unable to load data{error ? `: ${error}` : ''}</p>}
        {status === 'success' && children}
      </div>
    </section>
  );
}
