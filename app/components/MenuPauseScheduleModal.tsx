'use client';

import { useEffect, useMemo, useState } from 'react';
import { MdAdd, MdClose, MdPause, MdSchedule } from 'react-icons/md';

export type PauseWindowDraft = {
  weekdays: number[];
  startTime: string;
  endTime: string;
};

export type MenuPauseApplyMode = 'permanent' | 'scheduled';

type MenuPauseScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
  scopeLabel: string;
  initialMode?: MenuPauseApplyMode;
  onConfirm: (payload: { mode: MenuPauseApplyMode; windows: PauseWindowDraft[] }) => Promise<void>;
};

const WEEKDAYS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

const PRESETS: Array<{ id: string; label: string; weekdays: number[] }> = [
  { id: 'all', label: 'Todos os dias', weekdays: [0, 1, 2, 3, 4, 5, 6] },
  { id: 'mon-sat', label: 'Seg a Sáb', weekdays: [1, 2, 3, 4, 5, 6] },
  { id: 'mon-fri', label: 'Seg a Sex', weekdays: [1, 2, 3, 4, 5] },
  { id: 'weekend', label: 'Sáb e Dom', weekdays: [0, 6] },
];

function emptyWindow(): PauseWindowDraft {
  return { weekdays: [1, 2, 3, 4, 5, 6], startTime: '12:00', endTime: '15:00' };
}

export default function MenuPauseScheduleModal({
  isOpen,
  onClose,
  itemCount,
  scopeLabel,
  initialMode = 'scheduled',
  onConfirm,
}: MenuPauseScheduleModalProps) {
  const [mode, setMode] = useState<MenuPauseApplyMode>(initialMode);
  const [windows, setWindows] = useState<PauseWindowDraft[]>([emptyWindow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setWindows([emptyWindow()]);
    setError(null);
    setSaving(false);
  }, [isOpen, initialMode]);

  const canSubmitScheduled = useMemo(
    () =>
      windows.every(
        (w) =>
          w.weekdays.length > 0 &&
          w.startTime &&
          w.endTime &&
          w.startTime !== w.endTime,
      ),
    [windows],
  );

  if (!isOpen) return null;

  const toggleWeekday = (windowIndex: number, day: number) => {
    setWindows((prev) =>
      prev.map((w, idx) => {
        if (idx !== windowIndex) return w;
        const has = w.weekdays.includes(day);
        const weekdays = has
          ? w.weekdays.filter((d) => d !== day)
          : [...w.weekdays, day].sort((a, b) => a - b);
        return { ...w, weekdays };
      }),
    );
  };

  const applyPreset = (windowIndex: number, weekdays: number[]) => {
    setWindows((prev) =>
      prev.map((w, idx) => (idx === windowIndex ? { ...w, weekdays: [...weekdays] } : w)),
    );
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);
    try {
      if (mode === 'scheduled' && !canSubmitScheduled) {
        setError('Configure ao menos um período com dias e horários válidos.');
        return;
      }
      await onConfirm({
        mode,
        windows: mode === 'scheduled' ? windows : [],
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível aplicar a pausa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Pausar itens</h2>
            <p className="text-sm text-gray-500">
              {itemCount} item{itemCount !== 1 ? 's' : ''} · {scopeLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="Fechar"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-gray-600">
            A pausa por horário vale para <strong>todos os clientes</strong> no cardápio público
            (fuso America/Sao_Paulo).
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode('permanent')}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                mode === 'permanent'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MdPause className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
              <div>
                <div className="font-medium text-gray-900">Pausar agora</div>
                <div className="text-xs text-gray-500">
                  Oculta até você ativar de novo (como hoje).
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setMode('scheduled')}
              className={`flex items-start gap-3 rounded-lg border p-3 text-left transition ${
                mode === 'scheduled'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <MdSchedule className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
              <div>
                <div className="font-medium text-gray-900">Pausar por período</div>
                <div className="text-xs text-gray-500">
                  Dias da semana + horário (ex.: almoço de terça).
                </div>
              </div>
            </button>
          </div>

          {mode === 'scheduled' && (
            <div className="space-y-4">
              {windows.map((window, index) => (
                <div
                  key={`window-${index}`}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">
                      Período {index + 1}
                    </span>
                    {windows.length > 1 && (
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:underline"
                        onClick={() =>
                          setWindows((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(index, preset.weekdays)}
                        className="rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-100"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((day) => (
                      <label
                        key={day.value}
                        className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${
                          window.weekdays.includes(day.value)
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-300 bg-white text-gray-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={window.weekdays.includes(day.value)}
                          onChange={() => toggleWeekday(index, day.value)}
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-medium text-gray-600">
                      Das
                      <input
                        type="time"
                        value={window.startTime}
                        onChange={(e) =>
                          setWindows((prev) =>
                            prev.map((w, i) =>
                              i === index ? { ...w, startTime: e.target.value } : w,
                            ),
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block text-xs font-medium text-gray-600">
                      Até
                      <input
                        type="time"
                        value={window.endTime}
                        onChange={(e) =>
                          setWindows((prev) =>
                            prev.map((w, i) =>
                              i === index ? { ...w, endTime: e.target.value } : w,
                            ),
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </label>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setWindows((prev) => [...prev, emptyWindow()])}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <MdAdd className="h-4 w-4" />
                Adicionar outro período
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || (mode === 'scheduled' && !canSubmitScheduled)}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
          >
            {saving ? 'Aplicando…' : mode === 'permanent' ? 'Pausar agora' : 'Salvar agenda'}
          </button>
        </div>
      </div>
    </div>
  );
}
