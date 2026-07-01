'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { EstablishmentInfo } from '@/app/types/aiAssistant';
import { FeedbackBanner, INPUT_CLASS, SectionHeader, getApiBaseUrl, getAuthHeaders } from './shared';

const CATEGORIES = [
  { value: 'geral', label: 'Geral' },
  { value: 'evento', label: 'Evento' },
  { value: 'reserva', label: 'Reserva' },
  { value: 'cardapio', label: 'Cardápio' },
  { value: 'fila', label: 'Fila' },
];

const FILTERS = [{ value: 'todas', label: 'Todas' }, ...CATEGORIES];

const CATEGORY_BADGE: Record<string, string> = {
  geral: 'bg-gray-100 text-gray-600',
  evento: 'bg-fuchsia-100 text-fuchsia-700',
  reserva: 'bg-emerald-100 text-emerald-700',
  cardapio: 'bg-amber-100 text-amber-700',
  fila: 'bg-sky-100 text-sky-700',
};

type FormState = { id?: number; topic: string; answer: string; category: string };

const EMPTY_FORM: FormState = { topic: '', answer: '', category: 'geral' };

export default function InfoTab({ establishmentId }: { establishmentId: number | null }) {
  const [items, setItems] = useState<EstablishmentInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState('todas');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const baseUrl = () => `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/faqs`;

  const load = useCallback(async () => {
    if (establishmentId === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/faqs`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao carregar.');
      setItems(Array.isArray(json.data) ? json.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setShowForm(true);
    setSuccess(null);
  };

  const openEdit = (info: EstablishmentInfo) => {
    setForm({ id: info.id, topic: info.topic, answer: info.answer, category: info.category || 'geral' });
    setShowForm(true);
    setSuccess(null);
  };

  const handleSubmit = async () => {
    if (establishmentId === null) return;
    if (!form.topic.trim() || !form.answer.trim()) {
      setError('Informe um título e o conteúdo.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const isEdit = Boolean(form.id);
      const res = await fetch(isEdit ? `${baseUrl()}/${form.id}` : baseUrl(), {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ topic: form.topic, answer: form.answer, category: form.category }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao salvar.');
      setShowForm(false);
      setForm(EMPTY_FORM);
      setSuccess('Informação salva com sucesso.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (establishmentId === null || !id) return;
    if (!window.confirm('Remover esta informação?')) return;
    try {
      const res = await fetch(`${baseUrl()}/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao remover.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover.');
    }
  };

  const visible = filter === 'todas' ? items : items.filter((i) => (i.category || 'geral') === filter);

  return (
    <div className="space-y-5">
      <FeedbackBanner error={error} success={success} />
      <div className="flex items-start justify-between gap-3">
        <SectionHeader
          title="Informações adicionais"
          description="Fatos sobre o estabelecimento que a IA pode consultar (estacionamento, aniversário, delivery...)."
        />
        <button
          type="button"
          onClick={openNew}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          <MdAdd size={16} />
          Adicionar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              filter === f.value
                ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder="Título (ex.: Estacionamento)"
              className={INPUT_CLASS}
            />
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className={INPUT_CLASS}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={form.answer}
            onChange={(e) => setForm((p) => ({ ...p, answer: e.target.value }))}
            rows={4}
            placeholder="Conteúdo que a IA pode usar para responder..."
            className={`${INPUT_CLASS} mt-3`}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Carregando informações...</p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-400">
          Nenhuma informação nesta categoria. Clique em &quot;Adicionar&quot; para cadastrar.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((info) => (
            <div key={info.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    CATEGORY_BADGE[info.category || 'geral'] || CATEGORY_BADGE.geral
                  }`}
                >
                  {(info.category || 'geral').charAt(0).toUpperCase() + (info.category || 'geral').slice(1)}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(info)}
                    className="rounded p-1 text-gray-400 hover:text-gray-700"
                    aria-label="Editar"
                  >
                    <MdEdit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(info.id)}
                    className="rounded p-1 text-red-500 hover:text-red-600"
                    aria-label="Remover"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">{info.topic}</p>
              <p className="mt-1 line-clamp-4 text-xs text-gray-500">{info.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
