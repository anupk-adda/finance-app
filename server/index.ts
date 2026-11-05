import { createApp } from './app';
import { createYahooGateway } from './yahooClient';

const port = Number(process.env.PORT ?? 3001);

createApp(createYahooGateway()).listen(port, () => {
  console.log(`[api] Market data proxy listening on http://localhost:${port}`);
});
