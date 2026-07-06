import type { DataSource } from './types';
import { mockSource } from './mockSource';
import { yahooSource } from './yahooSource';

/**
 * Single point of configuration for the dashboard data source.
 * Live build — Yahoo Finance through the `/yahoo` proxy (Vite dev proxy
 * locally, Vercel serverless function `api/yahoo/[...path].js` in prod).
 * Rebind to `mockSource` for a fully offline demo.
 */
export const dataSource: DataSource = yahooSource;
export { mockSource };

export type { DashboardData, DataSource } from './types';
