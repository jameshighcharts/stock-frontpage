import { useMemo } from 'react';
import type { Options as GridOptions } from '@highcharts/grid-lite';
import type { WatchRow } from '../data/types';
import { Panel } from './Panel';
import { HxGrid } from './HxGrid';

const sign = (n: number) => (n >= 0 ? '+' : '');

const Html = ({ rows }: { rows: WatchRow[] }) => (
  <table className="watchlist">
    <thead>
      <tr>
        <th>Symbol</th>
        <th>Last</th>
        <th>Δ %</th>
        <th>Vol Δ</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.symbol}>
          <td>{r.symbol}</td>
          <td>{r.last.toFixed(2)}</td>
          <td className={r.changePct >= 0 ? 'pos' : 'neg'}>
            {sign(r.changePct)}
            {r.changePct.toFixed(2)}%
          </td>
          <td className={r.volumePct >= 0 ? 'muted' : 'neg'}>
            {sign(r.volumePct)}
            {r.volumePct.toFixed(1)}%
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Grid = ({ rows }: { rows: WatchRow[] }) => {
  const options = useMemo<GridOptions>(
    () => ({
      dataTable: {
        columns: {
          symbol: rows.map((r) => r.symbol),
          last: rows.map((r) => r.last),
          changePct: rows.map((r) => r.changePct),
          volumePct: rows.map((r) => r.volumePct),
        },
      },
      columns: [
        { id: 'symbol', header: { format: 'Symbol' }, cells: { className: 'g-sym' } },
        {
          id: 'last',
          header: { format: 'Last' },
          cells: { formatter: function () { return (this.value as number).toFixed(2); } },
        },
        {
          id: 'changePct',
          header: { format: 'Δ %' },
          cells: {
            formatter: function () {
              const v = this.value as number;
              return `<span class="${v >= 0 ? 'pos' : 'neg'}">${sign(v)}${v.toFixed(2)}%</span>`;
            },
          },
        },
        {
          id: 'volumePct',
          header: { format: 'Vol Δ' },
          cells: {
            formatter: function () {
              const v = this.value as number;
              const cls = v >= 0 ? 'muted' : 'neg';
              return `<span class="${cls}">${sign(v)}${v.toFixed(1)}%</span>`;
            },
          },
        },
      ],
    }),
    [rows],
  );

  return <HxGrid options={options} />;
};

interface Props {
  rows: WatchRow[];
  mode: 'html' | 'grid';
}

export const Watchlist = ({ rows, mode }: Props) => (
  <Panel title="Watchlist" actions={<span className="chip">LIVE</span>} flush={mode === 'grid'}>
    {mode === 'grid' ? <Grid rows={rows} /> : <Html rows={rows} />}
  </Panel>
);
