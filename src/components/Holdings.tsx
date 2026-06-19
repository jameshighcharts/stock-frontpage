import { useMemo } from 'react';
import type { Options as GridOptions } from '@highcharts/grid-lite';
import type { HoldingRow } from '../data/types';
import { Panel } from './Panel';
import { HxGrid } from './HxGrid';

const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { maximumFractionDigits: 0 });

const Html = ({ rows }: { rows: HoldingRow[] }) => (
  <table className="watchlist">
    <thead>
      <tr>
        <th>Symbol</th>
        <th>Qty</th>
        <th>Mkt Val</th>
        <th>P&amp;L %</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((r) => (
        <tr key={r.symbol}>
          <td>{r.symbol}</td>
          <td>{r.qty}</td>
          <td>{fmtMoney(r.marketValue)}</td>
          <td className={r.pnlPct >= 0 ? 'pos' : 'neg'}>
            {r.pnlPct >= 0 ? '+' : ''}
            {r.pnlPct.toFixed(2)}%
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Grid = ({ rows }: { rows: HoldingRow[] }) => {
  const options = useMemo<GridOptions>(
    () => ({
      dataTable: {
        columns: {
          symbol: rows.map((r) => r.symbol),
          qty: rows.map((r) => r.qty),
          marketValue: rows.map((r) => r.marketValue),
          pnlPct: rows.map((r) => r.pnlPct),
        },
      },
      columns: [
        { id: 'symbol', header: { format: 'Symbol' }, cells: { className: 'g-sym' } },
        { id: 'qty', header: { format: 'Qty' } },
        {
          id: 'marketValue',
          header: { format: 'Mkt Val' },
          cells: { formatter: function () { return fmtMoney(this.value as number); } },
        },
        {
          id: 'pnlPct',
          header: { format: 'P&L %' },
          cells: {
            formatter: function () {
              const v = this.value as number;
              const cls = v >= 0 ? 'pos' : 'neg';
              const s = v >= 0 ? '+' : '';
              return `<span class="${cls}">${s}${v.toFixed(2)}%</span>`;
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
  rows: HoldingRow[];
  mode: 'html' | 'grid';
}

export const Holdings = ({ rows, mode }: Props) => (
  <Panel
    title="Dashboard Holdings"
    actions={<span className="chip muted">{rows.length} POSITIONS</span>}
    flush={mode === 'grid'}
  >
    {mode === 'grid' ? <Grid rows={rows} /> : <Html rows={rows} />}
  </Panel>
);
