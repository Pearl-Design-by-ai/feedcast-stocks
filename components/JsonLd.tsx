/**
 * Renders a JSON-LD structured-data block. Server-component friendly; the JSON
 * is trusted (we build it ourselves), so dangerouslySetInnerHTML is safe here.
 * Use for Article / ItemList / BreadcrumbList schema to earn rich results.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
    return (
        <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}
