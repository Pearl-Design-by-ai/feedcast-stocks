import { fetchDailyClosesMap } from '@/lib/actions/returns.actions';
import { computePeriodReturns, EMPTY_RETURNS } from '@/lib/returns-math';
import SymbolGroupTableClient from '@/components/markets/SymbolGroupTableClient';

/**
 * A group of symbols as a multi-period returns table — one batched closes
 * round-trip for the whole group, server-computed, then handed to the client
 * table (row click = peek sheet over the list, symbol link = full page).
 * Used by the ETF Hub and Stock Hub directories; stream via Suspense. Rows
 * fall back to em-dashes when the data seam is unreachable, so the directory
 * itself always renders.
 */
export default async function SymbolGroupTable({
    rows,
    nameLabel = 'Name',
}: {
    rows: Array<{ symbol: string; name: string }>;
    nameLabel?: string;
}) {
    const closes = await fetchDailyClosesMap(rows.map((r) => r.symbol));
    const withReturns = rows.map((row) => ({
        ...row,
        returns: closes.has(row.symbol)
            ? computePeriodReturns(closes.get(row.symbol)!)
            : EMPTY_RETURNS,
    }));
    return <SymbolGroupTableClient rows={withReturns} nameLabel={nameLabel} />;
}
