import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@highcharts/grid-lite/css/grid.css';
import './styles/global.css';

// StrictMode disabled — Highcharts Grid mounts imperatively and the
// dev-time double-invoke breaks its async render lifecycle.
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
