import type { DashboardData, DataSource, Series } from './types';

const seedRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const buildSeries = (
  start: number,
  days: number,
  drift: number,
  vol: number,
  seed: number,
): Series['data'] => {
  const rand = seedRandom(seed);
  const out: [number, number][] = [];
  let v = start;
  const today = Date.UTC(2026, 3, 13);
  const dayMs = 86400000;
  for (let i = days; i >= 0; i--) {
    const t = today - i * dayMs;
    v = v * (1 + drift + (rand() - 0.5) * vol);
    out.push([t, +v.toFixed(2)]);
  }
  return out;
};

const sparkline = (seed: number): number[] => {
  const rand = seedRandom(seed);
  const arr: number[] = [];
  let v = 50;
  for (let i = 0; i < 24; i++) {
    v += (rand() - 0.5) * 8;
    arr.push(+v.toFixed(2));
  }
  return arr;
};

export class MockSource implements DataSource {
  async load(): Promise<DashboardData> {
    // Top US + top 10 Oslo Børs (OBX) names
    const watchlistSymbols = [
      // — US —
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
      'JPM', 'V', 'UNH',
      // — OBX (Oslo Børs) —
      'EQNR', 'DNB', 'TEL', 'NHY', 'AKRBP',
      'MOWI', 'YAR', 'ORK', 'KOG', 'STB',
    ];

    const watchlist = watchlistSymbols.map((s, i) => {
      const r = seedRandom(i + 7)();
      const r2 = seedRandom(i + 11)();
      return {
        symbol: s,
        last: +(50 + r * 400).toFixed(2),
        changePct: +((r - 0.5) * 6).toFixed(2),
        volumePct: +((r2 - 0.4) * 30).toFixed(2),
      };
    });

    const holdings = [
      { symbol: 'AAPL', name: 'Apple Inc.', qty: 120, avgCost: 142.30 },
      { symbol: 'MSFT', name: 'Microsoft', qty: 80, avgCost: 298.10 },
      { symbol: 'NVDA', name: 'NVIDIA', qty: 45, avgCost: 410.55 },
      { symbol: 'GOOGL', name: 'Alphabet', qty: 60, avgCost: 132.40 },
      { symbol: 'AMZN', name: 'Amazon', qty: 70, avgCost: 138.20 },
      { symbol: 'META', name: 'Meta', qty: 35, avgCost: 312.80 },
      { symbol: 'JPM', name: 'JPMorgan', qty: 50, avgCost: 152.10 },
      { symbol: 'V', name: 'Visa', qty: 40, avgCost: 235.40 },
    ].map((h, i) => {
      const r = seedRandom(i + 17)();
      const last = h.avgCost * (1 + (r - 0.3) * 0.4);
      return {
        ...h,
        marketValue: +(h.qty * last).toFixed(2),
        pnlPct: +(((last - h.avgCost) / h.avgCost) * 100).toFixed(2),
      };
    });

    return {
      tickers: [
        { symbol: 'AAPL',  price: 184.92, changePct: 1.24 },
        { symbol: 'MSFT',  price: 412.18, changePct: 0.86 },
        { symbol: 'GOOGL', price: 158.34, changePct: -0.42 },
        { symbol: 'AMZN',  price: 188.45, changePct: 2.14 },
        { symbol: 'NVDA',  price: 894.27, changePct: 3.55 },
        { symbol: 'META',  price: 514.62, changePct: -1.08 },
        { symbol: 'TSLA',  price: 217.83, changePct: 4.21 },
        { symbol: 'SPX',   price: 5238.46, changePct: 0.32 },
        { symbol: 'NDX',   price: 18412.91, changePct: 0.58 },
        { symbol: 'DJI',   price: 39542.10, changePct: 0.18 },
        { symbol: 'BTC',   price: 67124.55, changePct: 1.92 },
      ],
      watchlist,
      holdings,
      portfolioVsBenchmark: {
        portfolio: {
          name: 'Portfolio',
          data: buildSeries(100, 180, 0.0028, 0.018, 1),
        },
        benchmark: {
          name: 'S&P 500',
          data: buildSeries(100, 180, 0.0019, 0.014, 2),
        },
      },
      // 50/50 US ⇄ Oslo split, with cash on top
      allocation: [
        { name: 'US Tech / Growth',   y: 18.0, color: '#2ad4ff' },
        { name: 'US Financials',      y: 14.0, color: '#4c8cff' },
        { name: 'US Healthcare',      y: 13.0, color: '#9b6bff' },
        { name: 'Oslo Energy',        y: 22.0, color: '#ffb547' },
        { name: 'Oslo Seafood',       y: 12.0, color: '#1ad6b0' },
        { name: 'Oslo Financials',    y: 11.0, color: '#ff7a90' },
        { name: 'Cash / Other',       y: 10.0, color: '#6b88ad' },
      ],
      kpiGroups: [
        {
          id: 'risk',
          label: 'Risk',
          tiles: [
            { label: 'Sharpe Ratio',     value: '1.86',  sub: 'TTM', delta:  4.2 },
            { label: 'Beta vs S&P 500',  value: '1.12',  sub: '90D', delta: -2.1 },
            { label: 'Alpha',            value: '4.7%',  sub: 'YTD', delta:  6.5 },
            { label: 'Max Drawdown',     value: '-9.4%', sub: '12M', delta: -1.4 },
          ],
        },
        {
          id: 'returns',
          label: 'Returns',
          tiles: [
            { label: '1M Return',  value: '+3.2%',  sub: 'Mar',  delta:  1.8 },
            { label: '3M Return',  value: '+8.4%',  sub: 'QTD',  delta:  2.6 },
            { label: 'YTD Return', value: '+11.6%', sub: '2026', delta:  4.1 },
            { label: '1Y Return',  value: '+18.9%', sub: 'TTM',  delta:  3.4 },
          ],
        },
        {
          id: 'income',
          label: 'Income',
          tiles: [
            { label: 'Dividend Yield', value: '2.14%', sub: 'TTM', delta:  0.3 },
            { label: 'Div Growth',     value: '6.8%',  sub: '5Y',  delta:  1.2 },
            { label: 'Annual Income',  value: '$24.1k', sub: 'Est.', delta:  4.5 },
            { label: 'Payout Ratio',   value: '38%',   sub: 'TTM', delta: -0.8 },
          ],
        },
        {
          id: 'expo',
          label: 'Exposure',
          tiles: [
            { label: 'Gross Exposure',  value: '102%', sub: 'NAV', delta:  0.6 },
            { label: 'Net Exposure',    value: '94%',  sub: 'NAV', delta: -1.2 },
            { label: 'Cash %',          value: '5.9%', sub: 'NAV', delta:  0.4 },
            { label: 'Top 10 Concen.',  value: '46%',  sub: 'NAV', delta:  1.7 },
          ],
        },
        {
          id: 'fund',
          label: 'Fund.',
          tiles: [
            { label: 'P/E (wtd)',      value: '21.4',  sub: 'Fwd', delta: -0.6 },
            { label: 'P/B (wtd)',      value:  '4.2',  sub: 'TTM', delta:  0.1 },
            { label: 'EPS Growth',     value: '12.8%', sub: '1Y',  delta:  2.4 },
            { label: 'ROE (wtd)',      value: '19.6%', sub: 'TTM', delta:  0.9 },
          ],
        },
      ],
      correlation: (() => {
        // 4 US + 4 OBX
        const syms = ['AAPL', 'MSFT', 'NVDA', 'JPM', 'EQNR', 'DNB', 'TEL', 'MOWI'];
        const rand = seedRandom(99);
        const values: number[][] = [];
        for (let i = 0; i < syms.length; i++) {
          const row: number[] = [];
          for (let j = 0; j < syms.length; j++) {
            if (i === j) row.push(1);
            else if (j < i) row.push(values[j][i]);
            else row.push(+((rand() * 1.6 - 0.4)).toFixed(2));
          }
          values.push(row);
        }
        return { symbols: syms, values };
      })(),
      volatility: [
        { symbol: 'TSLA', vol: 62.4 },
        { symbol: 'NVDA', vol: 54.1 },
        { symbol: 'META', vol: 41.8 },
        { symbol: 'AMZN', vol: 38.2 },
        { symbol: 'GOOGL', vol: 32.9 },
        { symbol: 'AAPL', vol: 28.4 },
        { symbol: 'MSFT', vol: 26.7 },
        { symbol: 'AVGO', vol: 24.5 },
        { symbol: 'JPM',  vol: 22.1 },
        { symbol: 'V',    vol: 19.8 },
        { symbol: 'MA',   vol: 18.4 },
        { symbol: 'HD',   vol: 17.2 },
        { symbol: 'UNH',  vol: 15.8 },
        { symbol: 'PG',   vol: 13.4 },
        { symbol: 'JNJ',  vol: 11.9 },
        { symbol: 'XOM',  vol: 10.2 },
      ],
      news: [
        {
          id: '1',
          severity: 'risk',
          tag: 'High Risk',
          title: 'Energy Concentration',
          body: 'Portfolio energy exposure exceeds policy bound at 18.4% vs 12% target. Consider trimming XOM, CVX positions to rebalance sector weights.',
        },
        {
          id: '2',
          severity: 'warn',
          tag: 'Earnings',
          title: 'Upcoming Earnings: NVDA',
          body: 'NVDA reports after close on 2026-04-22. Implied move ±7.4% based on options chain. Position is 12% of NAV.',
        },
        {
          id: '3',
          severity: 'risk',
          tag: 'Liquidity',
          title: 'Reduced Market Depth',
          body: 'Top-of-book liquidity in small-cap holdings down 38% week-over-week. Use VWAP execution for orders > 20% ADV.',
        },
        {
          id: '4',
          severity: 'info',
          tag: 'Macro',
          title: 'Lower Treasury Auction Demand',
          body: 'Yesterday\'s 10Y auction tail of 1.4bps. Watch for spillover into duration-sensitive equity sectors over the session.',
        },
      ],
      movers: [
        { symbol: 'NVDA', name: 'NVIDIA Corp',  changePct:  5.34, spark: sparkline(31) },
        { symbol: 'AMD',  name: 'Adv. Micro',   changePct:  4.18, spark: sparkline(32) },
        { symbol: 'SMCI', name: 'Super Micro',  changePct:  3.62, spark: sparkline(35) },
        { symbol: 'TSLA', name: 'Tesla Inc',    changePct: -3.92, spark: sparkline(33) },
        { symbol: 'BA',   name: 'Boeing Co',    changePct: -2.84, spark: sparkline(34) },
        { symbol: 'INTC', name: 'Intel Corp',   changePct: -2.17, spark: sparkline(36) },
      ],
      footerTicker: [
        'NEWS — Fed minutes signal patient stance on rate cuts as core PCE moderates',
        'EARNINGS — JPMorgan Q1 net income +6% YoY, beats consensus on trading revenue',
        'MACRO — March CPI prints at 3.1% YoY vs 3.2% expected, 10Y yield -4bps',
        'COMMODITIES — WTI crude +1.8% on tighter OPEC+ guidance',
      ],
    };
  }
}

export const mockSource = new MockSource();
