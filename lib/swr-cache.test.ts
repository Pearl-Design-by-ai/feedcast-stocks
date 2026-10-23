import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { swrCached, defaultStaleSeconds, __resetSwrMemory } from './swr-cache';

// No Workers context under test: KV is absent (memory layer only) and there is
// no waitUntil. Mocked so module loading doesn't race the fake timers.
vi.mock('./market-cache', () => ({ getMarketKV: async () => null }));
vi.mock('@opennextjs/cloudflare', () => ({
    getCloudflareContext: () => {
        throw new Error('no Workers context');
    },
}));

beforeEach(() => {
    __resetSwrMemory();
    vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('swrCached', () => {
    it('serves a fresh entry without calling the loader again', async () => {
        const loader = vi.fn(async () => 1);
        expect(await swrCached('k', { fresh: 60 }, loader)).toBe(1);
        expect(await swrCached('k', { fresh: 60 }, loader)).toBe(1);
        expect(loader).toHaveBeenCalledTimes(1);
    });

    it('serves stale immediately and refreshes in the background', async () => {
        let n = 0;
        const loader = vi.fn(async () => ++n);
        await swrCached('k', { fresh: 60, stale: 600 }, loader);
        vi.advanceTimersByTime(61_000);
        expect(await swrCached('k', { fresh: 60, stale: 600 }, loader)).toBe(1);
        await vi.runAllTimersAsync();
        expect(loader).toHaveBeenCalledTimes(2);
        expect(await swrCached('k', { fresh: 60, stale: 600 }, loader)).toBe(2);
    });

    it('refetches once an entry is past fresh + stale', async () => {
        let n = 0;
        const loader = async () => ++n;
        await swrCached('k', { fresh: 60, stale: 60 }, loader);
        vi.advanceTimersByTime(121_000);
        expect(await swrCached('k', { fresh: 60, stale: 60 }, loader)).toBe(2);
    });

    it('caps the wait on a cold miss, then caches the late value for the next caller', async () => {
        const loader = vi.fn(() => new Promise<string>((r) => setTimeout(() => r('late'), 5_000)));
        const first = swrCached('k', { fresh: 60, timeoutMs: 2_500 }, loader);
        await vi.advanceTimersByTimeAsync(2_500);
        expect(await first).toBeNull();
        await vi.advanceTimersByTimeAsync(2_500);
        expect(await swrCached('k', { fresh: 60, timeoutMs: 2_500 }, loader)).toBe('late');
        expect(loader).toHaveBeenCalledTimes(1);
    });

    it('never caches values the predicate rejects (default: null)', async () => {
        const loader = vi.fn(async () => null);
        await swrCached('k', { fresh: 60 }, loader);
        await swrCached('k', { fresh: 60 }, loader);
        expect(loader).toHaveBeenCalledTimes(2);

        const err = vi.fn(async () => ({ ok: false }));
        await swrCached('e', { fresh: 60, shouldCache: (v) => v.ok }, err);
        expect(await swrCached('e', { fresh: 60, shouldCache: (v) => v.ok }, err)).toEqual({ ok: false });
        expect(err).toHaveBeenCalledTimes(2);
    });

    it('collapses concurrent misses into one loader call', async () => {
        const loader = vi.fn(() => new Promise<number>((r) => setTimeout(() => r(7), 100)));
        const all = Promise.all([1, 2, 3].map(() => swrCached('k', { fresh: 60 }, loader)));
        await vi.advanceTimersByTimeAsync(100);
        expect(await all).toEqual([7, 7, 7]);
        expect(loader).toHaveBeenCalledTimes(1);
    });

    it('returns null (not a throw) when the loader fails', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        expect(await swrCached('k', { fresh: 60 }, async () => { throw new Error('boom'); })).toBeNull();
    });

    it('defaults the stale window to max(4×fresh, 1h), capped at 7 days', () => {
        expect(defaultStaleSeconds(30)).toBe(3600);
        expect(defaultStaleSeconds(21_600)).toBe(86_400);
        expect(defaultStaleSeconds(86_400)).toBe(4 * 86_400);
        expect(defaultStaleSeconds(3 * 86_400)).toBe(7 * 86_400);
    });
});
