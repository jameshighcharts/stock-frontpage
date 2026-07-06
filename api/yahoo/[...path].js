/**
 * Yahoo Finance proxy for production — mirrors the Vite dev proxy in
 * vite.config.ts. Mounted at /api/yahoo/*, reached by the client as
 * /yahoo/* via the rewrite in vercel.json.
 *
 * Presents clean browser-like headers and drops cookies/X-Forwarded-*
 * so Yahoo doesn't throttle the requests.
 */
export default async function handler(req, res) {
  const { path = [], ...query } = req.query;
  const segments = Array.isArray(path) ? path : [path];
  const search = new URLSearchParams(query).toString();
  const url =
    `https://query1.finance.yahoo.com/${segments.map(encodeURIComponent).join('/')}` +
    (search ? `?${search}` : '');

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
