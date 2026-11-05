import express, { type Response } from 'express';
import { isTimeWindow } from '../src/config/timeWindows';
import { normalizeQuote, normalizeSeries } from '../src/domain/normalize';
import { normalizeSymbol } from '../src/domain/symbols';
import type { MarketDataErrorCode } from '../src/services/errors';
import type { YahooGateway } from './yahooClient';

const MAX_SYMBOLS = 10;

function sendError(res: Response, status: number, code: MarketDataErrorCode, message: string) {
  res.status(status).json({ error: { code, message } });
}

/** Yahoo reports unknown tickers as "No data found" / "Not Found"; anything else is an upstream failure. */
function sendUpstreamError(res: Response, err: unknown, symbol?: string) {
  const message = err instanceof Error ? err.message : String(err);
  if (/no data found|not found|delisted/i.test(message)) {
    sendError(res, 404, 'INVALID_SYMBOL', `Unknown or unavailable symbol${symbol ? `: ${symbol}` : ''}`);
  } else {
    console.error('[api] Yahoo request failed:', message);
    sendError(res, 502, 'UPSTREAM', 'Yahoo Finance request failed');
  }
}

export function createApp(gateway: YahooGateway) {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/quotes', async (req, res) => {
    const raw = typeof req.query.symbols === 'string' ? req.query.symbols : '';
    const parsed = raw.split(',').map(normalizeSymbol);
    if (!raw || parsed.length > MAX_SYMBOLS || parsed.some((s) => s === null)) {
      return sendError(res, 400, 'INVALID_SYMBOL', `symbols must be 1-${MAX_SYMBOLS} valid, comma-separated tickers`);
    }
    const symbols = [...new Set(parsed as string[])];

    try {
      const quotes = (await gateway.quote(symbols)).flatMap((q) => normalizeQuote(q) ?? []);
      res.json(quotes);
    } catch (err) {
      sendUpstreamError(res, err);
    }
  });

  app.get('/api/history', async (req, res) => {
    const symbol = typeof req.query.symbol === 'string' ? normalizeSymbol(req.query.symbol) : null;
    if (!symbol) return sendError(res, 400, 'INVALID_SYMBOL', 'symbol must be a valid ticker');
    const window = req.query.window;
    if (!isTimeWindow(window)) return sendError(res, 400, 'NO_DATA', 'window must be today, week or quarter');

    try {
      const series = normalizeSeries(symbol, window, await gateway.chart(symbol, window));
      if (series.points.length === 0) return sendError(res, 404, 'NO_DATA', `No price data for ${symbol}`);
      res.json(series);
    } catch (err) {
      sendUpstreamError(res, err, symbol);
    }
  });

  return app;
}
