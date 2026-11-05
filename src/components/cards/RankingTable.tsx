import type { RankedSummary } from '../../types/market';

interface RankingTableProps {
  rows: RankedSummary[];
  primarySymbol?: string;
}

/** Performance ranking for the selected window. Presentational only. */
export function RankingTable({ rows, primarySymbol }: RankingTableProps) {
  if (rows.length === 0) return <p>Not enough data to rank</p>;
  return (
    <table className="ranking" aria-label="Performance ranking">
      <thead>
        <tr>
          <th>#</th>
          <th>Symbol</th>
          <th>Start</th>
          <th>Latest</th>
          <th>High</th>
          <th>Low</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.symbol} className={r.symbol === primarySymbol ? 'ranking__primary' : undefined}>
            <td>{r.rank}</td>
            <td>{r.symbol}</td>
            <td>{r.first.toFixed(2)}</td>
            <td>{r.last.toFixed(2)}</td>
            <td>{r.high.toFixed(2)}</td>
            <td>{r.low.toFixed(2)}</td>
            <td className={r.changePercent >= 0 ? 'up' : 'down'}>
              {r.changePercent >= 0 ? '+' : ''}
              {r.changePercent.toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
