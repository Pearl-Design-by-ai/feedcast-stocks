/**
 * Site-wide legal disclaimer, pinned to the bottom of every page. The compact
 * <DataDisclaimer/> note at the top of each page anchors here (#disclaimer).
 *
 * Single source of truth for the full not-advice / AI-generated / delayed-data
 * statement — keep the long-form wording here only.
 */
export default function DisclaimerFooter() {
    return (
        <footer
            id="disclaimer"
            className="mt-12 scroll-mt-24 border-t border-gray-800/80"
        >
            <div className="mx-auto w-full max-w-[1400px] px-4 py-8 md:px-6 lg:px-8">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Disclaimer
                </h2>
                <p className="text-xs leading-relaxed text-gray-500">
                    Prices are <strong className="text-gray-400">delayed</strong> (typically
                    ~15 minutes) and shown for informational purposes only — not real-time.
                    Nothing on this site constitutes investment, financial, legal, or tax
                    advice, or a recommendation to buy or sell any security. A large portion of
                    this content is generated with the help of AI, which can produce inaccurate,
                    biased, or hallucinated information. All content is provided “as is” without
                    warranty; always verify important information against your own independent
                    sources, do your own research, and consult a licensed advisor before making
                    any investment decision.
                </p>
                <p className="mt-4 text-xs leading-relaxed text-gray-500">
                    This product is a blend of two projects: the open-source base — the market
                    data feeds and every core module we did not build ourselves — comes from{" "}
                    <a
                        href="https://github.com/Open-Dev-Society/OpenStock"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-gray-300"
                    >
                        OpenStock
                    </a>{" "}
                    by Open Dev Society (licensed under AGPL-3.0), and FeedCast adds its own
                    modules on top. Credit for the underlying platform and data belongs to
                    OpenStock.
                </p>
            </div>
        </footer>
    );
}
