'use client';

import { useEffect, useState } from 'react';
import { getLiveHeatmap, type HeatmapData } from '@/lib/actions/heatmap.actions';
import StockHeatMap, { type StockHeatMapDatum, type HeatMapPeriod } from '@/components/markets/StockHeatMap';

/**
 * Live container for StockHeatMap. Fetches the engine snapshot (all periods),
 * polls every 60s, owns the period selector, and maps to the presentational
 * StockHeatMapDatum for the active period.
 */
export default function MarketHeatmap() {
  const [raw, setRaw] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<HeatMapPeriod>('d1');

  useEffect(() => {
    let active = true;
    const load = () =>
      getLiveHeatmap()
        .then((d) => {
          if (active) {
            setRaw(d);
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    load();
    const id = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  const data: StockHeatMapDatum[] = (raw?.stocks ?? []).map((s) => ({
    ticker: s.ticker,
    name: s.name,
    sector: s.sector,
    price: s.price ?? 0,
    changePercent: s[period],
    marketCap: s.marketCap,
  }));

  return (
    <StockHeatMap
      data={data}
      period={period}
      onPeriodChange={setPeriod}
      asOf={raw?.asOf}
      loading={loading}
    />
  );
}
