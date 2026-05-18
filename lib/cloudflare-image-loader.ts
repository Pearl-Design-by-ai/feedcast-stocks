/**
 * Custom Next/Image loader for Cloudflare Workers builds. Routes the
 * upstream `src` through Cloudflare Image Transformations on the
 * feedcast.news zone:
 *
 *   <upstream-url>
 *     ↓
 *   /cdn-cgi/image/width=640,quality=70,format=auto/<upstream-url>
 *
 * The browser hits the relative `/cdn-cgi/image/...` path, CF intercepts
 * before the worker, fetches the upstream image, transforms it (resize +
 * format negotiation: AVIF/WebP/JPEG), and returns it cached at the edge.
 *
 * Local origin paths (e.g. `/assets/images/logo.png`) skip the
 * transformer entirely — they're already on our server.
 */
export default function cloudflareImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Local origin asset — bypass the transformer.
  if (src.startsWith('/') && !src.startsWith('//')) {
    return src;
  }

  const q = quality ?? 70;
  // CF expects unencoded URLs; the slash separator is part of the
  // /cdn-cgi/image/ pattern. Don't URI-encode the upstream src.
  return `/cdn-cgi/image/width=${width},quality=${q},format=auto/${src}`;
}
