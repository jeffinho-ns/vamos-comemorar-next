'use client';

import { useState } from 'react';
import { MdClose } from 'react-icons/md';
import { AiFollowUpCategory, AiFollowUpConfig } from '@/app/types/aiAssistant';
import { useAiSettings } from './useAiSettings';
import { FeedbackBanner, INPUT_CLASS, SaveBar, SectionHeader, Toggle } from './shared';

const CATEGORIES: { value: AiFollowUpCategory; label: string; placeholder: string }[] = [
  { value: 'reservas', label: 'Reservas', placeholder: 'Ex.: Reservas de mesa para até 6 pessoas' },
  { value: 'cardapio', label: 'Cardápio', placeholder: 'Instrução opcional...' },
  { value: 'eventos', label: 'Eventos', placeholder: 'Instrução opcional...' },
  { value: 'fila', label: 'Fila', placeholder: 'Instrução opcional...' },
  { value: 'saudacoes', label: 'Saudações', placeholder: 'Instrução opcional...' },
  { value: 'informacoes', label: 'Informações gerais', placeholder: 'Instrução opcional...' },
];

export default function FollowUpTab({ establishmentId }: { establishmentId: number | null }) {
  const { settings, setSettings, loading, saving, error, success, load, save } =
    useAiSettings(establishmentId);
  const [newInterval, setNewInterval] = useState('');

  const cfg: AiFollowUpConfig = settings.follow_up_config || {};
  const intervals = Array.isArray(cfg.intervals) ? cfg.intervals : [];
  const categories = cfg.categories || {};

  const patchConfig = (patch: Partial<AiFollowUpConfig>) =>
    setSettings((prev) => ({ ...prev, follow_up_config: { ...prev.follow_up_config, ...patch } }));

  const addInterval = () => {
    const minutes = parseInt(newInterval, 10);
    if (!Number.isFinite(minutes) || minutes <= 0) return;
    if (intervals.includes(minutes) || intervals.length >= 5) return;
    patchConfig({ intervals: [...intervals, minutes].sort((a, b) => a - b) });
    setNewInterval('');
  };

  const removeInterval = (minutes: number) =>
    patchConfig({ intervals: intervals.filter((m) => m !== minutes) });

  const setCategory = (key: AiFollowUpCategory, patch: { enabled?: boolean; instruction?: string }) => {
    const current = categories[key] || { enabled: false, instruction: '' };
    patchConfig({ categories: { ...categories, [key]: { ...current, ...patch } } });
  };

  if (loading) return <p className="text-sm text-gray-500">Carregando configurações...</p>;

  return (
    <div className="space-y-8">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="Follow-up"
        description="Reativa conversas paradas — quando insistir e quando deixar quieto."
      />

      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">Habilitar follow-up automático</p>
          <p className="text-xs text-gray-500">Quando ligado, a IA pode retomar conversas sem resposta do cliente.</p>
        </div>
        <Toggle checked={Boolean(cfg.enabled)} onChange={(v) => patchConfig({ enabled: v })} />
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-gray-800">Quando enviar</h4>
        <p className="mb-3 text-xs text-gray-500">
          Até 5 intervalos (em minutos) depois da última mensagem do cliente.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {intervals.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-700 ring-1 ring-amber-200"
            >
              {m} min
              <button type="button" onClick={() => removeInterval(m)} aria-label="Remover intervalo">
                <MdClose size={14} />
              </button>
            </span>
          ))}
          {intervals.length < 5 && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addInterval();
                  }
                }}
                placeholder="0"
                className={`${INPUT_CLASS} w-24`}
              />
              <button
                type="button"
                onClick={addInterval}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
              >
                +
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-gray-800">Por categoria</h4>
        <p className="mb-3 text-xs text-gray-500">
          Ligue o follow-up por assunto e, se quiser, dê instruções personalizadas.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORIES.map((cat) => {
            const setting = categories[cat.value] || { enabled: false, instruction: '' };
            return (
              <div key={cat.value} className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{cat.label}</span>
                  <Toggle
                    checked={Boolean(setting.enabled)}
                    onChange={(v) => setCategory(cat.value, { enabled: v })}
                  />
                </div>
                <textarea
                  value={setting.instruction || ''}
                  onChange={(e) => setCategory(cat.value, { instruction: e.target.value })}
                  rows={3}
                  placeholder={cat.placeholder}
                  className={INPUT_CLASS}
                />
              </div>
            );
          })}
        </div>
      </div>

      <SaveBar onSave={save} onReset={load} saving={saving} disabled={establishmentId === null} />
    </div>
  );
}
