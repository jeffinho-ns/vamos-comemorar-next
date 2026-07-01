'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MdAdd, MdDelete, MdImage, MdSave, MdSwapHoriz } from 'react-icons/md';
import { FeedbackBanner, INPUT_CLASS, SectionHeader, Toggle, getApiBaseUrl } from './shared';

type TriggerEvent = 'reserva_criada' | 'reserva_cancelada' | 'pos_visita';

type Flyer = {
  id: number;
  trigger_event: TriggerEvent;
  title: string;
  caption: string;
  media_url: string;
  delay_hours: number;
  is_active: boolean;
};

const EVENTS: { value: TriggerEvent; label: string; hint: string }[] = [
  {
    value: 'reserva_criada',
    label: 'Reserva criada',
    hint: 'Enviado logo após o cliente fazer a reserva.',
  },
  {
    value: 'reserva_cancelada',
    label: 'Reserva cancelada',
    hint: 'Enviado quando a reserva é cancelada.',
  },
  {
    value: 'pos_visita',
    label: 'Pós-visita (satisfação)',
    hint: 'Enviado algumas horas após o horário da reserva, para pesquisa de satisfação.',
  },
];

const EVENT_BADGE: Record<TriggerEvent, string> = {
  reserva_criada: 'bg-emerald-100 text-emerald-700',
  reserva_cancelada: 'bg-red-100 text-red-700',
  pos_visita: 'bg-sky-100 text-sky-700',
};

function tokenHeader(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function eventLabel(value: string) {
  return EVENTS.find((e) => e.value === value)?.label || value;
}

export default function FlyersTab({ establishmentId }: { establishmentId: number | null }) {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<TriggerEvent>('reserva_criada');
  const [newTitle, setNewTitle] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newDelay, setNewDelay] = useState(24);
  const [newFile, setNewFile] = useState<File | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetRef = useRef<number | null>(null);

  const baseUrl = useCallback(
    () => `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/ai-flyers`,
    [establishmentId],
  );

  const load = useCallback(async () => {
    if (establishmentId === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(baseUrl(), { headers: tokenHeader() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao carregar.');
      setFlyers(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [establishmentId, baseUrl]);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setNewEvent('reserva_criada');
    setNewTitle('');
    setNewCaption('');
    setNewDelay(24);
    setNewFile(null);
    setShowForm(false);
  };

  const handleCreate = async () => {
    if (establishmentId === null) return;
    if (!newFile) {
      setError('Selecione a imagem do flyer.');
      return;
    }
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('image', newFile);
      form.append('trigger_event', newEvent);
      form.append('title', newTitle.trim());
      form.append('caption', newCaption.trim());
      form.append('delay_hours', String(newEvent === 'pos_visita' ? newDelay : 0));
      const res = await fetch(baseUrl(), { method: 'POST', headers: tokenHeader(), body: form });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao criar flyer.');
      resetForm();
      setSuccess('Flyer criado com sucesso.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar flyer.');
    } finally {
      setBusy(false);
    }
  };

  const patchLocal = (id: number, patch: Partial<Flyer>) =>
    setFlyers((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const handleSave = async (flyer: Flyer) => {
    if (establishmentId === null) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append('trigger_event', flyer.trigger_event);
      form.append('title', flyer.title || '');
      form.append('caption', flyer.caption || '');
      form.append('delay_hours', String(flyer.trigger_event === 'pos_visita' ? flyer.delay_hours : 0));
      form.append('is_active', String(flyer.is_active));
      const res = await fetch(`${baseUrl()}/${flyer.id}`, {
        method: 'PUT',
        headers: tokenHeader(),
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao salvar.');
      setSuccess('Flyer atualizado.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (establishmentId === null) return;
    if (!window.confirm('Remover este flyer?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${baseUrl()}/${id}`, { method: 'DELETE', headers: tokenHeader() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao remover.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.');
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceImage = async (id: number, file: File) => {
    if (establishmentId === null) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('image', file);
      const res = await fetch(`${baseUrl()}/${id}`, {
        method: 'PUT',
        headers: tokenHeader(),
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao trocar imagem.');
      setSuccess('Imagem do flyer atualizada.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao trocar imagem.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Carregando flyers...</p>;

  return (
    <div className="space-y-6">
      <FeedbackBanner error={error} success={success} />
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title="Flyers automáticos"
          description="Suba a arte e a IA envia automaticamente no evento escolhido: ao criar a reserva, ao cancelar ou para pesquisa de satisfação após a visita."
        />
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <MdAdd size={16} />
          Novo flyer
        </button>
      </div>

      {/* input oculto para troca de imagem de um flyer existente */}
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          const target = replaceTargetRef.current;
          if (f && target != null) handleReplaceImage(target, f);
          if (replaceInputRef.current) replaceInputRef.current.value = '';
        }}
      />

      {showForm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Evento de disparo</label>
              <select
                value={newEvent}
                onChange={(e) => setNewEvent(e.target.value as TriggerEvent)}
                className={INPUT_CLASS}
              >
                {EVENTS.map((ev) => (
                  <option key={ev.value} value={ev.value}>
                    {ev.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-gray-400">
                {EVENTS.find((e) => e.value === newEvent)?.hint}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Título interno (opcional)</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex.: Flyer boas-vindas"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {newEvent === 'pos_visita' && (
            <div className="max-w-xs">
              <label className="mb-1 block text-xs text-gray-500">Enviar quantas horas após a reserva</label>
              <input
                type="number"
                min={1}
                value={newDelay}
                onChange={(e) => setNewDelay(Math.max(1, Number(e.target.value) || 1))}
                className={INPUT_CLASS}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs text-gray-500">Legenda (texto enviado junto)</label>
            <textarea
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              rows={3}
              placeholder="Ex.: Sua reserva está confirmada! 🎉 Te esperamos."
              className={INPUT_CLASS}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
              <MdImage size={16} />
              {newFile ? 'Trocar imagem' : 'Escolher imagem'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
              />
            </label>
            {newFile && <span className="text-xs text-gray-500">{newFile.name}</span>}
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy || !newFile}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                <MdSave size={16} />
                {busy ? 'Salvando...' : 'Criar flyer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {flyers.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
          Nenhum flyer cadastrado. Clique em &quot;Novo flyer&quot; para adicionar.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {flyers.map((flyer) => (
            <div key={flyer.id} className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="shrink-0">
                {flyer.media_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={flyer.media_url}
                    alt={flyer.title || 'Flyer'}
                    className="h-28 w-28 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <MdImage size={28} />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    replaceTargetRef.current = flyer.id;
                    replaceInputRef.current?.click();
                  }}
                  className="mt-2 inline-flex w-28 items-center justify-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                >
                  <MdSwapHoriz size={14} />
                  Trocar
                </button>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${EVENT_BADGE[flyer.trigger_event]}`}
                  >
                    {eventLabel(flyer.trigger_event)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Toggle
                      checked={flyer.is_active}
                      onChange={(v) => patchLocal(flyer.id, { is_active: v })}
                    />
                    <button
                      type="button"
                      onClick={() => handleDelete(flyer.id)}
                      className="rounded p-1 text-red-500 hover:text-red-600"
                      aria-label="Remover flyer"
                    >
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>

                <select
                  value={flyer.trigger_event}
                  onChange={(e) => patchLocal(flyer.id, { trigger_event: e.target.value as TriggerEvent })}
                  className={INPUT_CLASS}
                >
                  {EVENTS.map((ev) => (
                    <option key={ev.value} value={ev.value}>
                      {ev.label}
                    </option>
                  ))}
                </select>

                {flyer.trigger_event === 'pos_visita' && (
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">Horas após a reserva</label>
                    <input
                      type="number"
                      min={1}
                      value={flyer.delay_hours}
                      onChange={(e) =>
                        patchLocal(flyer.id, { delay_hours: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                )}

                <textarea
                  value={flyer.caption}
                  onChange={(e) => patchLocal(flyer.id, { caption: e.target.value })}
                  rows={2}
                  placeholder="Legenda enviada junto com a imagem"
                  className={INPUT_CLASS}
                />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSave(flyer)}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <MdSave size={14} />
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
