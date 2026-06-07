import type { NextConfig } from "next";

// When building for Cloudflare Workers (OpenNext adapter), swap the
// Next image-optimization proxy for a custom loader that routes through
// Cloudflare Image Resizing. CF Workers has no in-Worker image
// transformer, and OpenNext's fallback returns the upstream bytes with
// `content-disposition: attachment`, which breaks inline rendering.
const isCloudflareBuild = process.env.OPENNEXT_TARGET === 'cloudflare';

const nextConfig: NextConfig = {
    devIndicators: false,
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'i.ibb.co',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 'static2.finnhub.io',
                port: '',
                pathname: '/**',
            },
        ],
        ...(isCloudflareBuild
            ? {
                  // Custom loader routes the upstream src through
                  // /cdn-cgi/image/... — skips the `/_next/image` proxy
                  // that CF Workers can't optimize.
                  loader: 'custom' as const,
                  loaderFile: './lib/cloudflare-image-loader.ts',
              }
            : {}),
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    typescript: {
        ignoreBuildErrors: true,
    },
    // Rebrand: the module moved from stocks.feedcast.news to
    // markets.feedcast.news. Permanently redirect any leftover traffic on
    // the legacy host to the same path on the canonical one. Done at the
    // framework routing layer (OpenNext honours next.config redirects) — the
    // `middleware/` folder is NOT a recognised Next middleware location, so
    // a redirect placed there would never run.
    async redirects() {
        const legacyHost = [{ type: 'host' as const, value: 'stocks.feedcast.news' }];
        return [
            // Root needs its own rule: OpenNext fails to substitute an empty
            // `:path*` into an absolute destination (it emits a literal
            // `/:path*`), so the catch-all below would mangle the bare host.
            {
                source: '/',
                has: legacyHost,
                destination: 'https://markets.feedcast.news/',
                permanent: true,
            },
            {
                source: '/:path*',
                has: legacyHost,
                destination: 'https://markets.feedcast.news/:path*',
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
