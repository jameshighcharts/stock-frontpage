import type { TickerQuote } from '../data/types';
import { useEffect, useState } from 'react';

const fmt = (n: number) =>
  n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n.toFixed(2);

interface Props {
  tickers: TickerQuote[];
  tableMode: 'html' | 'grid';
  onToggleTableMode: () => void;
}

export const Header = ({ tickers, tableMode, onToggleTableMode }: Props) => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString('en-US', { hour12: false });
  const date = now.toLocaleDateString('en-GB');

  return (
    <header className="header">
      <div className="brand">
        <div className="mark">F</div>
        <div>
          <span className="name">FINANCE</span>
          <span className="sub">DASHBOARD</span>
        </div>
      </div>

      <div className="ticker">
        <div className="ticker-track">
          {[...tickers, ...tickers].map((t, i) => (
            <div key={`${t.symbol}-${i}`} className="item">
              <span className="sym">{t.symbol}</span>
              <span className="px">{fmt(t.price)}</span>
              <span className={`chg ${t.changePct >= 0 ? 'pos' : 'neg'}`}>
                {t.changePct >= 0 ? '+' : ''}
                {t.changePct.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="live">
        <button
          className="toggle"
          onClick={onToggleTableMode}
          title="Toggle table renderer"
        >
          <span className={tableMode === 'html' ? 'on' : ''}>HTML</span>
          <span className={tableMode === 'grid' ? 'on' : ''}>GRID</span>
        </button>
        <div className="dot" />
        <span className="label">LIVE</span>
        <span className="time">
          {date} {time}
        </span>
        <span className="market">MARKET OPEN</span>
      </div>
    </header>
  );
};
