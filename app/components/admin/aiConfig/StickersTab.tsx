'use client';

import { MdAdd, MdDelete } from 'react-icons/md';
import { AiSticker } from '@/app/types/aiAssistant';
import { FeedbackBanner, SaveBar, SectionHeader, Toggle, useAiList } from './shared';

export default function StickersTab({ establishmentId }: { establishmentId: number | null }) {
  const { items, setItems, loading, saving, error, success, load, save } =
    useAiList<AiSticker>(establishmentId, 'ai-stickers');

  const updateItem = (index: number, patch: Partial<AiSticker>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { trigger: '', media_id: '', url: '', description: '', is_active: true },
    ]);

  if (loading) return <p className="text-sm text-zinc-400">Carregando figurinhas...</p>;

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="Figurinhas"
        description="Figurinhas/stickers que a assistente pode enviar e em quais situações. Use o ID de mídia da Meta ou uma URL pública."
      />

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="rounded-lg border border-dashed border-zinc-700 px-4 py-6 text-center text-sm text-zinc-500">
            Nenhuma figurinha cadastrada.
          </p>
        )}
        {items.map((sticker, index) => (
          <div key={index} className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <input
                type="text"
                value={sticker.trigger}
                onChange={(e) => updateItem(index, { trigger: e.target.value })}
                placeholder="Quando enviar (ex.: comemoração, aniversário)"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <Toggle checked={sticker.is_active} onChange={(v) => updateItem(index, { is_active: v })} />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded p-1.5 text-red-400 hover:text-red-300"
                  aria-label="Remover figurinha"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={sticker.media_id}
                onChange={(e) => updateItem(index, { media_id: e.target.value })}
                placeholder="Media ID (Meta)"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <input
                type="url"
                value={sticker.url}
                onChange={(e) => updateItem(index, { url: e.target.value })}
                placeholder="ou URL pública (.webp)"
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <input
              type="text"
              value={sticker.description}
              onChange={(e) => updateItem(index, { description: e.target.value })}
              placeholder="Descrição (opcional)"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        <MdAdd size={16} />
        Adicionar figurinha
      </button>

      <SaveBar onSave={save} onReset={load} saving={saving} disabled={establishmentId === null} />
    </div>
  );
}
