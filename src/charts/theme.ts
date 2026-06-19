import Highcharts from 'highcharts';

/**
 * Highcharts global theme tuned to match the terminal aesthetic.
 * Applied once at app boot — every chart inherits these defaults.
 */
export const applyTerminalTheme = () => {
  Highcharts.setOptions({
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Inter, sans-serif',
      },
      animation: { duration: 400 },
      spacing: [8, 8, 8, 8],
    },
    title: { text: undefined },
    credits: { enabled: false },
    legend: {
      itemStyle: { color: '#b8c9e0', fontWeight: '500', fontSize: '11px' },
      itemHoverStyle: { color: '#e6f1ff' },
    },
    xAxis: {
      gridLineColor: '#112137',
      lineColor: '#1b2c45',
      tickColor: '#1b2c45',
      labels: { style: { color: '#6b88ad', fontSize: '10px' } },
    },
    yAxis: {
      gridLineColor: '#112137',
      lineColor: 'transparent',
      labels: { style: { color: '#6b88ad', fontSize: '10px' } },
      title: { text: null },
    },
    tooltip: {
      backgroundColor: 'rgba(8, 18, 32, 0.96)',
      borderColor: '#1b2c45',
      borderRadius: 4,
      style: { color: '#e6f1ff', fontSize: '11px' },
      shadow: false,
    },
    plotOptions: {
      series: { animation: { duration: 600 } },
      area: { lineWidth: 1.5 },
    },
    colors: [
      '#2ad4ff', '#1ad6b0', '#4c8cff', '#9b6bff',
      '#ffb547', '#ff4d6d', '#14e39a', '#6b88ad',
    ],
  });
};
