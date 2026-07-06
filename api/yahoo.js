/**
 * Yahoo Finance proxy for production — mirrors the Vite dev proxy in
 * vite.config.ts. The client calls /yahoo/<path>; the rewrite in
 * vercel.json lands here with the upstream path in ?path=.
 *
 * Yahoo aggressively 429s datacenter IPs, so on a 429 we warm up a
 * session cookie via fc.yahoo.com and retry across both query hosts.
 */
const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

let sessionCookie = null; // survives across invocations on a warm lambda

async function warmCookie() {
  try {
    const r = await fetch('https://fc.yahoo.com/', {
      headers: BROWSER_HEADERS,
      redirect: 'manual',
    });
    const c = r.headers.get('set-cookie');
    if (c) sessionCookie = c.split(';')[0];
  } catch {
    /* cookie warm-up is best-effort */
  }
}

export default async function handler(req, res) {
  const { path = '', ...query } = req.query;
  const search = new URLSearchParams(query).toString();
  const suffix = `/${path}` + (search ? `?${search}` : '');

  const attempts = [
    'https://query1.finance.yahoo.com',
    'https://query2.finance.yahoo.com',
  ];

  let upstream = null;
  for (let i = 0; i < attempts.length; i++) {
    const headers = { ...BROWSER_HEADERS };
    if (sessionCookie) headers.Cookie = sessionCookie;
    upstream = await fetch(attempts[i] + suffix, { headers });
    if (upstream.status !== 429) break;
    if (!sessionCookie) await warmCookie();
  }

  const body = await upstream.text();
  res.status(upstream.status);
  res.setHeader(
    'Content-Type',
    upstream.headers.get('content-type') ?? 'application/json',
  );
  // Cache successes at the edge; let 429s expire fast so retries can land
  res.setHeader(
    'Cache-Control',
    upstream.ok
      ? 's-maxage=300, stale-while-revalidate=3600'
      : 's-maxage=5',
  );
  res.send(body);
}
