/**
 * Renders a JSON-LD structured-data block. We build the JSON ourselves, but it
 * can carry external strings (company names, headlines), and JSON.stringify does
 * NOT escape `<`, so a value containing `</script>` could break out of the tag.
 * Escape the script-sensitive characters to keep this injection-safe regardless
 * of what ends up in `data`.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
    const json = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
    return (
        <script
            type="application/ld+json"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: json }}
        />
    );
}
