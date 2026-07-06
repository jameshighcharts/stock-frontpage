/**
 * Yahoo Finance proxy for production — mirrors the Vite dev proxy in
 * vite.config.ts. The client calls /yahoo/<path>; the rewrite in
 * vercel.json lands here with the upstream path in ?path=.
 *
 * Presents clean browser-like headers and drops cookies/X-Forwarded-*
 * so Yahoo doesn't throttle the requests.
 */
export default async function handler(req, res) {
  const { path = '', ...query } = req.query;
  const search = new URLSearchParams(query).toString();
  const url =
    `https://query1.finance.yahoo.com/${path}` + (search ? `?${search}` : '');

  const upstream = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      Accept: 'application/json,text/plain,*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      Origin: 'https://finance.yahoo.com',
      Referer: 'https://finance.yahoo.com/',
    },
  });

  const body = await upstream.text();
  res.status(upstream.status);
  res.setHeader(
    'Content-Type',
    upstream.headers.get('content-type') ?? 'application/json',
  );
  // Let Vercel's edge cache absorb repeat quote traffic
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  res.send(body);
}
