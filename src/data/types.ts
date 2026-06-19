export interface TickerQuote {
  symbol: string;
  price: number;
  changePct: number;
}

export interface WatchRow {
  symbol: string;
  last: number;
  changePct: number;
  volumePct: number;
}

export interface HoldingRow {
  symbol: string;
  name: string;
  qty: number;
  avgCost: number;
  marketValue: number;
  pnlPct: number;
}

export interface Series {
  name: string;
  data: [number, number][]; // [timestamp, value]
}

export interface AllocationSlice {
  name: string;
  y: number;
  color?: string;
}

export interface KpiTile {
  label: string;
  value: string;
  sub?: string;
  delta?: number; // pct
}

export interface KpiGroup {
  id: string;
  label: string;
  tiles: KpiTile[];
}

export interface NewsItem {
  id: string;
  severity: 'risk' | 'warn' | 'info';
  tag: string;
  title: string;
  body: string;
}

export interface Mover {
  symbol: string;
  name: string;
  changePct: number;
  spark: number[];
}

export interface VolatilityRow {
  symbol: string;
  vol: number; // 0-100
}

export interface CorrelationMatrix {
  symbols: string[];
  values: number[][]; // values[row][col] in -1..1
}

export interface DashboardData {
  tickers: TickerQuote[];
  watchlist: WatchRow[];
  holdings: HoldingRow[];
  portfolioVsBenchmark: { portfolio: Series; benchmark: Series };
  allocation: AllocationSlice[];
  kpiGroups: KpiGroup[];
  correlation: CorrelationMatrix;
  volatility: VolatilityRow[];
  news: NewsItem[];
  movers: Mover[];
  footerTicker: string[];
}

export interface DataSource {
  load(): Promise<DashboardData>;
}
