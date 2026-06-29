import type { MetadataRoute } from 'next';
import { POPULAR_STOCK_SYMBOLS } from '@/lib/constants';

const SITE_URL = 'https://markets.feedcast.news';

/**
 * Public, indexable routes. Members-only / personalized pages (watchlist,
 * alerts, appearance, leverage, portfolio-lab, admin) are intentionally
 * excluded — they self-gate and render no crawlable content to anonymous
 * visitors. Stock detail pages are seeded from POPULAR_STOCK_SYMBOLS so the
 * highest-traffic companies are discoverable; the long tail is reached via
 * in-page links from /stocks and search.
 */
const PUBLIC_ROUTES = [
    '/',
    '/about',
    '/api-docs',
    '/ask',
    '/bubble-detector',
    '/buy-sell-signals',
    '/calendar',
    '/commodities',
    '/compare',
    '/crash-detector',
    '/crypto',
    '/currency',
    '/economic-calendar',
    '/fixed-income',
    '/help',
    '/learn',
    '/market-indicators',
    '/market-regime',
    '/markets',
    '/markets/options-strategies',
    '/screener',
    '/sectors',
    '/stocks',
    '/terms',
    '/valuation',
    '/world-indices',
];

export default function sitemap(): MetadataRoute.Sitemap {
    const routes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((path) => ({
        url: `${SITE_URL}${path}`,
        changeFrequency: path === '/' ? 'hourly' : 'daily',
        priority: path === '/' ? 1 : 0.7,
    }));

    const stocks: MetadataRoute.Sitemap = POPULAR_STOCK_SYMBOLS.map((symbol) => ({
        url: `${SITE_URL}/stocks/${symbol}`,
        changeFrequency: 'daily',
        priority: 0.6,
    }));

    return [...routes, ...stocks];
}
