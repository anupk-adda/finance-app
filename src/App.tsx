import { createMarketDataService } from './services';
import { DashboardPage } from './pages/DashboardPage';

const service = createMarketDataService();

export default function App() {
  return <DashboardPage service={service} />;
}
