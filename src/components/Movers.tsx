import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import type { Mover } from '../data/types';
import { Panel } from './Panel';

const sparkOptions = (data: number[], pos: boolean): Highcharts.Options => ({
  chart: {
    backgroundColor: 'transparent',
    margin: [2, 2, 2, 2],
    height: 36,
    type: 'area',
  },
  xAxis: { visible: false },
  yAxis: { visible: false },
  legend: { enabled: false },
  tooltip: { enabled: false },
  plotOptions: {
    area: {
      marker: { enabled: false },
      lineWidth: 1.5,
      fillOpacity: 0.25,
    },
  },
  series: [
    {
      type: 'area',
      data,
      color: pos ? '#14e39a' : '#ff4d6d',
      fillColor: pos ? 'rgba(20,227,154,0.2)' : 'rgba(255,77,109,0.2)',
    },
  ],
});

export const Movers = ({ rows }: { rows: Mover[] }) => (
  <Panel
    title="Top Movers Today"
    actions={
      <div className="movers-tabs">
        <span className="tab active">% Δ</span>
        <span className="tab">Vol</span>
      </div>
    }
    flush
  >
    <div className="movers">
      {rows.map((m) => {
        const pos = m.changePct >= 0;
        return (
          <div className="mover" key={m.symbol}>
            <div className="head">
              <span className="sym">{m.symbol}</span>
              <span className={`pct ${pos ? 'pos' : 'neg'}`}>
                {pos ? '+' : ''}
                {m.changePct.toFixed(2)}%
              </span>
            </div>
            <span className="name">{m.name}</span>
            <div className="spark">
              <HighchartsReact
                highcharts={Highcharts}
                options={sparkOptions(m.spark, pos)}
                containerProps={{ style: { height: '100%', width: '100%' } }}
              />
            </div>
          </div>
        );
      })}
    </div>
  </Panel>
);
