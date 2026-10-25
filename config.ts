// All tunable settings live here.
export const TIMEFRAMES = ['1m', '5m', '15m', '1h', '4h', '1d'] as const;
export type TF = (typeof TIMEFRAMES)[number];
export const TF_LABEL: Record<TF, string> = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1H', '4h': '4H', '1d': '1D' };

export const CONFIG = {
  alligator: { jaw: 13, teeth: 8, lips: 5, jawOffset: 8, teethOffset: 5, lipsOffset: 3 }, // offsets: chart only
  atrPeriod: 14,
  useClosedCandle: true, // signals use the last CLOSED candle (no look-ahead)
  thresholds: {
    minSep: 0.15,            // |Lips-Jaw| / ATR below this => Neutral
    strongSep: 1.0,          // separation (in ATRs) that earns a strength point
    strongSlope: 0.05,       // avg line slope (ATRs per bar) that earns a point
    strongConsistency: 0.8,  // share of recent bars with same ordering that earns a point
    strongPoints: 2,         // points needed (of 3) for Strong Buy / Strong Sell
    slopeBars: 3,
    consistencyBars: 5,
  },
  weights: { '1m': 1, '5m': 1, '15m': 2, '1h': 3, '4h': 4, '1d': 5 } as Record<TF, number>,
  overall: { strong: 1.25, normal: 0.4 }, // weighted-average cutoffs on the -2..+2 scale
  cacheSeconds: { '1m': 30, '5m': 60, '15m': 120, '1h': 300, '4h': 600, '1d': 900 } as Record<TF, number>,
  candles: 200,
  hosts: ['https://data-api.binance.vision', 'https://api.binance.com'],
};
