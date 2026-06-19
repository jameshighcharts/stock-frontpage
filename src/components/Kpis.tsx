import { useState } from 'react';
import type { KpiGroup } from '../data/types';
import { Panel } from './Panel';

export const Kpis = ({ groups }: { groups: KpiGroup[] }) => {
  const [activeId, setActiveId] = useState(groups[0]?.id);
  const active = groups.find((g) => g.id === activeId) ?? groups[0];

  return (
    <Panel
      title="Key Metrics"
      actions={
        <div className="kpi-tabs">
          {groups.map((g) => (
            <button
              key={g.id}
              className={`kpi-tab ${g.id === active.id ? 'on' : ''}`}
              onClick={() => setActiveId(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      }
      flush
    >
      <div className="kpi-grid">
        {active.tiles.map((t) => (
          <div key={t.label} className="kpi">
            <div className="label">{t.label}</div>
            <div className="value">{t.value}</div>
            <div className="sub">
              {t.sub}
              {typeof t.delta === 'number' && (
                <span className={`delta ${t.delta >= 0 ? 'pos' : 'neg'}`}>
                  {' '}
                  {t.delta >= 0 ? '▲' : '▼'} {Math.abs(t.delta).toFixed(1)}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
};
