'use client';

import { useCallback, useEffect } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';
import { AiChannel, AiIceBreaker } from '@/app/types/aiAssistant';
import { useAiSettings } from './useAiSettings';
import { FeedbackBanner, SaveBar, SectionHeader, Toggle, useAiList } from './shared';

const DEFAULT_ICE_BREAKERS: AiIceBreaker[] = [
  { channel: 'whatsapp', label: 'Reserva', question: 'Quero fazer uma reserva', is_active: true },
  { channel: 'whatsapp', label: 'Cardápio', question: 'Quero ver o cardápio', is_active: true },
  { channel: 'whatsapp', label: 'Localização', question: 'Como faço para chegar aí?', is_active: true },
];

const CHANNELS: { value: AiChannel; label: string }[] = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
];

export default function IceBreakersTab({ establishmentId }: { establishmentId: number | null }) {
  const settingsState = useAiSettings(establishmentId);
  const listState = useAiList<AiIceBreaker>(establishmentId, 'ai-ice-breakers');

  const { settings, setSettings } = settingsState;
  const { items, setItems } = listState;

  useEffect(() => {
    if (!listState.loading && items.length === 0) {
      setItems(DEFAULT_ICE_BREAKERS.map((q) => ({ ...q })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listState.loading]);

  const channels = settings.ice_breakers_channels || ['whatsapp'];
  const toggleChannel = (channel: AiChannel) => {
    const next = channels.includes(channel)
      ? channels.filter((c) => c !== channel)
      : [...channels, channel];
    setSettings((prev) => ({ ...prev, ice_breakers_channels: next.length ? next : ['whatsapp'] }));
  };

  const updateItem = (index: number, patch: Partial<AiIceBreaker>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));
  const addItem = () =>
    setItems((prev) => [...prev, { channel: 'whatsapp', label: '', question: '', is_active: true }]);

  const save = useCallback(async () => {
    await settingsState.save();
    await listState.save();
  }, [settingsState, listState]);

  const reset = useCallback(async () => {
    await settingsState.load();
    await listState.load();
  }, [settingsState, listState]);

  if (settingsState.loading || listState.loading)
    return <p className="text-sm text-zinc-400">Carregando quebra-gelos...</p>;

  return (
    <div className="space-y-6">
      <FeedbackBanner error={settingsState.error || listState.error} success={listState.success} />
      <SectionHeader
        title="Quebra-gelos"
        description="Mensagens iniciais sugeridas que o cliente pode tocar para começar a conversa."
      />

      <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-100">Ativar quebra-gelos</p>
          <p className="text-xs text-zinc-400">Desligue se preferir que o cliente entre direto no chat.</p>
        </div>
        <Toggle
          checked={settings.ice_breakers_enabled}
          onChange={(v) => setSettings((prev) => ({ ...prev, ice_breakers_enabled: v }))}
        />
      </div>

      <div>
        <p className="mb-2 text-xs text-zinc-400">Canais ativos</p>
        <div className="flex gap-2">
          {CHANNELS.map((ch) => {
            const active = channels.includes(ch.value);
            return (
              <button
                key={ch.value}
                type="button"
                onClick={() => toggleChannel(ch.value)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  active
                    ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60'
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {items.map((q, index) => (
          <div key={index} className="rounded-xl border border-zinc-700 bg-zinc-800/40 p-3">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                {index + 1}
              </span>
              <input
                type="text"
                value={q.label}
                onChange={(e) => updateItem(index, { label: e.target.value })}
                placeholder="Rótulo (ex.: Reserva)"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <select
                value={q.channel}
                onChange={(e) => updateItem(index, { channel: e.target.value as AiChannel })}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {CHANNELS.map((ch) => (
                  <option key={ch.value} value={ch.value}>
                    {ch.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="rounded p-1.5 text-red-400 hover:text-red-300"
                aria-label="Remover pergunta"
              >
                <MdDelete size={18} />
              </button>
            </div>
            <input
              type="text"
              value={q.question}
              maxLength={160}
              onChange={(e) => updateItem(index, { question: e.target.value })}
              placeholder="Pergunta que o cliente vê (ex.: Quero fazer uma reserva)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="mt-1 text-right text-[11px] text-zinc-500">{q.question.length} / 160</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addItem}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
      >
        <MdAdd size={16} />
        Adicionar quebra-gelo
      </button>

      <SaveBar
        onSave={save}
        onReset={reset}
        saving={settingsState.saving || listState.saving}
        disabled={establishmentId === null}
      />
    </div>
  );
}
