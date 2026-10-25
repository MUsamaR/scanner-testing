import { CONFIG } from './config';
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

// Smoothed MA (Wilder). Seeded with a simple average of the first n values.
export function smma(src: number[], n: number): number[] {
  const out: number[] = new Array(src.length).fill(NaN);
  if (src.length < n) return out;
  let s = src.slice(0, n).reduce((a, b) => a + b, 0) / n;
  out[n - 1] = s;
  for (let i = n; i < src.length; i++) { s = (s * (n - 1) + src[i]) / n; out[i] = s; }
  return out;
}
export function atr(cs: Candle[], n = CONFIG.atrPeriod): number[] {
  const tr = cs.map((c, i) => (i === 0 ? c.h - c.l : Math.max(c.h - c.l, Math.abs(c.h - cs[i - 1].c), Math.abs(c.l - cs[i - 1].c))));
  return smma(tr, n);
}
// Lines are computed on median price (H+L)/2 and NOT shifted. Offsets are applied only when drawing.
export function alligator(cs: Candle[]) {
  const m = cs.map((c) => (c.h + c.l) / 2);
  const a = CONFIG.alligator;
  return { jaw: smma(m, a.jaw), teeth: smma(m, a.teeth), lips: smma(m, a.lips) };
}
