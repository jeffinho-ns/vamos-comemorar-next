'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdAdd, MdDelete, MdEdit } from 'react-icons/md';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';
import type { EstablishmentFaq, EstablishmentFaqPayload } from '@/app/types/establishmentFaq';

const TOPIC_SUGGESTIONS = [
  { value: 'estacionamento', label: 'Estacionamento' },
  { value: 'pets', label: 'Pets' },
  { value: 'musica', label: 'Música' },
  { value: 'cardapio', label: 'Cardápio' },
  { value: 'horario_funcionamento', label: 'Horário de funcionamento' },
  { value: 'dress_code', label: 'Dress code' },
  { value: 'aniversarios', label: 'Aniversários' },
  { value: 'areas', label: 'Áreas' },
];

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function formatTopicLabel(topic: string) {
  const match = TOPIC_SUGGESTIONS.find((item) => item.value === topic);
  if (match) return match.label;
  return topic.replace(/_/g, ' ');
}

type Props = {
  establishmentId: number;
};

export default function EstablishmentFaqSection({ establishmentId }: Props) {
  const { establishments } = useEstablishments();
  const establishmentPermissions = useEstablishmentPermissions();
  const [faqs, setFaqs] = useState<EstablishmentFaq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EstablishmentFaq | null>(null);
  const [form, setForm] = useState<EstablishmentFaqPayload>({ topic: '', answer: '' });

  const establishmentName = useMemo(() => {
    const match = establishments.find((item) => Number(item.id) === establishmentId);
    return match?.name || `Estabelecimento #${establishmentId}`;
  }, [establishments, establishmentId]);

  const canManage = useMemo(() => {
    if (establishmentPermissions.isRestrictedToSingleEstablishment()) {
      const allowed = establishmentPermissions.getFilteredEstablishments(establishments);
      return allowed.some((item) => Number(item.id) === establishmentId);
    }
    return true;
  }, [establishmentPermissions, establishments, establishmentId]);

  const fetchFaqs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/faqs`,
        { headers: getAuthHeaders() }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao carregar FAQs.');
      }
      setFaqs(Array.isArray(data.data) ? data.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar FAQs.');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  }, [establishmentId]);

  useEffect(() => {
    if (establishmentId > 0) fetchFaqs();
  }, [establishmentId, fetchFaqs]);

  const openCreate = () => {
    setEditing(null);
    setForm({ topic: '', answer: '' });
    setShowForm(true);
  };

  const openEdit = (faq: EstablishmentFaq) => {
    setEditing(faq);
    setForm({ topic: faq.topic, answer: faq.answer });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm({ topic: '', answer: '' });
    setShowForm(false);
  };

  const saveFaq = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: EstablishmentFaqPayload = {
        topic: form.topic.trim(),
        answer: form.answer.trim(),
      };
      const url = editing
        ? `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/faqs/${editing.id}`
        : `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/faqs`;
      const response = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao salvar FAQ.');
      }
      closeForm();
      await fetchFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar FAQ.');
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (faq: EstablishmentFaq) => {
    if (!confirm(`Remover a FAQ "${formatTopicLabel(faq.topic)}"?`)) return;
    setError(null);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/faqs/${faq.id}`,
        { method: 'DELETE', headers: getAuthHeaders() }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Falha ao remover FAQ.');
      }
      await fetchFaqs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao remover FAQ.');
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
        Você não tem permissão para editar a base de conhecimento deste estabelecimento.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Base de Conhecimento (FAQ)</h2>
          <p className="text-sm text-gray-600">
            Respostas usadas pela IA no WhatsApp para {establishmentName}.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
        >
          <MdAdd size={18} />
          Nova FAQ
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Carregando FAQs...
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tópico</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Resposta para a IA</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma FAQ cadastrada para este estabelecimento.
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {formatTopicLabel(faq.topic)}
                      <div className="text-xs text-gray-500">{faq.topic}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-pre-wrap">{faq.answer}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(faq)}
                        className="inline-flex p-2 text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <MdEdit size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFaq(faq)}
                        className="inline-flex p-2 text-red-600 hover:text-red-800"
                        title="Excluir"
                      >
                        <MdDelete size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editing ? 'Editar FAQ' : 'Nova FAQ'}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tópico / pergunta</label>
              <input
                list="faq-topic-suggestions"
                value={form.topic}
                onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))}
                placeholder="Ex.: estacionamento"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <datalist id="faq-topic-suggestions">
                {TOPIC_SUGGESTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resposta para a IA</label>
              <textarea
                value={form.answer}
                onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
                rows={5}
                placeholder="Texto que a IA deve usar ao responder no WhatsApp."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveFaq}
              disabled={saving || !form.topic.trim() || !form.answer.trim()}
              className="rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
