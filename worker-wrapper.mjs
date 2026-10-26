/**
 * Wraps OpenNext's generated worker.js to intercept `/_next/image`
 * requests before OpenNext's top-level image handler short-circuits.
 *
 * OpenNext's worker.js has an explicit early-return for that path
 * (`url.pathname === "/_next/image"` → `handleImageRequest`), which
 * pulls the upstream raw bytes via the AWS-default fallback. Since
 * Next.js emits `<link rel="preload" as="image">` tags pointing at
 * `/_next/image?url=...` regardless of the `loaderFile` config, those
 * preloads fetch raw upstream images and tank LCP.
 *
 * The wrapper runs first: if the request matches /_next/image, it
 * fetches the upstream via Cloudflare Image Resizing using the Worker
 * `cf.image` API. For everything else, falls through to OpenNext.
 */
import openNextHandler from './.open-next/worker.js';
import { withImageSecurityHeaders } from './lib/security/headers.ts';

// Sync SSRF check — this file is the outermost worker entry and runs on
// every request, so the check is kept inline (no DNS lookup, no
// module-graph cost). Blocks the classic vectors: non-https, IP-literal
// private ranges, credentials in URL, non-standard ports.
function isUpstreamSafe(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return false; }
  if (u.protocol !== 'https:') return false;
  if (u.username || u.password) return false;
  if (u.port && u.port !== '443') return false;
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || h === 'localhost.localdomain') return false;
  if (h === '169.254.169.254' || h === 'metadata.google.internal' || h === 'instance-data') return false;
  if (/^127\./.test(h)) return false;
  if (/^10\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^192\.168\./.test(h)) return false;
  if (/^169\.254\./.test(h)) return false;
  if (/^0\./.test(h) || h === '0.0.0.0') return false;
  if (/^fc00:/i.test(h) || /^fd/i.test(h) || h === '::1' || h === '::') return false;
  return true;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/_next/image') {
      const upstream = url.searchParams.get('url');
      const width = url.searchParams.get('w');
      const quality = url.searchParams.get('q') ?? '75';

      // External upstream → CF Image Resizing via cf.image. Local-origin
      // sources fall through to OpenNext (assets binding serves them).
      if (upstream && width && !upstream.startsWith('/')) {
        if (!isUpstreamSafe(upstream)) {
          return new Response('Bad upstream', { status: 400, headers: withImageSecurityHeaders(new Headers()) });
        }
        const res = await fetch(upstream, {
          cf: {
            image: {
              width: parseInt(width, 10),
              quality: parseInt(quality, 10),
              format: 'auto',
            },
          },
        });
        const ct = res.headers.get('content-type') || '';
        if (!ct.startsWith('image/')) {
          return new Response('Bad upstream content', { status: 502, headers: withImageSecurityHeaders(new Headers()) });
        }
        // Only the headers an image response needs — never upstream cookies,
        // CSP/CORS or disposition — plus our own nosniff + sandbox CSP
        // (next.config headers never reach /_next/image: OpenNext answers it
        // before Next's routing).
        const headers = new Headers();
        for (const name of ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified', 'vary']) {
          const v = res.headers.get(name);
          if (v) headers.set(name, v);
        }
        return new Response(res.body, { status: res.status, headers: withImageSecurityHeaders(headers) });
      }

      // Local-origin sources: OpenNext's own image handler. Add the same
      // headers to its response (Response headers from fetch are immutable).
      const local = await openNextHandler.fetch(request, env, ctx);
      return new Response(local.body, {
        status: local.status,
        statusText: local.statusText,
        headers: withImageSecurityHeaders(new Headers(local.headers)),
      });
    }

    return openNextHandler.fetch(request, env, ctx);
  },
};
