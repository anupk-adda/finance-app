export type MarketDataErrorCode = 'INVALID_SYMBOL' | 'NO_DATA' | 'NETWORK' | 'UPSTREAM';

/** Typed error shared by the proxy responses and the UI so failures can be shown precisely. */
export class MarketDataError extends Error {
  readonly code: MarketDataErrorCode;

  constructor(code: MarketDataErrorCode, message: string) {
    super(message);
    this.name = 'MarketDataError';
    this.code = code;
  }
}
