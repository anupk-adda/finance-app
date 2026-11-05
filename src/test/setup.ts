import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
