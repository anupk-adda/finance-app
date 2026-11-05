import type { Ticker } from '../types/market';

/** Letters/digits plus `.` and `-` (e.g. BRK-B, BF.B). Upper case, max 10 chars. */
export const SYMBOL_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;

/** Trim + upper-case user/query input; returns null when it is not a valid ticker. */
export function normalizeSymbol(input: string): Ticker | null {
  const symbol = input.trim().toUpperCase();
  return SYMBOL_PATTERN.test(symbol) ? symbol : null;
}
