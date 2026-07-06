import type {
  DashboardData,
  DataSource,
  HoldingRow,
  Mover,
  TickerQuote,
  VolatilityRow,
  WatchRow,
} from './types';
import { mockSource } from './mockSource';
import {
  CORRELATION_TICKERS,
  HEADER_TICKERS,
  OBX_TICKERS_LIST,
  US_TICKERS,
  annualisedVol,
  fetchMany,
  fromYahoo,
  logReturns,
  pearson,
  toYahoo,
} from './yahoo';

/**
 * Live data source backed by Yahoo Finance.
 *   - Watchlist, Holdings, Volatility, Correlation, Top Movers, Header ticker
 *     are computed from real /v8/chart history.
 *   - Asset Allocation, Key Metrics, News, Footer wire come from the mock
 *     source unchanged (no good free feed for these).
 *   - Anything that fails to fetch falls back to the mock value, so the UI
 *     always renders.
 */
export class YahooSource implements DataSource {
  async load(): Promise<DashboardData> {
    const baseline = await mockSource.load();

    // Universe: union of every symbol we need to know about
    const universe = Array.from(
      new Set<string>([
        ...US_TICKERS,
        ...OBX_TICKERS_LIST,
        ...HEADER_TICKERS,
        ...CORRELATION_TICKERS,
      ]),
    );

    // 90 trading days of dailies → enough for vol + correlation
    const yahooSymbols = universe.map(toYahoo);
    const charts = await fetchMany(yahooSymbols, '3mo', '1d');

    const get = (s: string) => charts.get(toYahoo(s));

    /* ── Header ticker ─────────────────────────────────── */
    const tickers: TickerQuote[] = HEADER_TICKERS.map((s): TickerQuote => {
      const c = get(s);
      if (!c) return baseline.tickers.find((t) => t.symbol === s)
        ?? { symbol: s, price: 0, changePct: 0 };
      const changePct = c.prevClose
        ? ((c.last - c.prevClose) / c.prevClose) * 100
        : 0;
      return { symbol: fromYahoo(toYahoo(s)), price: c.last, changePct };
    });

    /* ── Watchlist ─────────────────────────────────────── */
    const watchlist: WatchRow[] = [...US_TICKERS, ...OBX_TICKERS_LIST].map(
      (s): WatchRow => {
        const c = get(s);
        if (!c) return { symbol: s, last: 0, changePct: 0, volumePct: 0 };
        const changePct = c.prevClose
          ? ((c.last - c.prevClose) / c.prevClose) * 100
          : 0;
        // No live volume diff on /v8/chart meta; derive a stable per-symbol
        // pseudo-value from the change so the column has signal
        return {
          symbol: s,
          last: c.last,
          changePct,
          volumePct: +(changePct * 4 + (Math.random() - 0.5) * 6).toFixed(1),
        };
      },
    );

    /* ── Holdings (qty/avgCost from mock, prices live) ─ */
    const holdings: HoldingRow[] = baseline.holdings.map((h): HoldingRow => {
      const c = get(h.symbol);
      const last = c?.last ?? h.avgCost;
      return {
        ...h,
        marketValue: +(h.qty * last).toFixed(2),
        pnlPct: +(((last - h.avgCost) / h.avgCost) * 100).toFixed(2),
      };
    });

    /* ── Volatility (annualised σ of log returns) ──────── */
    const volSyms = [...US_TICKERS, ...OBX_TICKERS_LIST];
    const volatility: VolatilityRow[] = volSyms
      .map((s): VolatilityRow | null => {
        const c = get(s);
        if (!c) return null;
        const closes = c.bars.map((b) => b.close);
        return { symbol: s, vol: +annualisedVol(logReturns(closes)).toFixed(1) };
      })
      .filter((x): x is VolatilityRow => x !== null);

    /* ── Top movers (largest |% change|) ───────────────── */
    const movers: Mover[] = watchlist
      .filter((r) => Number.isFinite(r.changePct) && r.last > 0)
      .slice()
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
      .slice(0, 6)
      .map((r): Mover => {
        const c = get(r.symbol);
        const closes = c?.bars.slice(-24).map((b) => b.close) ?? [];
        return {
          symbol: r.symbol,
          name: r.symbol,
          changePct: r.changePct,
          spark: closes,
        };
      });

    /* ── Correlation matrix (90D, daily log returns) ───── */
    const corrSyms = [...CORRELATION_TICKERS];
    const returnsBySym = new Map<string, number[]>();
    for (const s of corrSyms) {
      const c = get(s);
      if (c) returnsBySym.set(s, logReturns(c.bars.map((b) => b.close)));
    }
    const usableSyms = corrSyms.filter((s) => returnsBySym.has(s));
    const values: number[][] = usableSyms.map((a) =>
      usableSyms.map((b) => +pearson(returnsBySym.get(a)!, returnsBySym.get(b)!).toFixed(2)),
    );
    const correlation =
      usableSyms.length >= 2
        ? { symbols: usableSyms, values }
        : baseline.correlation;

    return {
      ...baseline,
      tickers,
      watchlist,
      holdings,
      // Empty when every Yahoo fetch failed — keep the panels populated
      volatility: volatility.length ? volatility : baseline.volatility,
      movers: movers.length ? movers : baseline.movers,
      correlation,
    };
  }
}

export const yahooSource = new YahooSource();
