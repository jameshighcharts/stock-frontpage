import { useEffect, useRef } from 'react';
import * as Grid from '@highcharts/grid-lite';
import type { Options as GridOptions } from '@highcharts/grid-lite';

interface Props {
  options: GridOptions;
}

/**
 * Thin React wrapper around Highcharts Grid Lite.
 * Mounts the grid imperatively and tears it down on unmount.
 * Options updates re-instantiate the grid for a clean DOM.
 */
export const HxGrid = ({ options }: Props) => {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const g = Grid.grid(host, options);
    return () => {
      g?.destroy();
      // Defensive: clear any leftover DOM the async render may have appended
      // after destroy resolves.
      host.innerHTML = '';
    };
  }, [options]);

  return <div ref={hostRef} className="hx-grid highcharts-dark" />;
};
