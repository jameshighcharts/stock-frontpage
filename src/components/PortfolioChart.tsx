import HighchartsReact from 'highcharts-react-official';
import HighchartsStock from 'highcharts/highstock';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  generateHistory,
  nextBar,
  tickLastBar,
  volColor,
  BAR_INTERVAL_MS,
  type Ohlc,
} from '../data/candles';
import { Panel } from './Panel';

const TICK_MS = 40;           // intra-bar tick cadence — 25 ticks/sec
const NEW_BAR_EVERY = 25;     // 40ms × 25 = 1s per bar (accelerated 60× realtime)
const LIVE_WINDOW_BARS = 80;  // ~80 min visible in LIVE mode
const HISTORY_BARS = 500_000; // ~347 days of 1-min bars

type RangeMode = 'live' | '1h' | '4h' | 'all';
type ChartType = 'candle' | 'line';

export const PortfolioChart = () => {
  const chartRef = useRef<HighchartsReact.RefObject>(null);
  const [runId, setRunId] = useState(0);
  const [mode, setMode] = useState<RangeMode>('live');
  const modeRef = useRef<RangeMode>(mode);
  modeRef.current = mode;
  const [chartType, setChartType] = useState<ChartType>('candle');

  const [last, setLast] = useState<{ price: number; changePct: number }>({
    price: 0,
    changePct: 0,
  });

  const initial = useMemo(
    () => generateHistory(HISTORY_BARS, 184.5, 42 + runId),
    [runId],
  );

  /* ── Chart options ───────────────────────────────────── */
  const options = useMemo<Highcharts.Options>(
    () => ({
      chart: {
        backgroundColor: 'transparent',
        animation: false,
        spacing: [4, 4, 4, 4],
      },
      credits: { enabled: false },
      rangeSelector: { enabled: false }, // we render our own React buttons
      navigator: {
        enabled: true,
        height: 36,
        margin: 6,
        maskFill: 'rgba(42, 212, 255, 0.10)',
        outlineColor: '#1b2c45',
        outlineWidth: 1,
        series: {
          type: 'areaspline',
          color: '#2ad4ff',
          fillOpacity: 0.18,
          lineWidth: 1,
        },
        xAxis: {
          gridLineColor: '#0d182a',
          labels: { style: { color: '#43607f', fontSize: '9px' } },
        },
        handles: { backgroundColor: '#11233a', borderColor: '#2ad4ff' },
      },
      scrollbar: { enabled: false },
      tooltip: {
        split: false,
        shared: true,
        backgroundColor: 'rgba(8,18,32,0.96)',
        borderColor: '#1b2c45',
        style: { color: '#e6f1ff' },
        valueDecimals: 2,
      },
      yAxis: [
        {
          labels: { align: 'right', x: -4, style: { color: '#6b88ad', fontSize: '10px' } },
          height: '72%',
          resize: { enabled: false },
          gridLineColor: '#112137',
          gridLineDashStyle: 'Dash',
          startOnTick: false,
          endOnTick: false,
          minPadding: 0.04,
          maxPadding: 0.04,
          crosshair: {
            color: 'rgba(42,212,255,0.35)',
            dashStyle: 'Dash',
            label: {
              enabled: true,
              backgroundColor: '#0f2940',
              style: { color: '#2ad4ff', fontWeight: '600' },
              padding: 4,
              format: '{value:.2f}',
            },
          },
        },
        {
          labels: {
            align: 'right',
            x: -4,
            style: { color: '#43607f', fontSize: '9px' },
            formatter() {
              const v = this.value as number;
              return v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v);
            },
          },
          top: '76%',
          height: '24%',
          offset: 0,
          gridLineColor: '#0d182a',
          startOnTick: false,
          endOnTick: false,
          minPadding: 0,
          maxPadding: 0.05,
        },
      ],
      xAxis: {
        gridLineColor: '#0d182a',
        labels: { style: { color: '#6b88ad', fontSize: '10px' } },
        crosshair: { color: 'rgba(42,212,255,0.25)', dashStyle: 'Dash' },
      },
      plotOptions: {
        candlestick: {
          color: '#ff4d6d',
          upColor: '#14e39a',
          lineColor: '#ff4d6d',
          upLineColor: '#14e39a',
          lineWidth: 1,
          pointPadding: 0.15,
          groupPadding: 0.08,
          dataGrouping: {
            enabled: true,
            forced: false,
            groupPixelWidth: 14,
            units: [
              ['minute', [1, 5, 15, 30]],
              ['hour', [1, 2, 4, 6, 12]],
              ['day', [1, 3, 7]],
              ['week', [1, 2]],
              ['month', [1, 3, 6]],
            ],
          },
        },
        column: {
          borderWidth: 0,
          pointPadding: 0.15,
          groupPadding: 0.08,
          dataGrouping: {
            enabled: true,
            forced: false,
            groupPixelWidth: 14,
            approximation: 'sum',
            units: [
              ['minute', [1, 5, 15, 30]],
              ['hour', [1, 2, 4, 6, 12]],
              ['day', [1, 3, 7]],
              ['week', [1, 2]],
              ['month', [1, 3, 6]],
            ],
          },
        },
        series: { animation: false },
      },
      series: [
        chartType === 'candle'
          ? {
              type: 'candlestick',
              name: 'BLK',
              id: 'price',
              data: initial.ohlc,
              yAxis: 0,
            }
          : {
              type: 'areaspline',
              name: 'BLK',
              id: 'price',
              data: initial.ohlc.map((b) => [b[0], b[4]] as [number, number]),
              yAxis: 0,
              color: '#2ad4ff',
              lineWidth: 2,
              marker: { enabled: false },
              // null threshold = fill from line down to bottom of axis,
              // not down to y=0 (which would force the axis to include 0)
              threshold: null,
              fillColor: {
                linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                stops: [
                  [0, 'rgba(42,212,255,0.45)'],
                  [1, 'rgba(42,212,255,0.02)'],
                ],
              },
            },
        {
          type: 'column',
          name: 'Volume',
          id: 'volume',
          data: initial.volume,
          yAxis: 1,
        },
      ],
    }),
    [initial, chartType],
  );

  /* ── Apply a range mode to the chart ─────────────────── */
  const applyMode = (m: RangeMode) => {
    const chart = chartRef.current?.chart;
    if (!chart) return;
    const xAxis = chart.xAxis[0];
    const dataMax = xAxis.dataMax!;
    const dataMin = xAxis.dataMin!;
    let from = dataMin;
    const HOUR = 3_600_000; // real-time hour in ms
    if (m === 'live') from = dataMax - LIVE_WINDOW_BARS * BAR_INTERVAL_MS;
    else if (m === '1h') from = dataMax - HOUR;
    else if (m === '4h') from = dataMax - 4 * HOUR;
    xAxis.setExtremes(Math.max(from, dataMin), dataMax, true, false);
  };

  const onPickMode = (m: RangeMode) => {
    setMode(m);
    applyMode(m);
  };

  /* ── Live tick loop ──────────────────────────────────── */
  useEffect(() => {
    const chart = chartRef.current?.chart;
    if (!chart) return;

    const priceSeries = chart.get('price') as Highcharts.Series;
    const volSeries = chart.get('volume') as Highcharts.Series;
    // Always carry the full OHLC bars in local state — line view only uses closes
    const bars: Ohlc[] = initial.ohlc.slice();
    const first = bars[0][4];
    setLast({
      price: bars[bars.length - 1][4],
      changePct: ((bars[bars.length - 1][4] - first) / first) * 100,
    });
    applyMode(modeRef.current);

    let tickN = 0;
    const id = window.setInterval(() => {
      tickN++;

      if (tickN % NEW_BAR_EVERY === 0) {
        const nb = nextBar(bars[bars.length - 1]);
        bars.push(nb.ohlc);
        if (chartType === 'candle') {
          priceSeries.addPoint(nb.ohlc, false, false, false);
        } else {
          priceSeries.addPoint([nb.ohlc[0], nb.ohlc[4]], false, false, false);
        }
        volSeries.addPoint(nb.volume, false, false, false);
      } else {
        const updated = tickLastBar(bars[bars.length - 1]);
        bars[bars.length - 1] = updated;
        const cp = priceSeries.points[priceSeries.points.length - 1];
        if (chartType === 'candle') {
          cp?.update(updated, false, false);
        } else {
          cp?.update({ x: updated[0], y: updated[4] }, false, false);
        }
        const vp = volSeries.points[volSeries.points.length - 1];
        vp?.update({ color: volColor(updated[1], updated[4]) }, false, false);
      }

      // In LIVE mode, re-anchor visible window to the newest bar
      if (modeRef.current === 'live') {
        const xAxis = chart.xAxis[0];
        const dataMax = xAxis.dataMax!;
        xAxis.setExtremes(
          dataMax - LIVE_WINDOW_BARS * BAR_INTERVAL_MS,
          dataMax,
          false,
          false,
        );
      }

      chart.redraw(false);
      const close = bars[bars.length - 1][4];
      setLast({ price: close, changePct: ((close - first) / first) * 100 });
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, [runId, chartType, initial]);

  return (
      <Panel
        title="BLK · Live"
        actions={
          <>
            <span
              className="chip"
              style={{
                background:
                  last.changePct >= 0 ? 'rgba(20,227,154,0.12)' : 'rgba(255,77,109,0.12)',
                color: last.changePct >= 0 ? '#14e39a' : '#ff4d6d',
              }}
            >
              {last.price.toFixed(2)}{' '}
              {last.changePct >= 0 ? '+' : ''}
              {last.changePct.toFixed(2)}%
            </span>
            <div className="range-tabs">
              {(['live', '1h', '4h', 'all'] as RangeMode[]).map((m) => (
                <button
                  key={m}
                  className={`range-tab ${mode === m ? 'on' : ''}`}
                  onClick={() => onPickMode(m)}
                >
                  {m === 'live' ? '● LIVE' : m.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="range-tabs">
              {(['candle', 'line'] as ChartType[]).map((t) => (
                <button
                  key={t}
                  className={`range-tab ${chartType === t ? 'on' : ''}`}
                  onClick={() => setChartType(t)}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              className="range-tab"
              onClick={() => setRunId((n) => n + 1)}
              title="Restart stream"
            >
              ↻
            </button>
          </>
        }
        flush
      >
        <div style={{ height: '100%' }}>
          <HighchartsReact
            ref={chartRef}
            highcharts={HighchartsStock}
            constructorType="stockChart"
            options={options}
            containerProps={{ style: { height: '100%', width: '100%' } }}
          />
        </div>
      </Panel>
  );
};
