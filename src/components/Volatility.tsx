import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { useMemo } from 'react';
import type { VolatilityRow } from '../data/types';
import { Panel } from './Panel';

export const Volatility = ({ rows }: { rows: VolatilityRow[] }) => {
  const sorted = [...rows].sort((a, b) => b.vol - a.vol);

  const options = useMemo<Highcharts.Options>(
    () => ({
      chart: { type: 'bar', backgroundColor: 'transparent' },
      xAxis: {
        categories: sorted.map((r) => r.symbol),
        // Highcharts renders index 0 at the bottom of a horizontal bar chart;
        // reverse the axis so the highest-vol symbol sits at the top.
        reversed: true,
        gridLineWidth: 0,
        lineWidth: 0,
        tickWidth: 0,
        labels: { style: { color: '#b8c9e0', fontSize: '10px', fontWeight: '600' } },
      },
      yAxis: {
        gridLineColor: '#112137',
        labels: {
          formatter() {
            return `${this.value}%`;
          },
          style: { color: '#6b88ad', fontSize: '10px' },
        },
        title: { text: null },
      },
      tooltip: { pointFormat: '<b>{point.y:.1f}%</b> annualised σ' },
      legend: { enabled: false },
      plotOptions: {
        bar: {
          pointPadding: 0.05,
          groupPadding: 0.05,
          borderWidth: 0,
          borderRadius: 2,
          dataLabels: {
            enabled: true,
            color: '#e6f1ff',
            style: { fontSize: '10px', fontWeight: '600', textOutline: 'none' },
            formatter() {
              return `${(this.y as number).toFixed(1)}%`;
            },
          },
        },
      },
      series: [
        {
          type: 'bar',
          name: 'Volatility',
          data: sorted.map((r, i) => ({
            y: r.vol,
            color: {
              linearGradient: { x1: 0, y1: 0, x2: 1, y2: 0 },
              stops: [
                [0, `rgba(42, 212, 255, ${0.85 - i * 0.03})`],
                [1, `rgba(76, 140, 255, ${0.85 - i * 0.03})`],
              ],
            } as unknown as string,
          })),
        },
      ],
    }),
    [sorted],
  );

  return (
    <Panel title="Volatility" actions={<span className="chip">30D</span>} flush>
      <div style={{ height: '100%' }}>
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{ style: { height: '100%', width: '100%' } }}
        />
      </div>
    </Panel>
  );
};
