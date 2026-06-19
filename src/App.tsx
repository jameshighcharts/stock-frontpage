import { useEffect, useState } from 'react';
import { dataSource, type DashboardData } from './data';
import { applyTerminalTheme } from './charts/theme';
import { Chrome } from './components/Chrome';
import { Header } from './components/Header';
import { Watchlist } from './components/Watchlist';
import { Holdings } from './components/Holdings';
import { PortfolioChart } from './components/PortfolioChart';
import { Allocation } from './components/Allocation';
import { Kpis } from './components/Kpis';
import { Volatility } from './components/Volatility';
import { Correlation } from './components/Correlation';
import { News } from './components/News';
import { Movers } from './components/Movers';
import { FooterTicker } from './components/FooterTicker';

applyTerminalTheme();

const App = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [tableMode, setTableMode] = useState<'html' | 'grid'>('html');

  useEffect(() => {
    dataSource.load().then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="app">
      <Chrome />
      <Header
        tickers={data.tickers}
        tableMode={tableMode}
        onToggleTableMode={() =>
          setTableMode((m) => (m === 'html' ? 'grid' : 'html'))
        }
      />

      <div className="grid">
        <div className="col-left">
          <Watchlist rows={data.watchlist} mode={tableMode} />
          <Holdings rows={data.holdings} mode={tableMode} />
        </div>

        <div className="col-center">
          <PortfolioChart />
          <div className="center-bottom">
            <div className="center-bottom-left">
              <div className="alloc-row">
                <Allocation slices={data.allocation} />
                <Kpis groups={data.kpiGroups} />
              </div>
              <Correlation matrix={data.correlation} />
            </div>
            <Volatility rows={data.volatility} />
          </div>
        </div>

        <div className="col-right">
          <News items={data.news} />
          <Movers rows={data.movers} />
        </div>
      </div>

      <FooterTicker items={data.footerTicker} />
    </div>
  );
};

export default App;
