import { TIME_WINDOWS } from '../../config/timeWindows';
import type { TimeWindow } from '../../types/market';

interface TimeWindowTabsProps {
  value: TimeWindow;
  onChange: (w: TimeWindow) => void;
}

export function TimeWindowTabs({ value, onChange }: TimeWindowTabsProps) {
  return (
    <div role="tablist" aria-label="Time window" className="tabs">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w.id}
          role="tab"
          aria-selected={w.id === value}
          className={w.id === value ? 'tab tab--active' : 'tab'}
          onClick={() => onChange(w.id)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
