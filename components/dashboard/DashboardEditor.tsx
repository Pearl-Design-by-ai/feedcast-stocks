'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Plus, RotateCcw, Loader2, RectangleHorizontal, Square } from 'lucide-react';
import {
  CATALOG,
  MODULE_META,
  DEFAULT_LAYOUT,
  type DashboardLayout,
  type ModuleId,
  type Tile,
  type TileSpan,
  type ModuleCategory,
} from '@/lib/dashboard/catalog';
import { saveDashboardLayout } from '@/lib/actions/dashboard-layout.actions';

const CATEGORIES: ModuleCategory[] = ['TradingView', 'AI', 'Personal', 'Markets'];

function SortableTile({
  tile,
  onToggleSpan,
  onRemove,
}: {
  tile: Tile;
  onToggleSpan: (id: ModuleId) => void;
  onRemove: (id: ModuleId) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tile.id,
  });
  const meta = MODULE_META[tile.id];
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/50 px-3 py-2.5"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-gray-500 hover:text-gray-300 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-200">{meta.title}</p>
        <p className="truncate text-xs text-gray-500">{meta.description}</p>
      </div>
      <button
        type="button"
        onClick={() => onToggleSpan(tile.id)}
        title={tile.span === 'full' ? 'Full width — tap for half' : 'Half width — tap for full'}
        aria-label="Toggle width"
        className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
      >
        {tile.span === 'full' ? (
          <RectangleHorizontal className="h-4 w-4" />
        ) : (
          <Square className="h-4 w-4" />
        )}
        {tile.span === 'full' ? 'Full' : 'Half'}
      </button>
      <button
        type="button"
        onClick={() => onRemove(tile.id)}
        aria-label="Remove module"
        className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
      >
        <X className="h-4 w-4" />
      </button>
    </li>
  );
}

export default function DashboardEditor({
  initialLayout,
  onSaved,
  onCancel,
}: {
  initialLayout: DashboardLayout;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [tiles, setTiles] = useState<Tile[]>(initialLayout.tiles);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const usedIds = useMemo(() => new Set(tiles.map((t) => t.id)), [tiles]);
  const available = CATALOG.filter((m) => !usedIds.has(m.id));

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setTiles((prev) => {
      const from = prev.findIndex((t) => t.id === active.id);
      const to = prev.findIndex((t) => t.id === over.id);
      if (from < 0 || to < 0) return prev;
      return arrayMove(prev, from, to);
    });
  };

  const toggleSpan = (id: ModuleId) =>
    setTiles((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, span: (t.span === 'full' ? 'half' : 'full') as TileSpan } : t,
      ),
    );

  const remove = (id: ModuleId) => setTiles((prev) => prev.filter((t) => t.id !== id));

  const add = (id: ModuleId) =>
    setTiles((prev) =>
      prev.some((t) => t.id === id) ? prev : [...prev, { id, span: MODULE_META[id].defaultSpan }],
    );

  const save = async () => {
    setSaving(true);
    setError('');
    const res = await saveDashboardLayout({ tiles });
    setSaving(false);
    if (res.ok) onSaved();
    else setError(res.error || 'Could not save. Please try again.');
  };

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/30 p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-100">Customize your dashboard</p>
          <p className="text-xs text-gray-500">
            Drag to reorder, toggle width, remove, or add modules below.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTiles(DEFAULT_LAYOUT.tiles)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-colors hover:bg-gray-800/70 hover:text-gray-200"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-800/70"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-500 px-3.5 py-1.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-teal-400 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
          </button>
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-yellow-200/80">{error}</p>}

      {/* Active modules — sortable */}
      <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">On your dashboard</p>
      {tiles.length === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed border-gray-800 px-3 py-4 text-sm text-gray-500">
          No modules yet — add some from the library below.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={tiles.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <ul className="mb-5 flex flex-col gap-2">
              {tiles.map((t) => (
                <SortableTile key={t.id} tile={t} onToggleSpan={toggleSpan} onRemove={remove} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {/* Library — add modules */}
      <p className="mb-2 text-[11px] uppercase tracking-wide text-gray-500">Add modules</p>
      {available.length === 0 ? (
        <p className="text-sm text-gray-500">Every module is already on your dashboard.</p>
      ) : (
        <div className="space-y-3">
          {CATEGORIES.map((cat) => {
            const items = available.filter((m) => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-1.5 text-[11px] text-gray-500">{cat}</p>
                <div className="flex flex-wrap gap-2">
                  {items.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => add(m.id)}
                      title={m.description}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gray-800/50 px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-gray-700/60 hover:text-teal-200"
                    >
                      <Plus className="h-3.5 w-3.5" /> {m.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
