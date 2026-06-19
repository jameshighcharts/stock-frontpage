/**
 * Synthetic OHLCV candle generator. Returns a deterministic-ish history
 * plus a `next()` function that advances by one bar starting from "now".
 *
 * Replace with a real feed (websocket, polling) by implementing the same
 * shape:  history(): {ohlc, volume}  +  next(prev): {ohlc, volume}
 */

export type Ohlc = [number, number, number, number, number]; // [t, o, h, l, c]
export interface VolPoint { x: number; y: number; color: string }

export interface CandleBatch {
  ohlc: Ohlc[];
  volume: VolPoint[];
}

const UP = 'rgba(20,227,154,0.7)';
const DOWN = 'rgba(255,77,109,0.7)';
export const volColor = (o: number, c: number) => (c >= o ? UP : DOWN);

const BAR_MS = 60_000; // 1-minute bars

/* Mean-reverting random walk parameters — keeps price in a sensible band
 * over hundreds of thousands of bars without exploding or collapsing. */
const MEAN_PRICE = 184.5;     // long-run anchor
const REVERSION = 0.0008;     // pull toward MEAN per bar (0..1)
const VOLATILITY = 0.18;      // typical per-bar drift magnitude

const seedRandom = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

/**
 * Mean-reverting OHLCV walk. Generates `bars` bars ending at the current
 * 15-second boundary. Price drifts back toward MEAN_PRICE so a 200k-bar
 * history stays within a believable range.
 */
export const generateHistory = (
  bars = 500_000,
  startPrice = MEAN_PRICE,
  seed = 42,
): CandleBatch => {
  const rand = seedRandom(seed);
  const now = Date.now();
  const end = now - (now % BAR_MS);
  const ohlc: Ohlc[] = new Array(bars);
  const volume: VolPoint[] = new Array(bars);
  let close = startPrice;
  for (let i = 0; i < bars; i++) {
    const t = end - (bars - 1 - i) * BAR_MS;
    const open = close;
    // Mean-reversion + symmetric noise
    const reversion = (MEAN_PRICE - open) * REVERSION;
    const drift = reversion + (rand() - 0.5) * VOLATILITY;
    const range = VOLATILITY * (0.6 + rand() * 1.4);
    const high = open + Math.max(drift, 0) + range / 2;
    const low = open + Math.min(drift, 0) - range / 2;
    close = +(open + drift).toFixed(2);
    ohlc[i] = [t, +open.toFixed(2), +high.toFixed(2), +low.toFixed(2), close];
    volume[i] = {
      x: t,
      y: Math.round(20_000 + rand() * 80_000),
      color: volColor(open, close),
    };
  }
  return { ohlc, volume };
};

/**
 * Produce the next bar after `prev`. Time advances by one bar; price
 * walks from the previous close.
 */
export const nextBar = (prev: Ohlc): { ohlc: Ohlc; volume: VolPoint } => {
  const t = prev[0] + BAR_MS;
  const open = prev[4];
  const reversion = (MEAN_PRICE - open) * REVERSION;
  const drift = reversion + (Math.random() - 0.5) * VOLATILITY;
  const range = VOLATILITY * (0.6 + Math.random() * 1.4);
  const high = open + Math.max(drift, 0) + range / 2;
  const low = open + Math.min(drift, 0) - range / 2;
  const close = +(open + drift).toFixed(2);
  return {
    ohlc: [t, +open.toFixed(2), +high.toFixed(2), +low.toFixed(2), close],
    volume: {
      x: t,
      y: Math.round(20_000 + Math.random() * 80_000),
      color: volColor(open, close),
    },
  };
};

/**
 * Update the in-progress (last) bar with a new tick — high/low extend,
 * close moves toward a new value (small step, scaled to bar volatility).
 */
export const tickLastBar = (last: Ohlc): Ohlc => {
  const open = last[1];
  const step = (Math.random() - 0.5) * (VOLATILITY * 0.5);
  const close = +(last[4] + step).toFixed(2);
  const high = Math.max(last[2], close);
  const low = Math.min(last[3], close);
  return [last[0], open, +high.toFixed(2), +low.toFixed(2), close];
};

export const BAR_INTERVAL_MS = BAR_MS;
