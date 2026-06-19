import type { DataSource } from './types';
import { mockSource } from './mockSource';

/**
 * Single point of configuration for the dashboard data source.
 * Demo build — uses fully synthetic mock data, no network calls.
 *
 * A live Yahoo Finance adapter exists in `yahooSource.ts` and the Vite
 * dev proxy in `vite.config.ts` if you want to swap to real data later;
 * just rebind `dataSource` below.
 */
export const dataSource: DataSource = mockSource;
export { mockSource };

export type { DashboardData, DataSource } from './types';
