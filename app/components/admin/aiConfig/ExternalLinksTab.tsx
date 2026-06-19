'use client';

import { useEffect } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { AiExternalLink } from '@/app/types/aiAssistant';
import { FeedbackBanner, SaveBar, SectionHeader, Toggle, useAiList } from './shared';

const DEFAULT_LINKS: AiExternalLink[] = [
  { link_key: 'cardapio', title: 'Cardápio Digital', url: '', description: 'Cardápio completo com fotos e descrição', is_active: true },
  { link_key: 'reservas', title: 'Reservas de Mesa', url: '', description: 'Link para reservas de mesa online', is_active: true },
  { link_key: 'fila', title: 'Fila Virtual', url: '', description: 'Sistema de gerenciamento de filas', is_active: true },
  { link_key: 'crm', title: 'CRM', url: '', description: 'Sistema de gerenciamento de clientes', is_active: true },
];

export default function ExternalLinksTab({ establishmentId }: { establishmentId: number | null }) {
  const { items, setItems, loading, saving, error, success, load, save } =
    useAiList<AiExternalLink>(establishmentId, 'ai-external-links');

  useEffect(() => {
    if (!loading && items.length === 0) {
      setItems(DEFAULT_LINKS.map((l) => ({ ...l })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const updateItem = (index: number, patch: Partial<AiExternalLink>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { link_key: 'custom', title: '', url: '', description: '', is_active: true },
    ]);

  if (loading) return <p className="text-sm text-zinc-400">Carregando links...</p>;

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="Links externos"
        description="URLs que a assistente envia para cardápio, fila, reserva ou CRM."
      />

      <div className="space-y-3">
        {items.map((link, index) => (
          <div key={index} className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <input
                type="text"
                value={link.title}
                onChange={(e) => updateItem(index, { title: e.target.value })}
                placeholder="Título (ex.: Cardápio Digital)"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex items-center gap-2">
                <Toggle checked={link.is_active} onChange={(v) => updateItem(index, { is_active: v })} />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="rounded p-1.5 text-red-400 hover:text-red-300"
                  aria-label="Remover link"
                >
                  <MdDelete size={18} />
                </button>
              </div>
            </div>
            <input
              type="url"
              value={link.url}
              onChange={(e) => updateItem(index, { url: e.target.value })}
              placeholder="https://..."
              className="mb-2 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              value={link.description}
              onChange={(e) => updateItem(index, { description: e.target.value })}
              placeholder="Descrição curta"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
        Adicionar link
      </button>

      <SaveBar onSave={save} onReset={load} saving={saving} disabled={establishmentId === null} />
    </div>
  );
}
