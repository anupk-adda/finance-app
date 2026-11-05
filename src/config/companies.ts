import { SYMBOL_PATTERN } from '../domain/symbols';
import type { Company } from '../types/market';

export const MAX_COMPETITORS = 4;

/** Fails fast on a bad company list (called at module load, covered by tests). */
export function validateCompanies(list: Company[]): Company[] {
  if (list.filter((c) => c.isPrimary).length !== 1) {
    throw new Error('Exactly one primary company is required');
  }
  if (list.length - 1 > MAX_COMPETITORS) {
    throw new Error(`At most ${MAX_COMPETITORS} competitors are supported`);
  }
  const seen = new Set<string>();
  for (const c of list) {
    if (!SYMBOL_PATTERN.test(c.symbol)) throw new Error(`Invalid ticker symbol: ${c.symbol}`);
    if (seen.has(c.symbol)) throw new Error(`Duplicate ticker symbol: ${c.symbol}`);
    seen.add(c.symbol);
  }
  return list;
}

/** IBM plus up to four competitors. Adding a company is a config change only. */
export const COMPANIES: Company[] = validateCompanies([
  { symbol: 'IBM', name: 'IBM', isPrimary: true },
  { symbol: 'MSFT', name: 'Microsoft' },
  { symbol: 'ORCL', name: 'Oracle' },
  { symbol: 'SAP', name: 'SAP' },
  { symbol: 'CRM', name: 'Salesforce' },
]);

export function companyLabel(c: Company): string {
  return c.name === c.symbol ? c.symbol : `${c.name} (${c.symbol})`;
}
