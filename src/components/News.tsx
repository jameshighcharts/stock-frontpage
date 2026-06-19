import type { NewsItem } from '../data/types';
import { Panel } from './Panel';

export const News = ({ items }: { items: NewsItem[] }) => (
  <Panel
    title="Risk & Insights"
    actions={<span className="chip">{items.length} ALERTS</span>}
  >
    <div className="news-list">
      {items.map((n) => (
        <div
          key={n.id}
          className={`news-item ${n.severity === 'warn' ? 'warn' : n.severity === 'info' ? 'info' : ''}`}
        >
          <span className="tag">{n.tag}</span>
          <h4>{n.title}</h4>
          <p>{n.body}</p>
        </div>
      ))}
    </div>
  </Panel>
);
