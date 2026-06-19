/**
 * Tiny Yahoo Finance client. Goes through a Vite dev proxy mounted at /yahoo
 * (see vite.config.ts) so the browser doesn't hit CORS. We use the
 * /v8/finance/chart endpoint exclusively — it works without auth, returns
 * historical closes, and exposes "meta" with the latest quote.
 */

export interface Bar {
  t: number; // ms
  close: number;
}

export interface ChartResult {
  symbol: string;
  bars: Bar[];
  /** Last close price */
  last: number;
  /** Previous close (Yahoo `chartPreviousClose`) — used for daily change */
  prevClose: number;
}

const ENDPOINT = '/yahoo/v8/finance/chart';

/* localStorage cache so reloads don't burn Yahoo's rate limit.
 * 1h TTL is plenty for daily bars + last-trade prices. */
const CACHE_TTL_MS = 60 * 60 * 1000;
const cacheKey = (s: string, r: string, i: string) => `yh:${s}:${r}:${i}`;

const readCache = (k: string): ChartResult | null => {
  try {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw) as { t: number; v: ChartResult };
    if (Date.now() - t > CACHE_TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
};
const writeCache = (k: string, v: ChartResult) => {
  try {
    localStorage.setItem(k, JSON.stringify({ t: Date.now(), v }));
  } catch {
    /* quota — ignore */
  }
};

export const fetchChart = async (
  symbol: string,
  range = '3mo',
  interval = '1d',
): Promise<ChartResult> => {
  const k = cacheKey(symbol, range, interval);
  const cached = readCache(k);
  if (cached) return cached;

  const url = `${ENDPOINT}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Yahoo ${symbol}: ${r.status}`);
  const j = await r.json();
  const result = j?.chart?.result?.[0];
  if (!result) throw new Error(`Yahoo ${symbol}: empty result`);
  const ts: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
  const bars: Bar[] = [];
  for (let i = 0; i < ts.length; i++) {
    const c = closes[i];
    if (c == null) continue;
    bars.push({ t: ts[i] * 1000, close: c });
  }
  const meta = result.meta ?? {};
  const out: ChartResult = {
    symbol,
    bars,
    last: meta.regularMarketPrice ?? bars.at(-1)?.close ?? NaN,
    prevClose: meta.chartPreviousClose ?? meta.previousClose ?? bars.at(-2)?.close ?? NaN,
  };
  writeCache(k, out);
  return out;
};

/** Throttled batch fetch — small concurrency keeps Yahoo happy. */
export const fetchMany = async (
  symbols: string[],
  range = '3mo',
  interval = '1d',
  concurrency = 4,
): Promise<Map<string, ChartResult>> => {
  const out = new Map<string, ChartResult>();
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < symbols.length) {
      const s = symbols[i++];
      try {
        out.set(s, await fetchChart(s, range, interval));
      } catch {
        /* swallow per-symbol errors so one bad ticker doesn't kill the load */
      }
    }
  });
  await Promise.all(workers);
  return out;
};

/* ── Symbol helpers ─────────────────────────────────────── */

/** Map our internal ticker to Yahoo's symbol format (OBX → .OL). */
export const toYahoo = (s: string): string => {
  // Already qualified
  if (s.includes('.') || s.startsWith('^')) return s;
  // Indices we expose under short codes
  const idx: Record<string, string> = {
    SPX: '^GSPC',
    NDX: '^IXIC',
    DJI: '^DJI',
    BTC: 'BTC-USD',
    OBX: '^OBX',
  };
  if (idx[s]) return idx[s];
  // Heuristic: any all-caps Norwegian shortcode in our universe gets .OL
  if (OBX_TICKERS.has(s)) return `${s}.OL`;
  return s;
};

export const fromYahoo = (s: string): string => {
  const reverse: Record<string, string> = {
    '^GSPC': 'SPX',
    '^IXIC': 'NDX',
    '^DJI': 'DJI',
    'BTC-USD': 'BTC',
    '^OBX': 'OBX',
  };
  if (reverse[s]) return reverse[s];
  return s.replace(/\.OL$/i, '');
};

/* ── Universe ───────────────────────────────────────────── */

export const US_TICKERS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA',
  'JPM', 'V', 'UNH',
] as const;

export const OBX_TICKERS_LIST = [
  'EQNR', 'DNB', 'TEL', 'NHY', 'AKRBP',
  'MOWI', 'YAR', 'ORK', 'KOG', 'STB',
] as const;

export const OBX_TICKERS = new Set<string>(OBX_TICKERS_LIST);

export const HEADER_TICKERS = [
  'AAPL', 'MSFT', 'NVDA', 'TSLA',
  'EQNR', 'DNB', 'MOWI',
  'SPX', 'NDX', 'DJI', 'BTC',
] as const;

export const CORRELATION_TICKERS = [
  // 4 US + 4 OBX
  'AAPL', 'MSFT', 'NVDA', 'JPM',
  'EQNR', 'DNB', 'TEL', 'MOWI',
] as const;

/* ── Math helpers ───────────────────────────────────────── */

export const logReturns = (closes: number[]): number[] => {
  const r: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      r.push(Math.log(closes[i] / closes[i - 1]));
    }
  }
  return r;
};

/** Pearson correlation. Aligns by truncating to the shorter array's tail. */
export const pearson = (a: number[], b: number[]): number => {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  const aa = a.slice(a.length - n);
  const bb = b.slice(b.length - n);
  let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += aa[i]; mb += bb[i]; }
  ma /= n; mb /= n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) {
    const x = aa[i] - ma, y = bb[i] - mb;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  const d = Math.sqrt(da * db);
  return d === 0 ? 0 : num / d;
};

/** Annualised stddev of daily log returns, in percent. */
export const annualisedVol = (returns: number[]): number => {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const v =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(v) * Math.sqrt(252) * 100;
};
