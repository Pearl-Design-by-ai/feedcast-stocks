import type { NextConfig } from "next";
import { securityHeaderRules } from "./lib/security/headers";

// When building for Cloudflare Workers (OpenNext adapter), swap the
// Next image-optimization proxy for a custom loader that routes through
// Cloudflare Image Resizing. CF Workers has no in-Worker image
// transformer, and OpenNext's fallback returns the upstream bytes with
// `content-disposition: attachment`, which breaks inline rendering.
const isCloudflareBuild = process.env.OPENNEXT_TARGET === 'cloudflare';

const nextConfig: NextConfig = {
    devIndicators: false,
    poweredByHeader: false,
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
        // Next 16 dropped 16 from the default imageSizes; keep the Next 15
        // list so generated srcsets (and their edge-cached transforms) are
        // unchanged.
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
    typescript: {
        ignoreBuildErrors: true,
    },
    // Security headers on every Next-served response (pages + /api/*): HSTS,
    // nosniff, XFO DENY, Referrer-Policy, Permissions-Policy, an enforced
    // frame-ancestors / API CSP and the report-only page CSP. Static assets
    // get the base set from public/_headers, /_next/image from
    // worker-wrapper.mjs. See lib/security/headers.ts.
    headers: async () => securityHeaderRules(),
};

export default nextConfig;
