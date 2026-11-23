'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  MdAdd,
  MdArrowBack,
  MdChatBubbleOutline,
  MdClose,
  MdEdit,
  MdPhone,
  MdSearch,
  MdSend,
  MdSentimentSatisfiedAlt,
  MdVideocam,
} from 'react-icons/md';
import { EstablishmentInfo } from '@/app/types/aiAssistant';
import { formatFaqTopicLabel } from '@/app/types/faqTopics';
import { getApiBaseUrl, getAuthHeaders } from './shared';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  readFocus?: boolean;
  verbatim?: boolean;
};

const FILTERS = [
  { value: 'todas', label: 'Todos' },
  { value: 'evento', label: 'Evento' },
  { value: 'reserva', label: 'Reserva' },
  { value: 'cardapio', label: 'Cardápio' },
  { value: 'fila', label: 'Fila' },
  { value: 'geral', label: 'Geral' },
];

const BADGE: Record<string, string> = {
  geral: 'bg-gray-100 text-gray-600',
  evento: 'bg-fuchsia-100 text-fuchsia-700',
  reserva: 'bg-emerald-100 text-emerald-700',
  cardapio: 'bg-amber-100 text-amber-800',
  fila: 'bg-sky-100 text-sky-700',
};

const PAGE_SIZE = 5;

function formatStamp(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type Props = {
  establishmentId: number;
  establishmentName: string;
  items: EstablishmentInfo[];
  focusTopic: string;
  onClose: () => void;
  onEdit: (info: EstablishmentInfo) => void;
};

export default function InfoTestPanel({
  establishmentId,
  establishmentName,
  items,
  focusTopic,
  onClose,
  onEdit,
}: Props) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTopic, setActiveTopic] = useState(focusTopic);
  const [simulatedDate, setSimulatedDate] = useState('');
  const [simulatedTime, setSimulatedTime] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todas');
  const [page, setPage] = useState(1);
  const endRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setActiveTopic(focusTopic);
    if (!focusTopic) return;
    setDraft(`Oi, pode me explicar sobre ${formatFaqTopicLabel(focusTopic)}?`);
  }, [focusTopic]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((info) => {
      const category = info.category || 'geral';
      if (filter !== 'todas' && category !== filter) return false;
      if (!query) return true;
      const title = formatFaqTopicLabel(info.topic).toLowerCase();
      return title.includes(query) || info.answer.toLowerCase().includes(query);
    });
  }, [filter, items, search]);

  const pages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const pageItems = visible.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const cite = () => {
    const info = items.find((item) => item.topic === activeTopic);
    if (!info) return;
    setDraft(`Oi, pode me explicar sobre ${formatFaqTopicLabel(info.topic)}?`);
  };

  const clearAll = () => {
    setDraft('');
    setMessages([]);
    setError(null);
    setActiveTopic('');
    setSimulatedDate('');
    setSimulatedTime('');
    setSearch('');
    setFilter('todas');
    setPage(1);
  };

  const send = async () => {
    const message = draft.trim();
    if (!message || sending) return;
    const history = messages.slice(-6);
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setDraft('');
    setSending(true);
    setError(null);
    try {
      const res = await fetch(
        `${getApiBaseUrl()}/api/admin/establishments/${establishmentId}/faqs/test`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            message,
            simulated_date: simulatedDate || null,
            simulated_time: simulatedTime || null,
            focus_topic: activeTopic || null,
            history,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) throw new Error(json?.message || 'Falha ao testar.');
      const sources = Array.isArray(json.data?.sources)
        ? json.data.sources.map((item: unknown) => String(item || '').trim()).filter(Boolean)
        : [];
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: String(json.data?.reply || ''),
          sources,
          readFocus: Boolean(json.data?.readFocus),
          verbatim: Boolean(json.data?.verbatim),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao testar.');
    } finally {
      setSending(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="teste-ia-titulo"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white text-gray-900 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            <h2 id="teste-ia-titulo" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                <MdChatBubbleOutline size={16} />
              </span>
              Testes da IA
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-700">
                Beta
              </span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Mesmo retrieval da produção: a SOL só responde com as Informações adicionais
              que encontrar na base desta casa.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Limpar tudo
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar teste"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            >
              <MdClose size={20} />
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-y-auto bg-[#f6f7fb] p-6 lg:grid-cols-[340px_1fr] lg:overflow-hidden">
          <div className="mx-auto flex h-[640px] w-[320px] flex-col overflow-hidden rounded-[36px] border-[10px] border-gray-950 bg-[#ece5dd] shadow-xl">
            <div className="flex items-center gap-2 bg-[#075e54] px-3 py-3 text-white">
              <MdArrowBack size={18} />
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
                {(establishmentName || 'IA').charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{establishmentName || 'Casa'}</p>
                <p className="text-[11px] text-emerald-100">online</p>
              </div>
              <MdVideocam size={18} />
              <MdPhone size={16} />
            </div>
            <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-4">
              {messages.length === 0 ? (
                <div className="m-auto max-w-[210px] text-center text-gray-600">
                  <MdChatBubbleOutline className="mx-auto mb-3 text-violet-500" size={36} />
                  <p className="text-sm font-medium leading-snug">Mande uma mensagem como se fosse um cliente</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`max-w-[86%] ${message.role === 'user' ? 'ml-auto' : ''}`}
                  >
                    <div
                      className={`rounded-lg px-3 py-2 text-sm leading-snug shadow-sm ${
                        message.role === 'user' ? 'bg-[#d9fdd3]' : 'bg-white'
                      }`}
                    >
                      {message.content}
                    </div>
                    {message.role === 'assistant' ? (
                      <p className="mt-1 px-1 text-[10px] leading-snug text-gray-600">
                        {message.verbatim ? 'Texto da ficha desta casa. ' : ''}
                        {message.sources?.length
                          ? `Fichas lidas: ${message.sources.map((topic) => formatFaqTopicLabel(topic)).join(', ')}`
                          : 'Nenhuma ficha da base entrou nesta resposta.'}
                        {activeTopic && message.readFocus === false
                          ? ' A ficha selecionada não foi usada.'
                          : ''}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
              {sending ? <p className="text-xs text-gray-500">A IA está lendo...</p> : null}
              <div ref={endRef} />
            </div>
            {error ? <p className="bg-red-50 px-3 py-1 text-[11px] text-red-700">{error}</p> : null}
            <div className="flex items-center gap-2 bg-[#f0f2f5] px-2 py-2">
              <MdSentimentSatisfiedAlt className="text-gray-500" size={22} />
              <textarea
                value={draft}
                rows={1}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                  event.preventDefault();
                  void send();
                }}
                placeholder="Mensagem"
                className="max-h-20 flex-1 resize-none rounded-full border-0 bg-white px-3 py-2 text-sm text-gray-900 outline-none"
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={sending || !draft.trim()}
                aria-label="Enviar teste"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00a884] text-white disabled:opacity-40"
              >
                <MdSend />
              </button>
            </div>
          </div>

          <section className="flex min-h-[640px] flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:min-h-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-gray-900">Informações adicionais</h3>
                <p className="mt-1 text-sm text-gray-500">Gerencie as informações que a IA usa nas respostas</p>
              </div>
              <button
                type="button"
                onClick={cite}
                disabled={!activeTopic}
                className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-40"
              >
                <MdAdd size={16} />
                Citar
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-gray-600">
                Simular que hoje é
                <input
                  type="date"
                  value={simulatedDate}
                  onChange={(event) => setSimulatedDate(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Simular que agora é
                <input
                  type="time"
                  value={simulatedTime}
                  onChange={(event) => setSimulatedTime(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                />
              </label>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-400">
              A data e o horário simulados valem só dentro dos Testes da IA. Só a data usa meio-dia; só o horário usa o dia de hoje. Vazio usa a data e a hora reais.
            </p>

            <div className="relative mt-4">
              <MdSearch className="pointer-events-none absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar informações..."
                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-violet-400"
              />
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setFilter(item.value);
                    setPage(1);
                  }}
                  className={`rounded-full px-3 py-1 text-sm ${
                    filter === item.value
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">{visible.length} informações</p>

            <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {pageItems.map((info) => {
                const category = info.category || 'geral';
                const selected = activeTopic === info.topic;
                return (
                  <article
                    key={info.id || info.topic}
                    onClick={() => setActiveTopic(info.topic)}
                    className={`cursor-pointer rounded-xl border px-3 py-3 ${
                      selected ? 'border-violet-300 bg-violet-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900">{formatFaqTopicLabel(info.topic)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE[category] || BADGE.geral}`}>
                        {FILTERS.find((item) => item.value === category)?.label || 'Geral'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 text-sm text-gray-600">{info.answer}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                      <span>{formatStamp(info.updated_at)}</span>
                      <button
                        type="button"
                        aria-label={`Editar ${formatFaqTopicLabel(info.topic)}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(info);
                        }}
                        className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700"
                      >
                        <MdEdit size={16} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-end gap-1">
              {Array.from({ length: pages }, (_, index) => index + 1)
                .filter((number) => number === 1 || number === pages || Math.abs(number - safePage) <= 1)
                .map((number, index, list) => {
                  const previous = list[index - 1];
                  return (
                    <span key={number} className="flex items-center gap-1">
                      {previous && number - previous > 1 ? <span className="px-1 text-gray-400">…</span> : null}
                      <button
                        type="button"
                        onClick={() => setPage(number)}
                        className={`h-8 min-w-8 rounded-lg px-2 text-sm ${
                          number === safePage ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {number}
                      </button>
                    </span>
                  );
                })}
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
