import { CONFIG, TIMEFRAMES, TF } from './config';
import { alligator, atr, Candle } from './alligator';

export type Level = 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
export const SCORE: Record<Level, number> = { 'Strong Buy': 2, Buy: 1, Neutral: 0, Sell: -1, 'Strong Sell': -2 };
export type TfSignal = { level: Level; score: number; jaw: number; teeth: number; lips: number; sep: number; points: number };

export function levelFromAvg(x: number): Level {
  const { strong, normal } = CONFIG.overall;
  return x >= strong ? 'Strong Buy' : x >= normal ? 'Buy' : x <= -strong ? 'Strong Sell' : x <= -normal ? 'Sell' : 'Neutral';
}

export function tfSignal(candles: Candle[]): TfSignal | null {
  const cs = CONFIG.useClosedCandle ? candles.slice(0, -1) : candles; // drop the forming candle
  if (cs.length < 60) return null;
  const { jaw, teeth, lips } = alligator(cs);
  const A = atr(cs), i = cs.length - 1, th = CONFIG.thresholds;
  const J = jaw[i], T = teeth[i], L = lips[i], a = A[i];
  if (![J, T, L, a, jaw[i - th.slopeBars], jaw[i - th.consistencyBars]].every(Number.isFinite) || a <= 0) return null;
  const dir = (j: number, t: number, l: number) => (l > t && t > j ? 1 : l < t && t < j ? -1 : 0);
  const d = dir(J, T, L), sep = Math.abs(L - J) / a;
  const base = { jaw: J, teeth: T, lips: L, sep, points: 0 };
  if (!d || sep < th.minSep) return { level: 'Neutral', score: 0, ...base };
  const k = th.slopeBars;
  const slope = (((L - lips[i - k]) + (T - teeth[i - k]) + (J - jaw[i - k])) / 3 / k / a) * d; // ATRs/bar, in trend direction
  let cons = 0;
  for (let b = 0; b < th.consistencyBars; b++) if (dir(jaw[i - b], teeth[i - b], lips[i - b]) === d) cons++;
  cons /= th.consistencyBars;
  const points = +(sep >= th.strongSep) + +(slope >= th.strongSlope) + +(cons >= th.strongConsistency);
  const mag = points >= th.strongPoints ? 2 : 1;
  const level: Level = d > 0 ? (mag === 2 ? 'Strong Buy' : 'Buy') : mag === 2 ? 'Strong Sell' : 'Sell';
  return { level, score: d * mag, ...base, points };
}

// Weighted overall. Timeframes with missing data are skipped and the weights re-normalised.
export function overall(sigs: Partial<Record<TF, Level | undefined>>) {
  let ws = 0, w = 0;
  for (const tf of TIMEFRAMES) { const s = sigs[tf]; if (!s) continue; ws += SCORE[s] * CONFIG.weights[tf]; w += CONFIG.weights[tf]; }
  if (!w) return null;
  return { score: ws, avg: ws / w, level: levelFromAvg(ws / w) };
}
