'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getLiveHeatmap, type HeatmapData } from '@/lib/actions/heatmap.actions';

// Green for up, red for down; alpha scales with magnitude (capped at 4%).
function tileColor(dp: number | null): string {
  if (dp == null) return 'rgba(255,255,255,0.05)';
  const i = Math.min(Math.abs(dp) / 4, 1);
  const a = (0.16 + 0.62 * i).toFixed(3);
  return dp >= 0 ? `rgba(22,163,74,${a})` : `rgba(220,38,38,${a})`;
}

function fmtPct(dp: number | null): string {
  if (dp == null) return '—';
  return `${dp >= 0 ? '+' : ''}${dp.toFixed(2)}%`;
}

function fmtTime(iso: string): string {
  if (!iso) return '';
  // Stable HH:MM — avoids locale/SSR drift (this is a client component anyway).
  const t = iso.slice(11, 16);
  return t ? `${t} UTC` : '';
}

export default function LiveHeatmap() {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () =>
      getLiveHeatmap()
        .then((d) => {
          if (active) {
            setData(d);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    load();
    const id = setInterval(load, 60_000); // refresh ~every minute
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (loading && !data) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-gray-800 bg-gray-900/40 text-sm text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-400" /> Loading live heatmap…
      </div>
    );
  }

  if (!data || data.sectors.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 text-sm text-gray-500">
        Heatmap unavailable right now.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
          </span>
          Live Heatmap
        </span>
        <span className="text-[11px] text-gray-500">
          Finnhub · ~60s{data.asOf ? ` · ${fmtTime(data.asOf)}` : ''}
        </span>
      </div>

      <div className="space-y-3">
        {data.sectors.map((sec) => (
          <div key={sec.sector}>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-gray-500">{sec.sector}</p>
            <div className="flex flex-wrap gap-1.5">
              {sec.stocks.map((s) => (
                <div
                  key={s.symbol}
                  title={`${s.name}${s.price ? ` · $${s.price.toFixed(2)}` : ''}`}
                  className="flex min-w-[74px] flex-1 flex-col items-center rounded-md px-2 py-1.5"
                  style={{ backgroundColor: tileColor(s.changePct) }}
                >
                  <span className="text-xs font-bold text-white">{s.symbol}</span>
                  <span className="text-[11px] tabular-nums text-white/90">{fmtPct(s.changePct)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
