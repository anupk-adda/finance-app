import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// RTL's automatic cleanup is not reliably registered when files share one worker (npm test -- --runInBand),
// which let one file's rendered DOM leak into the next. Register it explicitly.
afterEach(cleanup);

// Recharts' ResponsiveContainer needs layout, which jsdom lacks.
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  const { cloneElement } = await import('react');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      cloneElement(children, { width: 400, height: 180 } as object),
  };
});
