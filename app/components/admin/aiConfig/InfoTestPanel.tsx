'use client';

import { useEffect, useRef, useState } from 'react';
import { MdSend } from 'react-icons/md';
import { EstablishmentInfo } from '@/app/types/aiAssistant';
import { formatFaqTopicLabel } from '@/app/types/faqTopics';
import { getApiBaseUrl, getAuthHeaders, INPUT_CLASS } from './shared';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type TestResult = {
  reply: string;
  sources: string[];
  readFocus: boolean;
  informational: boolean;
};

type Props = {
  establishmentId: number;
  establishmentName: string;
  items: EstablishmentInfo[];
  focusTopic: string;
  onClose: () => void;
};

export default function InfoTestPanel({
  establishmentId,
  establishmentName,
  items,
  focusTopic,
  onClose,
}: Props) {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TestResult | null>(null);
  const [activeTopic, setActiveTopic] = useState(focusTopic);
  const [simulatedDate, setSimulatedDate] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveTopic(focusTopic);
    if (!focusTopic) return;
    setDraft(`Oi, pode me explicar sobre ${formatFaqTopicLabel(focusTopic)}?`);
  }, [focusTopic]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const askAbout = (topic: string) => {
    setActiveTopic(topic);
    setDraft(`Oi, pode me explicar sobre ${formatFaqTopicLabel(topic)}?`);
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
            focus_topic: activeTopic || null,
            history,
          }),
        },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success) {
        throw new Error(json?.message || 'Falha ao testar.');
      }
      const data = json.data as TestResult;
      setResult(data);
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao testar.');
    } finally {
      setSending(false);
    }
  };

  const focusLabel = activeTopic ? formatFaqTopicLabel(activeTopic) : '';
  const verdict = !result
    ? null
    : result.readFocus
      ? `A IA leu${focusLabel ? ` “${focusLabel}”` : ' a base'} e respondeu com o que está cadastrado.`
      : `A IA não usou${focusLabel ? ` “${focusLabel}”` : ' a informação'}. Pergunte com as palavras do título.`;

  return (
    <div className="rounded-2xl border border-violet-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-violet-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Teste da IA <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700">Beta</span>
          </p>
          <p className="text-xs text-gray-500">
            Simula a pergunta do cliente. Não envia WhatsApp e não cria reserva.
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-gray-500 hover:text-gray-800">
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[320px_1fr]">
        <div className="mx-auto w-full max-w-[320px] overflow-hidden rounded-[28px] border-8 border-gray-900 bg-[#efeae2] shadow-md">
          <div className="bg-[#075e54] px-4 py-3 text-white">
            <p className="truncate text-sm font-semibold">{establishmentName || 'Casa'}</p>
            <p className="text-[11px] text-emerald-100">teste local · online</p>
          </div>
          <div className="flex h-80 flex-col gap-2 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <p className="m-auto max-w-[220px] text-center text-sm text-gray-600">
                Mande uma mensagem como se fosse um cliente
              </p>
            ) : (
              messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    message.role === 'user'
                      ? 'ml-auto bg-[#d9fdd3] text-gray-900'
                      : 'bg-white text-gray-800'
                  }`}
                >
                  {message.content}
                </div>
              ))
            )}
            {sending ? <p className="text-xs text-gray-500">A IA está lendo...</p> : null}
            <div ref={endRef} />
          </div>
          <div className="flex items-end gap-2 bg-[#f0f2f5] p-2">
            <textarea
              value={draft}
              rows={2}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
                event.preventDefault();
                void send();
              }}
              placeholder="Mensagem"
              className="max-h-24 flex-1 resize-none rounded-full border border-white bg-white px-3 py-2 text-sm outline-none"
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

        <div className="space-y-3">
          <label className="block text-xs font-medium text-gray-600">
            Data simulada
            <input
              type="date"
              value={simulatedDate}
              onChange={(event) => setSimulatedDate(event.target.value)}
              className={`${INPUT_CLASS} mt-1`}
            />
          </label>
          <p className="text-xs text-gray-500">
            Vazia usa a data de hoje. Preencha quando a informação depender do dia, como programação ou entrada.
          </p>
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>
          ) : null}
          {verdict ? (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                result?.readFocus
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border border-amber-200 bg-amber-50 text-amber-900'
              }`}
            >
              {verdict}
              {result && !result.informational
                ? ' No WhatsApp real, uma frase de reserva pode seguir o fluxo de reserva em vez desta base.'
                : ''}
              {result?.sources.length
                ? ` Leu: ${result.sources.map((topic) => formatFaqTopicLabel(topic)).join(', ')}.`
                : ''}
            </p>
          ) : null}
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {items.map((info) => (
              <button
                key={info.id || info.topic}
                type="button"
                onClick={() => askAbout(info.topic)}
                className={`block w-full rounded-xl border px-3 py-2 text-left ${
                  activeTopic === info.topic
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <span className="text-sm font-medium text-gray-900">{formatFaqTopicLabel(info.topic)}</span>
                <span className="mt-1 line-clamp-2 block text-xs text-gray-500">{info.answer}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
