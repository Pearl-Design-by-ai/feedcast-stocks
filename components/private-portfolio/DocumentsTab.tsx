import { FileText } from 'lucide-react';
import { Card, CardTitle, EmptyState } from './ui';
import type { Plan } from '@/lib/private-portfolio/types';

/** Plan documents as plain text — Dropbox paths are shown, never linked. */
export default function DocumentsTab({ plans }: { plans: Plan[] }) {
    const withDocs = plans.filter((p) => p.documents?.length);
    if (!withDocs.length) return <EmptyState>Henüz belge eklenmedi.</EmptyState>;
    return (
        <div className="flex flex-col gap-4">
            {withDocs.map((p) => (
                <Card key={p.slug}>
                    <CardTitle>{p.title}</CardTitle>
                    <ul className="flex flex-col gap-2">
                        {p.documents!.map((d, i) => (
                            <li key={`${d.path}-${i}`} className="flex items-start gap-2.5 text-sm">
                                <FileText size={16} className="mt-0.5 shrink-0 text-gray-500" />
                                <div className="min-w-0">
                                    <p className="text-gray-200">{d.title}</p>
                                    <p className="break-all font-mono text-xs text-gray-500 select-all">{d.path}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            ))}
        </div>
    );
}
