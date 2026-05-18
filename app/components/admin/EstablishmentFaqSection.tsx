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
  getRecommendedTopicValues,
  HIGHLINE_ESTABLISHMENT_ID,
  isKnownFaqTopic,
  LEGACY_FAQ_TOPIC_VALUES,
  normalizeTopicInput,
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

type TopicInputMode = 'suggested' | 'custom';

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
  const [topicInputMode, setTopicInputMode] = useState<TopicInputMode>('suggested');

  const isHighline = establishmentId === HIGHLINE_ESTABLISHMENT_ID;
  const recommendedTopics = useMemo(
    () => getRecommendedTopicValues(establishmentId),
    [establishmentId]
  );

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
    () => recommendedTopics.filter((topic) => !faqTopicsSet.has(topic)),
    [recommendedTopics, faqTopicsSet]
  );

  const registeredRecommendedCount = recommendedTopics.length - missingRecommended.length;

  const legacyFaqs = useMemo(
    () => faqs.filter((faq) => LEGACY_FAQ_TOPIC_VALUES.has(faq.topic)),
    [faqs]
  );

  const normalizedTopicPreview = useMemo(
    () => normalizeTopicInput(form.topic),
    [form.topic]
  );

  const selectedTemplate = useMemo(() => {
    if (!normalizedTopicPreview) return undefined;
    return getFaqTopicTemplate(normalizedTopicPreview);
  }, [normalizedTopicPreview]);

  const customTopics = useMemo(
    () => faqs.filter((faq) => !isKnownFaqTopic(faq.topic) && !LEGACY_FAQ_TOPIC_VALUES.has(faq.topic)),
    [faqs]
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
    const topic = presetTopic || '';
    const template = presetTopic ? getFaqTopicTemplate(presetTopic) : undefined;
    const useCustom = Boolean(topic && !getFaqTopicTemplate(topic));
    setTopicInputMode(useCustom ? 'custom' : 'suggested');
    setForm({
      topic,
      answer: template?.placeholder || '',
    });
    setShowForm(true);
  };

  const openEdit = (faq: EstablishmentFaq) => {
    setEditing(faq);
    const known = isKnownFaqTopic(faq.topic) || LEGACY_FAQ_TOPIC_VALUES.has(faq.topic);
    setTopicInputMode(known ? 'suggested' : 'custom');
    setForm({ topic: faq.topic, answer: faq.answer });
    setShowForm(true);
  };

  const closeForm = () => {
    setEditing(null);
    setForm({ topic: '', answer: '' });
    setTopicInputMode('suggested');
    setShowForm(false);
  };

  const onSuggestedTopicChange = (topic: string) => {
    const template = getFaqTopicTemplate(topic);
    setForm((prev) => ({
      topic,
      answer: prev.answer.trim() ? prev.answer : template?.placeholder || prev.answer,
    }));
  };

  const onCustomTopicChange = (raw: string) => {
    setForm((prev) => ({ ...prev, topic: raw }));
  };

  const saveFaq = async () => {
    const topicSlug = normalizeTopicInput(form.topic);
    if (!topicSlug) {
      setError('Informe um tópico válido (letras, números e underscores).');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: EstablishmentFaqPayload = {
        topic: topicSlug,
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
    if (!confirm(`Remover a regra "${formatFaqTopicLabel(faq.topic)}"?`)) return;
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
            Informações oficiais que a IA usa no WhatsApp para {establishmentName}. Use os tópicos
            sugeridos (melhor reconhecimento pela IA) ou crie tópicos personalizados para regras
            específicas.
          </p>
          {isHighline && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
              Foco HighLine: complete os {recommendedTopics.length} tópicos recomendados abaixo antes
              de replicar em outros estabelecimentos ({registeredRecommendedCount}/
              {recommendedTopics.length} cadastrados).
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-90 shrink-0"
        >
          <MdAdd size={18} />
          Nova regra
        </button>
      </div>

      {!loading && recommendedTopics.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">
            {isHighline ? 'Checklist HighLine' : 'Tópicos recomendados'}
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedTopics.map((topic) => {
              const done = faqTopicsSet.has(topic);
              return (
                <li
                  key={topic}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                    done
                      ? 'border-green-200 bg-green-50 text-green-900'
                      : 'border-gray-200 bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="font-medium block truncate">{formatFaqTopicLabel(topic)}</span>
                    <span className="text-xs font-mono text-gray-500 truncate block">{topic}</span>
                  </span>
                  {done ? (
                    <button
                      type="button"
                      onClick={() => {
                        const faq = faqs.find((f) => f.topic === topic);
                        if (faq) openEdit(faq);
                      }}
                      className="shrink-0 text-xs text-blue-700 hover:underline"
                    >
                      Editar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openCreate(topic)}
                      className="shrink-0 text-xs font-medium text-amber-800 hover:underline"
                    >
                      + Criar
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {missingRecommended.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-medium">
            Faltam {missingRecommended.length} tópico(s) recomendado(s). A IA pode responder de forma
            genérica sem eles.
          </p>
        </div>
      )}

      {legacyFaqs.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-950 flex gap-2">
          <MdWarning className="shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium">Tópicos antigos detectados</p>
            <p className="mt-1">
              Regras legadas ({legacyFaqs.map((f) => f.topic).join(', ')}). Edite e salve para a API
              normalizar ao tópico canônico.
            </p>
          </div>
        </div>
      )}

      {customTopics.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
          <p className="font-medium">Tópicos personalizados ({customTopics.length})</p>
          <p className="mt-1 text-blue-900">
            {customTopics.map((f) => f.topic).join(', ')} — a IA só usa se a pergunta do cliente
            combinar com esse identificador. Para horário, entrada e aniversário, prefira os tópicos
            sugeridos.
          </p>
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
                    Nenhuma regra cadastrada. Use o checklist acima ou &quot;Nova regra&quot;.
                  </td>
                </tr>
              ) : (
                faqs.map((faq) => (
                  <tr key={faq.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 align-top">
                      {formatFaqTopicLabel(faq.topic)}
                      <div className="text-xs text-gray-500 font-mono">{faq.topic}</div>
                      {!isKnownFaqTopic(faq.topic) && !LEGACY_FAQ_TOPIC_VALUES.has(faq.topic) && (
                        <span className="mt-1 inline-block text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          personalizado
                        </span>
                      )}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Identificador do tópico
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setTopicInputMode('suggested')}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    topicInputMode === 'suggested'
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-900'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Tópico sugerido
                </button>
                <button
                  type="button"
                  onClick={() => setTopicInputMode('custom')}
                  className={`rounded-full px-3 py-1 text-xs font-medium border ${
                    topicInputMode === 'custom'
                      ? 'bg-yellow-100 border-yellow-400 text-yellow-900'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Tópico personalizado
                </button>
              </div>

              {topicInputMode === 'suggested' ? (
                <div>
                  <select
                    value={FAQ_TOPIC_TEMPLATES.some((t) => t.value === form.topic) ? form.topic : ''}
                    onChange={(event) => onSuggestedTopicChange(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Selecione um tópico sugerido...</option>
                    {FAQ_TOPIC_TEMPLATES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-gray-500">
                    Recomendado para a IA reconhecer perguntas de clientes (horário, entrada,
                    aniversário, etc.).
                  </p>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={form.topic}
                    onChange={(event) => onCustomTopicChange(event.target.value)}
                    placeholder="Ex.: politica_lista_espera, eventos_especiais, regras_rooftop"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
                    list="faq-custom-topic-hints"
                  />
                  <datalist id="faq-custom-topic-hints">
                    {FAQ_TOPIC_TEMPLATES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </datalist>
                  <p className="mt-2 text-xs text-gray-500">
                    Digite um identificador único em minúsculas (pode usar espaços — salvamos como
                    slug). Ex.: &quot;Política de fila&quot; →{' '}
                    <code className="text-gray-700">politica_de_fila</code>
                  </p>
                </div>
              )}

              {normalizedTopicPreview && (
                <p className="mt-2 text-xs text-gray-600">
                  Será salvo como:{' '}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-800">
                    {normalizedTopicPreview}
                  </code>
                  {selectedTemplate && topicInputMode === 'custom' && (
                    <span className="text-amber-700">
                      {' '}
                      (equivale ao tópico sugerido &quot;{selectedTemplate.label}&quot;)
                    </span>
                  )}
                </p>
              )}

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
                rows={10}
                placeholder={
                  selectedTemplate?.placeholder ||
                  'Descreva a regra com fatos objetivos: horários, valores, exceções, tom de voz...'
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono leading-relaxed"
              />
              <p className="mt-2 text-xs text-gray-500">
                Escreva os fatos reais. A IA reformula em linguagem natural, mas não deve inventar o
                que não estiver aqui.
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
              disabled={saving || !normalizedTopicPreview || !form.answer.trim()}
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
