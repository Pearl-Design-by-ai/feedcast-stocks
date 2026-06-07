'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import TradingViewWidget from '@/components/TradingViewWidget';
import { ADVANCED_CHART_WIDGET_CONFIG } from '@/lib/constants';
import type { MarketIndicator } from '@/lib/market-indicators';
import { buttonVariants } from '@/components/ui/button';
import IndicatorExplainButton from '@/components/market-indicators/IndicatorExplainButton';
import { cn } from '@/lib/utils';

const ADVANCED_CHART_SCRIPT =
    'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

const CHART_HEIGHT = 460;

/**
 * One indicator tile. Chart-backed indicators mount their TradingView widget
 * lazily (only once scrolled near the viewport) so a category with eight charts
 * doesn't fire eight embed scripts at once. Survey indices with no TradingView
 * data render an info card linking out to the official source.
 */
export default function IndicatorCard({
    indicator,
    category,
}: {
    indicator: MarketIndicator;
    category?: string;
}) {
    const { num, name, blurb, widget } = indicator;

    return (
        <div className="flex flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="mb-1 flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-gray-800 px-1.5 text-xs font-semibold text-teal-400">
                    {num}
                </span>
                <h3 className="flex-1 text-base font-semibold text-gray-100">{name}</h3>
                <IndicatorExplainButton name={name} blurb={blurb} category={category} />
            </div>
            <p className="mb-3 text-sm leading-relaxed text-gray-400">{blurb}</p>

            {widget.kind === 'chart' ? (
                <LazyChart
                    symbol={widget.symbol}
                    studies={widget.studies ?? []}
                    interval={widget.interval ?? 'D'}
                    compareSymbols={widget.compareSymbols ?? []}
                />
            ) : (
                <ExternalCard source={widget.source} url={widget.url} note={widget.note} />
            )}
        </div>
    );
}

type ChartWidget = Extract<MarketIndicator['widget'], { kind: 'chart' }>;

function LazyChart({
    symbol,
    studies,
    interval,
    compareSymbols,
}: {
    symbol: string;
    studies: NonNullable<ChartWidget['studies']>;
    interval: string;
    compareSymbols: NonNullable<ChartWidget['compareSymbols']>;
}) {
    const ref = useRef<HTMLDivElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el || visible) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [visible]);

    return (
        <div ref={ref} className="mt-auto" style={{ minHeight: CHART_HEIGHT }}>
            {visible ? (
                <TradingViewWidget
                    scriptUrl={ADVANCED_CHART_SCRIPT}
                    config={ADVANCED_CHART_WIDGET_CONFIG(symbol, studies, interval, compareSymbols)}
                    height={CHART_HEIGHT}
                    allowExpand
                />
            ) : (
                <div
                    className="flex items-center justify-center rounded-lg bg-gray-900/60 text-sm text-gray-600"
                    style={{ height: CHART_HEIGHT }}
                >
                    Loading chart…
                </div>
            )}
        </div>
    );
}

function ExternalCard({
    source,
    url,
    note,
}: {
    source: string;
    url: string;
    note?: string;
}) {
    const isTradingView = source === 'TradingView';
    const message =
        note ??
        (isTradingView
            ? 'A market-internal feed that embedded charts can’t draw. Open the live chart on TradingView.'
            : 'A survey index with no live chart feed. View the latest reading at the source.');

    return (
        <div
            className="mt-auto flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-700 bg-gray-900/60 px-4 text-center"
            style={{ minHeight: CHART_HEIGHT }}
        >
            <p className="max-w-xs text-sm text-gray-400">{message}</p>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
            >
                {isTradingView ? 'Open on TradingView' : `Open at ${source}`}
                <ExternalLink className="h-4 w-4" />
            </a>
        </div>
    );
}
