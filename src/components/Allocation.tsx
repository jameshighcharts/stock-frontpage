import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { useMemo } from 'react';
import type { AllocationSlice } from '../data/types';
import { Panel } from './Panel';

export const Allocation = ({ slices }: { slices: AllocationSlice[] }) => {
  const options = useMemo<Highcharts.Options>(
    () => ({
      chart: { type: 'pie', backgroundColor: 'transparent', spacing: [0, 0, 0, 0] },
      tooltip: { pointFormat: '<b>{point.y:.1f}%</b>' },
      plotOptions: {
        pie: {
          innerSize: '70%',
          borderWidth: 0,
          dataLabels: { enabled: false },
          states: { hover: { brightness: 0.1 } },
        },
      },
      series: [
        {
          type: 'pie',
          name: 'Allocation',
          data: slices,
        },
      ],
    }),
    [slices],
  );

  return (
    <Panel
      title="Asset Allocation"
      actions={<span className="chip">REBALANCE</span>}
    >
      <div className="alloc-inner">
        <div style={{ height: '100%', minHeight: 140 }}>
          <HighchartsReact
            highcharts={Highcharts}
            options={options}
            containerProps={{ style: { height: '100%', width: '100%' } }}
          />
        </div>
        <div className="alloc-legend">
          {slices.map((s) => (
            <div className="row" key={s.name}>
              <span className="sw" style={{ background: s.color }} />
              <span className="name">{s.name}</span>
              <span className="pct">{s.y.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
};
