'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil } from 'lucide-react';
import DashboardEditor from '@/components/dashboard/DashboardEditor';
import type { DashboardLayout } from '@/lib/dashboard/catalog';

/**
 * Toggles between the server-rendered live dashboard (`view`, passed in so the
 * real widgets render on the server) and the client drag-and-drop editor. After
 * a save the editor persists to Supabase and we router.refresh() to re-render
 * the server view with the new layout.
 */
export default function DashboardShell({
  initialLayout,
  view,
}: {
  initialLayout: DashboardLayout;
  view: ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/60 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:border-teal-500/40 hover:text-teal-300"
          >
            <Pencil className="h-4 w-4" /> Customize
          </button>
        )}
      </div>

      {editing ? (
        <DashboardEditor
          initialLayout={initialLayout}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
          onCancel={() => setEditing(false)}
        />
      ) : (
        view
      )}
    </div>
  );
}
