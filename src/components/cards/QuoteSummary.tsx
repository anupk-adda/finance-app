import type { Quote } from '../../types/market';

export function QuoteSummary({ quote }: { quote?: Quote }) {
  if (!quote) return <p>Quote unavailable</p>;
  const sign = quote.change >= 0 ? '+' : '';
  return (
    <p className="quote-summary">
      <strong>{quote.price.toFixed(2)}</strong>{' '}
      <span className={quote.change >= 0 ? 'up' : 'down'}>
        {sign}
        {quote.change.toFixed(2)} ({sign}
        {quote.changePercent.toFixed(2)}%)
      </span>
    </p>
  );
}
