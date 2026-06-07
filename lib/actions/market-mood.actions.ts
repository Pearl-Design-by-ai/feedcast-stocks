'use server';

/**
 * Live "Market Mood" data. The Crypto Fear & Greed Index from alternative.me is
 * free, key-less, and CORS-open; we fetch it server-side and cache it. CNN's
 * Fear & Greed has no official embed/API, so that stays a link-out.
 */

export interface CryptoFearGreed {
    value: number; // 0 (extreme fear) – 100 (extreme greed)
    classification: string; // e.g. "Fear", "Greed", "Extreme Greed"
}

export async function getCryptoFearGreed(): Promise<CryptoFearGreed | null> {
    try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1', {
            // Cache for 30 minutes — the index updates roughly daily.
            next: { revalidate: 1800 },
        });
        if (!res.ok) return null;

        const json = (await res.json()) as {
            data?: Array<{ value?: string; value_classification?: string }>;
        };
        const d = json.data?.[0];
        if (!d?.value) return null;

        const value = Number(d.value);
        if (Number.isNaN(value)) return null;

        return { value, classification: d.value_classification ?? '' };
    } catch {
        return null;
    }
}
