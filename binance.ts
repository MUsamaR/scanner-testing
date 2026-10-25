import { CONFIG, TF } from './config';
import type { Candle } from './alligator';

// Per-instance memory cache + stale fallback. Responses are also CDN-cached via Cache-Control headers.
const cache = new Map<string, { t: number; v: any }>();
export async function bget(path: string, ttl: number) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.t < ttl * 1000) return hit.v;
  let err: unknown;
  for (const host of CONFIG.hosts) {
    try {
      const r = await fetch(host + path, { signal: AbortSignal.timeout(8000), cache: 'no-store' });
      if (!r.ok) throw new Error(String(r.status));
      const v = await r.json();
      cache.set(path, { t: Date.now(), v });
      return v;
    } catch (e) { err = e; }
  }
  if (hit) return hit.v; // serve stale rather than fail
  throw err;
}

export async function getKlines(symbol: string, tf: TF, limit = CONFIG.candles): Promise<Candle[]> {
  const raw = await bget(`/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`, CONFIG.cacheSeconds[tf]);
  return raw.map((k: any) => ({ t: k[0], o: +k[1], h: +k[2], l: +k[3], c: +k[4], v: +k[5] }));
}

const LEVERAGED = /^[A-Z0-9]{2,}(UP|DOWN|BULL|BEAR)$/;
const STABLE = new Set(['USDC', 'FDUSD', 'TUSD', 'USDP', 'DAI', 'BUSD', 'USDE', 'USD1', 'EUR', 'EURI', 'AEUR', 'XUSD']);
export type Ticker = { symbol: string; base: string; price: number; change: number; volume: number };

export async function getMarket(top: number): Promise<Ticker[]> {
  const all: any[] = await bget('/api/v3/ticker/24hr', 20);
  return all
    .filter((x) => x.symbol.endsWith('USDT'))
    .map((x) => ({ symbol: x.symbol, base: x.symbol.slice(0, -4), price: +x.lastPrice, change: +x.priceChangePercent, volume: +x.quoteVolume }))
    .filter((x) => !LEVERAGED.test(x.base) && !STABLE.has(x.base) && x.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, top);
}

export async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k]); } }));
  return out;
}
