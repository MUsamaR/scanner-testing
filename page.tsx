'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TIMEFRAMES, TF_LABEL, TF } from '@/lib/config';
import type { Level } from '@/lib/signals';
import { Badge, Coin, LEVELS, fmt, signed } from '@/components/ui';
import Detail from '@/components/Detail';

function Setups({ title, list, onPick }: { title: string; list: Coin[]; onPick: (c: Coin) => void }) {
  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <h2 className="mb-2 font-semibold">{title}</h2>
      {!list.length && <p className="text-sm text-zinc-500">No setups right now.</p>}
      {list.map((c) => (
        <button key={c.symbol} onClick={() => onPick(c)} className="flex w-full items-center gap-2 py-1 text-left text-sm hover:bg-zinc-800/50">
          <span className="w-12 font-medium">{c.base}</span><Badge level={c.overall?.level} />
          <span className="num w-10 text-zinc-300">{signed(c.overall!.score)}</span>
          <span className="ml-auto hidden gap-1 sm:flex">{(['1h', '4h', '1d'] as TF[]).map((t) => <Badge key={t} level={c.tfs[t]?.level} />)}</span>
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [top, setTop] = useState(20);
  const [q, setQ] = useState('');
  const [data, setData] = useState<{ updated: number; source: string; coins: Coin[] } | null>(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [lvl, setLvl] = useState<Level | null>(null);
  const [cols, setCols] = useState<TF[]>([...TIMEFRAMES]);
  const [sel, setSel] = useState<Coin | null>(null);

  const load = useCallback(async () => {
    setBusy(true);
    try { const r = await fetch(`/api/signals?top=${top}`); if (!r.ok) throw 0; setData(await r.json()); setErr(''); }
    catch { setErr('Data temporarily unavailable'); }
    setBusy(false);
  }, [top]);
  useEffect(() => { load(); const t = setInterval(load, 45000); return () => clearInterval(t); }, [load]);

  const coins = data?.coins ?? [];
  const rows = useMemo(() => coins.filter((c) => c.base.includes(q.toUpperCase()) && (!lvl || c.overall?.level === lvl)), [coins, q, lvl]);
  const best = (dir: 1 | -1) => coins.filter((c) => c.overall && c.overall.score * dir > 0).sort((a, b) => (b.overall!.score - a.overall!.score) * dir).slice(0, 5);
  const toggle = (t: TF) => setCols((c) => (c.includes(t) ? c.filter((x) => x !== t) : TIMEFRAMES.filter((x) => x === t || c.includes(x))));

  return (
    <main className="mx-auto max-w-7xl p-3 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-xl font-bold tracking-wide sm:text-2xl">Crypto Alligator Scanner</h1>
        <p className="text-xs text-zinc-400">
          Updated {data ? new Date(data.updated).toLocaleTimeString() : '–'} · Source: {data?.source ?? '–'} ·{' '}
          <span className={err ? 'text-red-400' : 'text-emerald-400'}>{err ? 'Offline' : 'Market open 24/7'}</span>
        </p>
      </header>

      <div className="my-4 flex flex-wrap items-center gap-2">
        {[20, 40, 60, 100].map((n) => (<button key={n} onClick={() => setTop(n)} className={`rounded px-3 py-1 text-sm ${n === top ? 'bg-zinc-200 text-black' : 'bg-zinc-800'}`}>Top {n}</button>))}
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search coin" className="rounded border border-zinc-700 bg-transparent px-3 py-1 text-sm" />
        <button onClick={load} disabled={busy} className="rounded border border-zinc-700 px-3 py-1 text-sm hover:bg-zinc-800 disabled:opacity-50">{busy ? 'Refreshing…' : 'Refresh'}</button>
        <span className="ml-auto flex gap-1">{TIMEFRAMES.map((t) => (<button key={t} onClick={() => toggle(t)} className={`rounded px-2 py-1 text-xs ${cols.includes(t) ? 'bg-zinc-700' : 'bg-zinc-900 text-zinc-600'}`}>{TF_LABEL[t]}</button>))}</span>
      </div>

      {err && <p className="mb-3 rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">{err}. {data ? 'Showing the last data received.' : 'Retrying automatically.'}</p>}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {LEVELS.map((l) => (
          <button key={l} onClick={() => setLvl(lvl === l ? null : l)} className={`rounded-lg border p-3 text-left ${lvl === l ? 'border-zinc-300' : 'border-zinc-800'}`}>
            <Badge level={l} /><div className="num mt-2 text-2xl font-semibold">{coins.filter((c) => c.overall?.level === l).length}</div>
          </button>))}
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Setups title="Strongest bullish setups" list={best(1)} onPick={setSel} />
        <Setups title="Strongest bearish setups" list={best(-1)} onPick={setSel} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-zinc-900 text-left text-zinc-400"><tr>
            <th className="p-2">Coin</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">24h %</th>
            {cols.map((t) => <th key={t} className="p-2 text-center">{TF_LABEL[t]}</th>)}
            <th className="p-2 text-center">Overall</th><th className="p-2 text-right">Score</th>
          </tr></thead>
          <tbody>
            {!data && !err && <tr><td colSpan={20} className="p-8 text-center text-zinc-500">Scanning {top} coins…</td></tr>}
            {rows.map((c) => (
              <tr key={c.symbol} onClick={() => setSel(c)} className="cursor-pointer border-t border-zinc-800 hover:bg-zinc-800/40">
                <td className="p-2 font-medium">{c.base}</td>
                <td className="num p-2 text-right">${fmt(c.price)}</td>
                <td className={`num p-2 text-right ${c.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{c.change.toFixed(2)}%</td>
                {cols.map((t) => <td key={t} className="p-2 text-center"><Badge level={c.tfs[t]?.level} /></td>)}
                <td className="p-2 text-center"><Badge level={c.overall?.level} /></td>
                <td className="num p-2 text-right">{c.overall ? signed(c.overall.score) : '–'}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-zinc-500">Williams Alligator (13/8/5) on the last closed candle, strength scored by ATR-normalised separation, slope and consistency. Independent method, not Sarmaaya&apos;s formula. Not financial advice.</p>
      {sel && <Detail coin={sel} onClose={() => setSel(null)} />}
    </main>
  );
}
