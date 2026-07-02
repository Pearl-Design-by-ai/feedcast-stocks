# FeedCast Markets (feedcast-stocks) — Quick Reference

> PUBLIC repo (AGPL-3.0). Consumer-facing product features only — all
> proprietary analysis, AI prompts and scoring live in the PRIVATE
> `markets-engine` (nested at `markets-engine/`, its own repo/remote),
> reached over a token-authenticated HTTP API via `lib/engine-client.ts`.
> New intelligence = add to the engine + a thin proxy shim here.

## Living-terminal cosmetic layer (globals.css)

The engagement layer at the bottom of `app/globals.css` (search
"Living-terminal layer") keys off the shared card grammar via
**class-substring selectors**:

```css
main [class*="rounded-xl"][class*="bg-gray-900/"] { … }
```

- Cards get their load-in rise + stagger from carrying BOTH `rounded-xl`
  (or `rounded-2xl`) and a `bg-gray-900/…` opacity class. If a card's
  classes are refactored away from that pair, its animation silently stops
  (nothing breaks) — keep the pair, or extend the selectors.
- `.tabular-nums` is globally mapped to Geist Mono — every numeric readout
  gets the terminal face by carrying `tabular-nums`. Don't hand-set mono
  fonts on numbers; just use `tabular-nums`.
- All motion sits behind `prefers-reduced-motion`; keep it that way.
- The Market Pulse tape (`components/MarketPulseTape.tsx`) and tone aura
  (`components/ToneAura.tsx`) read the cached signals report — they render
  nothing when the engine is unreachable. Wrap both in `<Suspense>`.

## Deploys

`main` = production (markets.feedcast.news). Push → GitHub Actions →
Cloudflare Workers (OpenNext). The engine deploys separately with
`wrangler deploy` from `markets-engine/`.
