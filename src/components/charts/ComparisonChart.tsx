import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ChartRow, TimeWindow } from '../../types/market';

const COLORS = ['#6929c4', '#1192e8', '#005d5d', '#9f1853', '#fa4d56'];
const PRIMARY_COLOR = '#0f62fe';

interface ComparisonChartProps {
  rows: ChartRow[];
  symbols: string[];
  primarySymbol?: string;
  window: TimeWindow;
}

function formatTick(time: string, window: TimeWindow): string {
  const d = new Date(time);
  if (window === 'quarter') return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  // The week view has many points per day, so a day-only label would repeat. Show weekday + 24h time.
  const day = d.toLocaleDateString(undefined, { weekday: 'short' });
  const hm = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${hm}`;
}

/** Multi-ticker line chart of % change from the start of the window. Presentational only. */
export function ComparisonChart({ rows, symbols, primarySymbol, window }: ComparisonChartProps) {
  if (rows.length === 0 || symbols.length === 0) return <p>No data available</p>;
  let other = 0;
  return (
    <div style={{ width: '100%', height: 320 }} data-testid="comparison-chart">
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="time" tickFormatter={(t: string) => formatTick(t, window)} minTickGap={40} />
          <YAxis tickFormatter={(v: number) => `${v}%`} width={56} />
          <ReferenceLine y={0} stroke="#8d8d8d" />
          <Tooltip
            labelFormatter={(t: string) => new Date(t).toLocaleString()}
            formatter={(v: number, name: string) => [`${v.toFixed(2)}%`, name]}
          />
          <Legend />
          {symbols.map((symbol) => {
            const isPrimary = symbol === primarySymbol;
            return (
              <Line
                key={symbol}
                type="monotone"
                dataKey={symbol}
                stroke={isPrimary ? PRIMARY_COLOR : COLORS[other++ % COLORS.length]}
                strokeWidth={isPrimary ? 3 : 1.5}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
