import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import HeatmapModule from 'highcharts/modules/heatmap';
import { useMemo } from 'react';

if (typeof (HeatmapModule as unknown) === 'function') {
  (HeatmapModule as unknown as (h: typeof Highcharts) => void)(Highcharts);
}
import type { CorrelationMatrix } from '../data/types';
import { Panel } from './Panel';

export const Correlation = ({ matrix }: { matrix: CorrelationMatrix }) => {
  const data: [number, number, number][] = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let i = 0; i < matrix.symbols.length; i++) {
      for (let j = 0; j < matrix.symbols.length; j++) {
        out.push([j, i, matrix.values[i][j]]);
      }
    }
    return out;
  }, [matrix]);

  const options = useMemo<Highcharts.Options>(
    () => ({
      chart: { type: 'heatmap', backgroundColor: 'transparent', spacing: [4, 4, 4, 4] },
      xAxis: {
        categories: matrix.symbols,
        opposite: true,
        gridLineWidth: 0,
        lineWidth: 0,
        tickWidth: 0,
        labels: { style: { color: '#b8c9e0', fontSize: '10px', fontWeight: '600' } },
      },
      yAxis: {
        categories: matrix.symbols,
        reversed: true,
        gridLineWidth: 0,
        lineWidth: 0,
        labels: { style: { color: '#b8c9e0', fontSize: '10px', fontWeight: '600' } },
        title: { text: null },
      },
      colorAxis: {
        min: -1,
        max: 1,
        stops: [
          [0,    '#ff4d6d'],
          [0.5,  '#0c1827'],
          [1,    '#14e39a'],
        ],
      },
      legend: { enabled: false },
      tooltip: {
        formatter() {
          const p = this.point as Highcharts.Point & { value: number };
          return `<b>${matrix.symbols[p.y!]} / ${matrix.symbols[p.x!]}</b><br/>ρ = ${p.value.toFixed(2)}`;
        },
      },
      series: [
        {
          type: 'heatmap',
          name: 'Correlation',
          data,
          borderWidth: 1,
          borderColor: '#060c14',
          dataLabels: {
            enabled: true,
            style: { fontSize: '10px', fontWeight: '600', textOutline: 'none' },
            formatter() {
              const v = (this.point as any).value as number;
              return v.toFixed(2);
            },
            color: '#e6f1ff',
          },
        },
      ],
    }),
    [data, matrix.symbols],
  );

  return (
    <Panel title="Correlation Matrix" actions={<span className="chip muted">90D</span>} flush>
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
