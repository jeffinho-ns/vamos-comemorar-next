'use client';

import { useCallback, useEffect, useState } from 'react';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { EstablishmentInfo } from '@/app/types/aiAssistant';
import { FeedbackBanner, SectionHeader, getApiBaseUrl, getAuthHeaders } from './shared';

const CATEGORIES = [
  { value: 'geral', label: 'Geral' },
  { value: 'evento', label: 'Evento' },
  { value: 'reserva', label: 'Reserva' },
  { value: 'cardapio', label: 'Cardápio' },
  { value: 'fila', label: 'Fila' },
];

const FILTERS = [{ value: 'todas', label: 'Todas' }, ...CATEGORIES];

const CATEGORY_BADGE: Record<string, string> = {
  geral: 'bg-zinc-600/40 text-zinc-200',
  evento: 'bg-fuchsia-500/20 text-fuchsia-300',
  reserva: 'bg-emerald-500/20 text-emerald-300',
  cardapio: 'bg-amber-500/20 text-amber-300',
  fila: 'bg-sky-500/20 text-sky-300',
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
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-500"
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
                ? 'bg-purple-500/20 text-purple-200 ring-1 ring-purple-500/40'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700/60'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="rounded-xl border border-purple-500/30 bg-zinc-800/50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="text"
              value={form.topic}
              onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
              placeholder="Título (ex.: Estacionamento)"
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
            className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setForm(EMPTY_FORM);
              }}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Carregando informações...</p>
      ) : visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-700 px-4 py-8 text-center text-sm text-zinc-500">
          Nenhuma informação nesta categoria. Clique em &quot;Adicionar&quot; para cadastrar.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((info) => (
            <div key={info.id} className="flex flex-col rounded-xl border border-zinc-700 bg-zinc-800/40 p-4">
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
                    className="rounded p-1 text-zinc-400 hover:text-white"
                    aria-label="Editar"
                  >
                    <MdEdit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(info.id)}
                    className="rounded p-1 text-red-400 hover:text-red-300"
                    aria-label="Remover"
                  >
                    <MdDelete size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-zinc-100">{info.topic}</p>
              <p className="mt-1 line-clamp-4 text-xs text-zinc-400">{info.answer}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
