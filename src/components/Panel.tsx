import type { ReactNode } from 'react';

interface Props {
  title: string;
  actions?: ReactNode;
  flush?: boolean;
  children: ReactNode;
}

export const Panel = ({ title, actions, flush, children }: Props) => (
  <section className="panel">
    <div className="panel-head">
      <div className="panel-title">{title}</div>
      <div className="panel-actions">{actions}</div>
    </div>
    <div className={`panel-body${flush ? ' flush' : ''}`}>{children}</div>
  </section>
);
