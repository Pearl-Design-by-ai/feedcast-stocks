import type { MetadataRoute } from 'next';

const SITE_URL = 'https://markets.feedcast.news';

/**
 * The site is public for SEO. Allow crawling of everything except the
 * members-only / personalized areas (which self-gate server-side anyway) and
 * the API. Keeps crawl budget on the content that should rank.
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/admin', '/alerts', '/appearance', '/leverage', '/portfolio-lab', '/watchlist'],
        },
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
