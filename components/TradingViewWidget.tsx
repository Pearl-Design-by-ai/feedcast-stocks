'use client';

import React, { memo, useState, useEffect } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChartTheme } from '@/components/ThemeProvider';

interface TradingViewWidgetProps {
    title?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
    allowExpand?: boolean;
}

const TradingViewWidget = ({ title, scriptUrl, config, height = 600, className, allowExpand = false }: TradingViewWidgetProps) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [windowHeight, setWindowHeight] = useState(0);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setWindowHeight(window.innerHeight);
            const handleResize = () => setWindowHeight(window.innerHeight);
            window.addEventListener('resize', handleResize);
            return () => window.removeEventListener('resize', handleResize);
        }
    }, []);

    const currentHeight = isExpanded ? windowHeight : height;

    // Follow the live app theme via the authoritative `--tv-theme` token (SSR
    // value from the ThemeProvider context, then the real DOM value). This keeps
    // every chart's pane matching the selected theme even after a client-side
    // navigation or an /appearance live-preview change.
    const tvTheme = useChartTheme();

    const widgetConfig: Record<string, unknown> = {
        ...config,
        height: currentHeight,
        width: "100%",
        autosize: true,
    };
    // Set BOTH theme keys to the effective theme. The newer TradingView embeds
    // (notably the Advanced Chart used for candle/baseline/studies) key the
    // whole UI — including the chart pane — off `colorTheme`; our chart configs
    // only carried the older `theme` key, which that embed ignores, so the pane
    // fell back to its dark default on a light page. Setting colorTheme on every
    // config fixes the advanced charts; it's a harmless no-op on embeds that
    // already read `theme`.
    widgetConfig.colorTheme = tvTheme;
    if ('theme' in widgetConfig) widgetConfig.theme = tvTheme;
    // The `theme` flag styles the chrome but not the chart pane, which configs
    // hardcode to a dark backgroundColor/gridColor. Repaint those light too so
    // the chart interior isn't black on a light page. (Dark keeps the config.)
    if (tvTheme === 'light') {
        if ('backgroundColor' in widgetConfig) widgetConfig.backgroundColor = '#ffffff';
        if ('gridColor' in widgetConfig) widgetConfig.gridColor = '#E5E7EB';
        // Transparent widgets (e.g. the Top Stories timeline) paint nothing of
        // their own, so on a light page they keep rendering their default dark
        // fill. Turn opacity on and give them an explicit white background so
        // they actually go light. TradingView accepts isTransparent as a bool
        // or the string 'true'/'false' depending on the embed, so normalise it.
        if ('isTransparent' in widgetConfig) {
            widgetConfig.isTransparent = typeof widgetConfig.isTransparent === 'string' ? 'false' : false;
            if (!('backgroundColor' in widgetConfig)) widgetConfig.backgroundColor = '#ffffff';
        }
        // For the Advanced Chart family (candle / baseline / studies — they carry
        // a `theme` key), the top-level backgroundColor doesn't reliably repaint
        // the candle pane itself, so it can stay black on a light page. The
        // authoritative control is paneProperties.background via `overrides`;
        // force it solid white so the chart interior actually goes light.
        if ('theme' in widgetConfig) {
            const existing = (typeof widgetConfig.overrides === 'object' && widgetConfig.overrides) || {};
            widgetConfig.overrides = {
                ...existing,
                'paneProperties.background': '#ffffff',
                'paneProperties.backgroundType': 'solid',
            };
        }
    }

    const containerRef = useTradingViewWidget(scriptUrl, widgetConfig, currentHeight);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <div className={cn("w-full transition-all duration-300", isExpanded && "fixed inset-0 z-[9999] bg-background")}>
            <div className={cn("w-full relative group", isExpanded && "h-full w-full")}>
                {title && !isExpanded && <h3 className="font-semibold text-2xl text-gray-100 mb-5">{title}</h3>}

                {allowExpand && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleExpand}
                        className={cn(
                            "absolute top-2 right-2 z-10 hover:bg-background/50 text-muted-foreground hover:text-foreground transition-all duration-200",
                            !isExpanded ? "opacity-0 group-hover:opacity-100" : "bg-background/20"
                        )}
                        title={isExpanded ? "Minimize" : "Click to expand"}
                    >
                        {isExpanded ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                    </Button>
                )}

                <div className={cn('tradingview-widget-container', className, isExpanded && "h-full")} ref={containerRef}>
                    <div className="tradingview-widget-container__widget" style={{ height: currentHeight, width: "100%" }} />
                </div>
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
