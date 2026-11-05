import { describe, expect, it } from 'vitest';
import { COMPANIES, MAX_COMPETITORS, companyLabel, validateCompanies } from './companies';
import { normalizeSymbol } from '../domain/symbols';

describe('COMPANIES config', () => {
  it('has IBM as the single primary plus at most four competitors', () => {
    expect(COMPANIES.filter((c) => c.isPrimary).map((c) => c.symbol)).toEqual(['IBM']);
    expect(COMPANIES.length - 1).toBeLessThanOrEqual(MAX_COMPETITORS);
  });

  it('rejects invalid lists', () => {
    const ibm = { symbol: 'IBM', name: 'IBM', isPrimary: true };
    expect(() => validateCompanies([{ symbol: 'MSFT', name: 'Microsoft' }])).toThrow(/primary/);
    expect(() => validateCompanies([ibm, { ...ibm, isPrimary: false }])).toThrow(/Duplicate/);
    expect(() => validateCompanies([ibm, { symbol: 'bad sym', name: 'x' }])).toThrow(/Invalid ticker/);
    const five = ['A', 'B', 'C', 'D', 'E'].map((symbol) => ({ symbol, name: symbol }));
    expect(() => validateCompanies([ibm, ...five])).toThrow(/At most 4/);
  });

  it('builds readable labels', () => {
    expect(companyLabel({ symbol: 'IBM', name: 'IBM' })).toBe('IBM');
    expect(companyLabel({ symbol: 'MSFT', name: 'Microsoft' })).toBe('Microsoft (MSFT)');
  });
});

describe('normalizeSymbol', () => {
  it('trims and upper-cases valid tickers', () => {
    expect(normalizeSymbol(' ibm ')).toBe('IBM');
    expect(normalizeSymbol('brk-b')).toBe('BRK-B');
  });

  it('rejects empty, malformed or oversized input', () => {
    for (const bad of ['', '  ', '1IBM', 'IBM;DROP', 'A B', 'ABCDEFGHIJK', '../x']) {
      expect(normalizeSymbol(bad)).toBeNull();
    }
  });
});
