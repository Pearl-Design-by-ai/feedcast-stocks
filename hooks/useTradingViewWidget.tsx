'use client';
import { useEffect, useRef } from "react";

const useTradingViewWidget = (scriptUrl: string, config: Record<string, unknown>, height: number | string = 600) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // If autosize is true in config, we want 100% height/width
        const isAutosize = config.autosize === true;
        const styleHeight = isAutosize ? '100%' : `${height}px`;

        // Fresh host per run. On cleanup the host is DETACHED, never emptied:
        // a TV embed script whose fetch completes after cleanup (theme flip,
        // resize, unmount) still finds `currentScript.parentElement` and its
        // widget div inside the detached subtree, renders harmlessly there and
        // gets garbage-collected — instead of throwing
        // "Cannot read properties of null (reading 'querySelector')".
        const host = document.createElement('div');
        host.style.cssText = 'width:100%;height:100%';
        host.innerHTML = `<div class="tradingview-widget-container__widget" style="width: 100%; height: ${styleHeight};"></div>`;

        const script = document.createElement("script");
        script.src = scriptUrl;
        script.async = true;
        script.innerHTML = JSON.stringify(config);
        host.appendChild(script);

        container.replaceChildren(host);

        return () => {
            host.remove();
        };
    }, [scriptUrl, JSON.stringify(config), height]) // Use stringified config to avoid ref issues

    return containerRef;
}
export default useTradingViewWidget
