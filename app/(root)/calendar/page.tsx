import type { Metadata } from 'next';
import AiCommentary from "@/components/ai/AiCommentary";
import Link from 'next/link';
import DataDisclaimer from '@/components/DataDisclaimer';
import { getEarningsCalendar, getIpoCalendar } from '@/lib/actions/calendar.actions';

export const metadata: Metadata = {
    title: 'Earnings & IPO',
    description: 'Upcoming earnings reports and IPOs.',
};

const HOUR_LABEL: Record<string, string> = {
    bmo: 'Before open',
    amc: 'After close',
    dmh: 'Market hours',
};

function fmtDate(d: string): string {
    const date = new Date(`${d}T00:00:00`);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default async function CalendarPage() {
    const [earnings, ipos] = await Promise.all([getEarningsCalendar(14), getIpoCalendar(30)]);
    // Focus on analyst-covered names to cut noise, cap the list.
    const covered = earnings.filter((e) => e.epsEstimate != null).slice(0, 60);

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl font-bold text-gray-100">Earnings &amp; IPO</h1>
                    <p className="max-w-3xl text-sm text-gray-400">
                        Upcoming earnings reports (next 2 weeks, analyst-covered names) and IPOs
                        (recent &amp; upcoming).
                    </p>
                </div>
                <DataDisclaimer className="w-fit" />
            </header>
            <AiCommentary />

            {/* Earnings */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">Upcoming Earnings</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/40">
                    {covered.length ? (
                        <table className="w-full text-sm">
                            <thead className="text-gray-400">
                                <tr className="border-b border-gray-800 text-left">
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Symbol</th>
                                    <th className="px-4 py-3 font-medium">When</th>
                                    <th className="px-4 py-3 text-right font-medium">EPS est.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {covered.map((e, i) => (
                                    <tr
                                        key={`${e.symbol}-${e.date}-${i}`}
                                        className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-400">{fmtDate(e.date)}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-100">
                                            <Link href={`/stocks/${e.symbol}`} className="hover:text-teal-400">
                                                {e.symbol}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400">{HOUR_LABEL[e.hour] ?? '—'}</td>
                                        <td className="px-4 py-3 text-right text-gray-300">
                                            {e.epsEstimate != null ? e.epsEstimate.toFixed(2) : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="px-4 py-6 text-sm text-gray-500">No upcoming earnings available right now.</p>
                    )}
                </div>
            </section>

            {/* IPOs */}
            <section className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-gray-100">IPOs</h2>
                <div className="overflow-x-auto rounded-xl border border-gray-800 bg-gray-900/40">
                    {ipos.length ? (
                        <table className="w-full text-sm">
                            <thead className="text-gray-400">
                                <tr className="border-b border-gray-800 text-left">
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Symbol</th>
                                    <th className="px-4 py-3 font-medium">Company</th>
                                    <th className="px-4 py-3 font-medium">Exchange</th>
                                    <th className="px-4 py-3 text-right font-medium">Price</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ipos.map((ipo, i) => (
                                    <tr
                                        key={`${ipo.symbol}-${ipo.date}-${i}`}
                                        className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-400">{fmtDate(ipo.date)}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-100">{ipo.symbol || '—'}</td>
                                        <td className="px-4 py-3 text-gray-300">{ipo.name || '—'}</td>
                                        <td className="px-4 py-3 text-gray-400">{ipo.exchange || '—'}</td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-gray-300">
                                            {ipo.price ? `$${ipo.price}` : '—'}
                                        </td>
                                        <td className="px-4 py-3 capitalize text-gray-400">{ipo.status || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="px-4 py-6 text-sm text-gray-500">No IPOs in this window.</p>
                    )}
                </div>
            </section>
        </div>
    );
}
