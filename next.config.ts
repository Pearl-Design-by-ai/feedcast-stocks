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
};

export default nextConfig;
