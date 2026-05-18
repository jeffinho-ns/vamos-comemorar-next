'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MdAdd, MdDelete, MdEdit, MdWarning } from 'react-icons/md';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';
import type { EstablishmentFaq, EstablishmentFaqPayload } from '@/app/types/establishmentFaq';
import {
  FAQ_TOPIC_TEMPLATES,
  formatFaqTopicLabel,
  getFaqTopicTemplate,
  LEGACY_FAQ_TOPIC_VALUES,
} from '@/app/types/faqTopics';

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';
}

function getAuthHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

const RECOMMENDED_TOPICS = [
  'dias_horarios_funcionamento',
  'valores_entrada',
  'beneficios_aniversario',
] as const;

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

  const faqTopicsSet = useMemo(() => new Set(faqs.map((f) => f.topic)), [faqs]);

  const missingRecommended = useMemo(
    () => RECOMMENDED_TOPICS.filter((topic) => !faqTopicsSet.has(topic)),
    [faqTopicsSet]
  );

  const legacyFaqs = useMemo(
    () => faqs.filter((faq) => LEGACY_FAQ_TOPIC_VALUES.has(faq.topic)),
    [faqs]
  );

  const selectedTemplate = useMemo(
    () => getFaqTopicTemplate(form.topic),
    [form.topic]
  );

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

  const openCreate = (presetTopic?: string) => {
    setEditing(null);
    const template = presetTopic ? getFaqTopicTemplate(presetTopic) : undefined;
    setForm({
      topic: presetTopic || '',
      answer: template?.placeholder || '',
    });
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

  const onTopicChange = (topic: string) => {
    const template = getFaqTopicTemplate(topic);
    setForm((prev) => ({
      topic,
      answer: prev.answer.trim() ? prev.answer : template?.placeholder || prev.answer,
    }));
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
    if (!confirm(`Remover a FAQ "${formatFaqTopicLabel(faq.topic)}"?`)) return;
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
          <h2 className="text-xl font-semibold text-gray-900">Treinamento da IA (Regras da Casa)</h2>
          <p className="text-sm text-gray-600 mt-1">
            Informações oficiais que a IA usa no WhatsApp para {establishmentName}. Escolha o{' '}
            <strong>tópico correto</strong> e descreva os fatos com clareza (horários, valores,
            benefícios).
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90"
        >
          <MdAdd size={18} />
          Nova regra
        </button>
      </div>

      {missingRecommended.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium mb-2">Tópicos recomendados ainda não cadastrados:</p>
          <ul className="flex flex-wrap gap-2">
            {missingRecommended.map((topic) => (
              <li key={topic}>
                <button
                  type="button"
                  onClick={() => openCreate(topic)}
                  className="rounded-full bg-white border border-amber-300 px-3 py-1 text-xs font-medium hover:bg-amber-100"
                >
                  + {formatFaqTopicLabel(topic)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {legacyFaqs.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950 flex gap-2">
          <MdWarning className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium">Tópicos antigos detectados</p>
            <p className="mt-1">
              Existem regras com tópicos legados ({legacyFaqs.map((f) => f.topic).join(', ')}).
              Edite e salve usando os tópicos novos (ex.: &quot;Horário&quot; →{' '}
              <code className="text-xs">dias_horarios_funcionamento</code>, &quot;Aniversários&quot; →{' '}
              <code className="text-xs">beneficios_aniversario</code>). Ao salvar, a API normaliza
              automaticamente.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
          Carregando regras...
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Tópico</th>
                <th className="px-4 py-3 text-left font-medium text-gray-700">Conteúdo para a IA</th>
                <th className="px-4 py-3 text-right font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {faqs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                    Nenhuma regra cadastrada. Comece pelos tópicos recomendados acima.
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 align-top">
                      {formatFaqTopicLabel(faq.topic)}
                      <div className="text-xs text-gray-500 font-mono">{faq.topic}</div>
                      {LEGACY_FAQ_TOPIC_VALUES.has(faq.topic) && (
                        <span className="mt-1 inline-block text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                          legado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-pre-wrap max-w-xl">
                      {faq.answer}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
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
            {editing ? 'Editar regra' : 'Nova regra'}
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tópico</label>
              <select
                value={form.topic}
                onChange={(event) => onTopicChange(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Selecione um tópico...</option>
                {FAQ_TOPIC_TEMPLATES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="mt-2 text-xs text-gray-600">{selectedTemplate.description}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fatos e orientações (a IA responde com base neste texto)
              </label>
              <textarea
                value={form.answer}
                onChange={(event) => setForm((prev) => ({ ...prev, answer: event.target.value }))}
                rows={8}
                placeholder={
                  selectedTemplate?.placeholder ||
                  'Liste horários, valores, benefícios e regras de forma objetiva.'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono leading-relaxed"
              />
              <p className="mt-2 text-xs text-gray-500">
                Escreva os fatos reais (horários, preços, cortesias). A IA reformula em linguagem
                natural, mas não deve inventar o que não estiver aqui. Separe horários e valores de
                entrada em tópicos diferentes quando possível.
              </p>
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
