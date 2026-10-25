import type { Level } from '@/lib/signals';
import type { TF } from '@/lib/config';
export const LEVELS: Level[] = ['Strong Buy', 'Buy', 'Neutral', 'Sell', 'Strong Sell'];
const CLS: Record<string, string> = {
  'Strong Buy': 'bg-emerald-600 text-white', Buy: 'bg-emerald-400/20 text-emerald-300', Neutral: 'bg-zinc-700/40 text-zinc-400',
  Sell: 'bg-red-400/20 text-red-300', 'Strong Sell': 'bg-red-600 text-white',
};
export type Coin = {
  symbol: string; base: string; price: number; change: number; volume: number;
  tfs: Partial<Record<TF, { level: Level; score: number }>>; overall: { score: number; avg: number; level: Level } | null;
};
export function Badge({ level }: { level?: string }) {
  if (!level) return <span className="text-zinc-600">–</span>;
  return <span className={`inline-block min-w-[4.5rem] rounded px-2 py-1 text-center text-xs font-medium ${CLS[level]}`}>{level}</span>;
}
export const fmt = (p: number) => p.toLocaleString('en-US', { maximumFractionDigits: p >= 100 ? 2 : p >= 1 ? 4 : 8 });
export const compact = (v: number) => Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 2 }).format(v);
export const signed = (n: number) => (n > 0 ? '+' : '') + n;
