import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Proxies Yahoo Finance so the browser can call its endpoints without CORS
    proxy: {
      '/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        secure: true,
        xfwd: false, // Don't forward X-Forwarded-* — Yahoo throttles them
        rewrite: (p) => p.replace(/^\/yahoo/, ''),
        configure: (proxy) => {
          // Strip the localhost-flavoured headers and present cleanly
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader(
              'User-Agent',
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            );
            proxyReq.setHeader('Accept', 'application/json,text/plain,*/*');
            proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
            proxyReq.setHeader('Origin', 'https://finance.yahoo.com');
            proxyReq.setHeader('Referer', 'https://finance.yahoo.com/');
            proxyReq.removeHeader('cookie');
          });
        },
      },
    },
  },
});
