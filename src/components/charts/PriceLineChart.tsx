import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PricePoint } from '../../types/market';

interface PriceLineChartProps {
  points: PricePoint[];
  color?: string;
}

/** Presentational only: receives data via props and knows nothing about services. */
export function PriceLineChart({ points, color = '#0f62fe' }: PriceLineChartProps) {
  if (points.length === 0) return <p>No data available</p>;
  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer>
        <LineChart data={points}>
          <XAxis dataKey="time" hide />
          <YAxis domain={['auto', 'auto']} width={48} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="close"
            stroke={color}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
