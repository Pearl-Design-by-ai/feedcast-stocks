'use client';

import React, { memo, useState, useEffect } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Relative luminance (0–1) of a #RGB / #RRGGBB color, or null if unparseable. */
function hexLuminance(hex: string): number | null {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

    // Follow the app theme. Decide from the *resolved* page background actually
    // painted on <body> (getComputedStyle returns a concrete rgb, accounting for
    // the active theme/media query) — reading the raw custom property proved
    // unreliable. Re-check shortly after mount (client nav applies vars a tick
    // late) and on a device scheme change.
    const [tvTheme, setTvTheme] = useState<'dark' | 'light'>('dark');
    useEffect(() => {
        const decide = () => {
            let light = false;
            try {
                const bg = getComputedStyle(document.body).backgroundColor;
                const m = bg.match(/[\d.]+/g);
                if (m && m.length >= 3) {
                    const lum = (0.2126 * +m[0] + 0.7152 * +m[1] + 0.0722 * +m[2]) / 255;
                    light = lum > 0.5;
                } else {
                    const l = hexLuminance(getComputedStyle(document.documentElement).getPropertyValue('--surface-900').trim());
                    light = l != null && l > 0.5;
                }
            } catch {
                /* keep dark */
            }
            setTvTheme(light ? 'light' : 'dark');
        };
        decide();
        const t = setTimeout(decide, 100);
        const mq = window.matchMedia('(prefers-color-scheme: light)');
        mq.addEventListener?.('change', decide);
        return () => {
            clearTimeout(t);
            mq.removeEventListener?.('change', decide);
        };
    }, []);

    const widgetConfig: Record<string, unknown> = {
        ...config,
        height: currentHeight,
        width: "100%",
        autosize: true,
    };
    if ('colorTheme' in widgetConfig) widgetConfig.colorTheme = tvTheme;
    if ('theme' in widgetConfig) widgetConfig.theme = tvTheme;

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
