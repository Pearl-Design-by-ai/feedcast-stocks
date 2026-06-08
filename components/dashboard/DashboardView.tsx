import { Suspense } from 'react';
import TradingViewWidget from '@/components/TradingViewWidget';
import MarketBrief from '@/components/MarketBrief';
import AiCommentary from '@/components/ai/AiCommentary';
import MarketRegimeView from '@/components/markets/MarketRegimeView';
import WorldEtfs from '@/components/world/WorldEtfs';
import Portfolio from '@/components/portfolio/Portfolio';
import AskShortcut from '@/components/dashboard/AskShortcut';
import WatchlistTile from '@/components/dashboard/WatchlistTile';
import {
  MARKET_OVERVIEW_WIDGET_CONFIG,
  HEATMAP_WIDGET_CONFIG,
  MARKET_DATA_WIDGET_CONFIG,
  TOP_STORIES_WIDGET_CONFIG,
  SCREENER_WIDGET_CONFIG,
  ECONOMIC_CALENDAR_WIDGET_CONFIG,
  FOREX_HEATMAP_WIDGET_CONFIG,
  CRYPTO_HEATMAP_WIDGET_CONFIG,
} from '@/lib/constants';
import type { DashboardLayout, ModuleId } from '@/lib/dashboard/catalog';

const TV = 'https://s3.tradingview.com/external-embedding/embed-widget-';

function tv(name: string, config: Record<string, unknown>, height: number) {
  return <TradingViewWidget scriptUrl={`${TV}${name}`} config={config} height={height} />;
}

function renderModule(id: ModuleId, userId: string) {
  switch (id) {
    case 'market-overview':
      return tv('market-overview.js', MARKET_OVERVIEW_WIDGET_CONFIG, 500);
    case 'stock-heatmap':
      return tv('stock-heatmap.js', HEATMAP_WIDGET_CONFIG, 500);
    case 'market-quotes':
      return tv('market-quotes.js', MARKET_DATA_WIDGET_CONFIG, 520);
    case 'top-stories':
      return tv('timeline.js', TOP_STORIES_WIDGET_CONFIG, 520);
    case 'screener':
      return tv('screener.js', SCREENER_WIDGET_CONFIG, 600);
    case 'economic-calendar':
      return tv('events.js', ECONOMIC_CALENDAR_WIDGET_CONFIG, 540);
    case 'forex-heatmap':
      return tv('forex-heat-map.js', FOREX_HEATMAP_WIDGET_CONFIG, 420);
    case 'crypto-heatmap':
      return tv('crypto-coins-heatmap.js', CRYPTO_HEATMAP_WIDGET_CONFIG, 460);
    case 'market-brief':
      return (
        <Suspense fallback={null}>
          <MarketBrief />
        </Suspense>
      );
    case 'ai-commentary':
      return <AiCommentary topic="market-regime" />;
    case 'ask-shortcut':
      return <AskShortcut />;
    case 'watchlist':
      return <WatchlistTile userId={userId} />;
    case 'portfolio':
      return <Portfolio />;
    case 'market-regime':
      return (
        <Suspense fallback={<div className="text-sm text-gray-500">Computing regime…</div>}>
          <MarketRegimeView />
        </Suspense>
      );
    case 'world-indices':
      return <WorldEtfs />;
    default:
      return null;
  }
}

export default function DashboardView({
  layout,
  userId,
}: {
  layout: DashboardLayout;
  userId: string;
}) {
  if (layout.tiles.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-800 p-8 text-center text-sm text-gray-500">
        Your dashboard is empty — tap “Customize” to add modules.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {layout.tiles.map((t) => (
        <section
          key={t.id}
          className={t.span === 'full' ? 'md:col-span-2' : 'md:col-span-1'}
        >
          {renderModule(t.id, userId)}
        </section>
      ))}
    </div>
  );
}
