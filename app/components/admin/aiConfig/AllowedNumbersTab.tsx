'use client';

import { useCallback, useState } from 'react';
import { MdAdd, MdDelete, MdInfoOutline } from 'react-icons/md';
import { AiAllowedNumber } from '@/app/types/aiAssistant';
import { useAiSettings } from './useAiSettings';
import { FeedbackBanner, INPUT_CLASS, SaveBar, SectionHeader, Toggle, useAiList } from './shared';

function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (d.length >= 12) {
    return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9, 13)}`;
  }
  return d;
}

export default function AllowedNumbersTab({ establishmentId }: { establishmentId: number | null }) {
  const settingsState = useAiSettings(establishmentId);
  const listState = useAiList<AiAllowedNumber>(establishmentId, 'ai-allowed-numbers');
  const { settings, setSettings } = settingsState;
  const { items, setItems } = listState;

  const [newPhone, setNewPhone] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const addNumber = () => {
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length < 10) return;
    if (items.some((n) => n.phone_e164.replace(/\D/g, '') === digits)) return;
    setItems((prev) => [...prev, { phone_e164: digits, label: newLabel.trim() }]);
    setNewPhone('');
    setNewLabel('');
  };

  const removeNumber = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const save = useCallback(async () => {
    await settingsState.save();
    await listState.save();
  }, [settingsState, listState]);

  const reset = useCallback(async () => {
    await settingsState.load();
    await listState.load();
  }, [settingsState, listState]);

  if (settingsState.loading || listState.loading)
    return <p className="text-sm text-gray-500">Carregando números...</p>;

  return (
    <div className="space-y-6">
      <FeedbackBanner error={settingsState.error || listState.error} success={listState.success} />
      <SectionHeader
        title="Números habilitados"
        description="Limite o atendimento da IA a um conjunto de números durante testes."
      />

      <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-900">IA ativada globalmente</p>
          <p className="text-xs text-gray-500">
            Quando desligada, apenas os números abaixo recebem resposta da IA.
          </p>
        </div>
        <Toggle
          checked={settings.ai_globally_enabled}
          onChange={(v) => setSettings((prev) => ({ ...prev, ai_globally_enabled: v }))}
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <MdInfoOutline size={18} className="mt-0.5 shrink-0" />
        <p>
          <strong>Como funciona:</strong> com a IA desativada globalmente, só os números desta lista terão
          acesso à IA. Útil para testar antes de liberar para todos.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">Lista de números ({items.length})</p>
        </div>
        <div className="space-y-2">
          {items.map((n, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{formatPhone(n.phone_e164)}</p>
                <p className="text-xs text-gray-500">{n.label || n.phone_e164.replace(/\D/g, '')}</p>
              </div>
              <button
                type="button"
                onClick={() => removeNumber(index)}
                className="rounded p-1.5 text-red-500 hover:text-red-600"
                aria-label="Remover número"
              >
                <MdDelete size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="tel"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Número com DDI/DDD (ex.: 5511984337670)"
            className={INPUT_CLASS}
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Rótulo (opcional)"
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={addNumber}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <MdAdd size={16} />
            Adicionar
          </button>
        </div>
      </div>

      <SaveBar
        onSave={save}
        onReset={reset}
        saving={settingsState.saving || listState.saving}
        disabled={establishmentId === null}
      />
    </div>
  );
}
