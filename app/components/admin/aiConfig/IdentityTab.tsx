'use client';

import { useState } from 'react';
import { MdAdd, MdArrowDownward, MdArrowUpward, MdDelete } from 'react-icons/md';
import {
  AiAssistantSettings,
  AiResponseSize,
  AiSlangIntensity,
  AiTone,
} from '@/app/types/aiAssistant';
import { useAiSettings } from './useAiSettings';
import { CardOption, FeedbackBanner, INPUT_CLASS, SaveBar, SectionHeader, ToggleRow } from './shared';

const RESPONSE_SIZE_OPTIONS: { value: AiResponseSize; title: string; hint: string }[] = [
  { value: 'curta', title: 'Curta', hint: 'Respostas diretas, 1-2 frases' },
  { value: 'media', title: 'Média', hint: 'Cordial, equilibrada' },
  { value: 'longa', title: 'Longa', hint: 'Respostas mais completas quando precisa' },
];

const TONE_OPTIONS: { value: AiTone; title: string; hint: string }[] = [
  { value: 'amigavel', title: 'Amigável', hint: 'Caloroso e próximo' },
  { value: 'neutro', title: 'Neutro', hint: 'Equilibrado e cordial' },
  { value: 'formal', title: 'Formal', hint: 'Polido e profissional' },
];

const SLANG_INTENSITY_OPTIONS: { value: AiSlangIntensity; label: string }[] = [
  { value: 'nunca', label: 'Nunca' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'intenso', label: 'Intenso' },
];

export default function IdentityTab({
  establishmentId,
  establishmentName,
}: {
  establishmentId: number | null;
  establishmentName: string;
}) {
  const { settings, setSettings, update, loading, saving, error, success, load, save } =
    useAiSettings(establishmentId);
  const [newRule, setNewRule] = useState('');

  const avatarLetter = (settings.assistant_name || establishmentName || 'IA').charAt(0).toUpperCase();

  const addRule = () => {
    const value = newRule.trim();
    if (!value) return;
    setSettings((prev) => ({ ...prev, custom_rules: [...prev.custom_rules, value] }));
    setNewRule('');
  };

  const removeRule = (index: number) =>
    setSettings((prev) => ({ ...prev, custom_rules: prev.custom_rules.filter((_, i) => i !== index) }));

  const moveRule = (index: number, dir: -1 | 1) =>
    setSettings((prev) => {
      const next = [...prev.custom_rules];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, custom_rules: next };
    });

  if (loading) return <p className="text-sm text-gray-500">Carregando configurações...</p>;

  return (
    <div className="space-y-8">
      <FeedbackBanner error={error} success={success} />
      <SectionHeader
        title="Identidade & personalidade"
        description="Como a assistente se apresenta no chat — nome, gênero, tom de voz e estilo de resposta."
      />

      <ToggleRow
        title="Ativar personalidade personalizada"
        description="Quando ligado, a IA usa estas configurações no lugar do comportamento padrão. Ative primeiro na casa piloto."
        checked={settings.is_active}
        onChange={(v) => update('is_active', v)}
      />

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Nome e gênero</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Nome do assistente</label>
            <input
              type="text"
              value={settings.assistant_name}
              maxLength={80}
              onChange={(e) => update('assistant_name', e.target.value)}
              placeholder="Ex.: Ludmilla"
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Gênero do assistente</label>
            <select
              value={settings.gender}
              onChange={(e) => update('gender', e.target.value as AiAssistantSettings['gender'])}
              className={INPUT_CLASS}
            >
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="neutro">Neutro</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-gray-800">Tamanho da resposta</h4>
        <p className="mb-3 text-xs text-gray-500">Quão longas devem ser as mensagens da assistente.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {RESPONSE_SIZE_OPTIONS.map((opt) => (
            <CardOption
              key={opt.value}
              active={settings.response_size === opt.value}
              title={opt.title}
              hint={opt.hint}
              onClick={() => update('response_size', opt.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-gray-800">Tom de voz</h4>
        <p className="mb-3 text-xs text-gray-500">A personalidade refletida nas mensagens.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TONE_OPTIONS.map((opt) => (
            <CardOption
              key={opt.value}
              active={settings.tone === opt.value}
              title={opt.title}
              hint={opt.hint}
              onClick={() => update('tone', opt.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Recursos</h4>
        <div className="space-y-2">
          <ToggleRow
            title="Emojis"
            description="Permite o uso de emojis com moderação nas respostas."
            checked={settings.use_emojis}
            onChange={(v) => update('use_emojis', v)}
          />
          <ToggleRow
            title="Bullet points"
            description="Usa listas curtas quando organizar informações."
            checked={settings.use_bullets}
            onChange={(v) => update('use_bullets', v)}
          />
          <ToggleRow
            title="Saudação"
            description="A IA cumprimenta o cliente no início da conversa."
            checked={settings.use_greeting}
            onChange={(v) => update('use_greeting', v)}
          />
          <ToggleRow
            title="Saudar mesmo se já saudou antes"
            description="Permite repetir a saudação em novas conversas."
            checked={settings.greet_when_already_greeted}
            onChange={(v) => update('greet_when_already_greeted', v)}
            disabled={!settings.use_greeting}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-gray-800">Gírias e expressões</h4>
        <p className="mb-3 text-xs text-gray-500">
          Palavras e expressões que combinam com a identidade da casa.
        </p>
        <textarea
          value={settings.slang_text}
          onChange={(e) => update('slang_text', e.target.value)}
          rows={3}
          placeholder="Ex.: fechado, show, beleza, bora?"
          className={INPUT_CLASS}
        />
        <p className="mb-2 mt-3 text-xs text-gray-500">Intensidade do uso</p>
        <div className="flex flex-wrap gap-2">
          {SLANG_INTENSITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update('slang_intensity', opt.value)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                settings.slang_intensity === opt.value
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold text-gray-800">Regras de comportamento</h4>
        <p className="mb-3 text-xs text-gray-500">Regras adicionais que a assistente deve sempre seguir.</p>
        <div className="space-y-2">
          {settings.custom_rules.length === 0 && (
            <p className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-xs text-gray-400">
              Nenhuma regra adicional cadastrada.
            </p>
          )}
          {settings.custom_rules.map((rule, index) => (
            <div
              key={`${rule}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="flex-1 text-sm text-gray-700">{rule}</span>
              <button
                type="button"
                onClick={() => moveRule(index, -1)}
                disabled={index === 0}
                className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                aria-label="Mover para cima"
              >
                <MdArrowUpward size={16} />
              </button>
              <button
                type="button"
                onClick={() => moveRule(index, 1)}
                disabled={index === settings.custom_rules.length - 1}
                className="rounded p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                aria-label="Mover para baixo"
              >
                <MdArrowDownward size={16} />
              </button>
              <button
                type="button"
                onClick={() => removeRule(index)}
                className="rounded p-1 text-red-500 hover:text-red-600"
                aria-label="Remover regra"
              >
                <MdDelete size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={newRule}
            onChange={(e) => setNewRule(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRule();
              }
            }}
            placeholder="Ex.: Nunca prometer desconto sem confirmar com a equipe."
            className={INPUT_CLASS}
          />
          <button
            type="button"
            onClick={addRule}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700"
          >
            <MdAdd size={16} />
            Adicionar
          </button>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-800">Prévia da resposta</h4>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-xs font-semibold text-white">
              {avatarLetter}
            </div>
            <span className="text-sm font-medium text-gray-800">
              {settings.assistant_name || 'Assistente'}
            </span>
          </div>
          <div className="mt-3 max-w-md rounded-2xl rounded-tl-sm bg-amber-100 px-4 py-2.5 text-sm text-gray-800">
            {buildPreview(settings)}
          </div>
          <p className="mt-3 text-[11px] text-gray-400">
            Prévia ilustrativa. O comportamento real combina estas opções com a base de conhecimento (Regras da Casa).
          </p>
        </div>
      </div>

      <SaveBar onSave={save} onReset={load} saving={saving} disabled={establishmentId === null} />
    </div>
  );
}

function buildPreview(settings: AiAssistantSettings): string {
  const name = settings.assistant_name || 'a assistente';
  const greetingByGender =
    settings.gender === 'masculino' ? 'Opa' : settings.gender === 'neutro' ? 'Olá' : 'Oii';
  const emoji = settings.use_emojis ? ' 😊' : '';
  const greeting = settings.use_greeting ? `${greetingByGender}! ` : '';

  let core: string;
  if (settings.tone === 'formal') core = 'Posso ajudar com a sua reserva. Para qual data você gostaria?';
  else if (settings.tone === 'neutro') core = 'Posso te ajudar com a reserva. Pra qual data seria?';
  else core = 'Que bom falar com você! Bora marcar sua reserva? Me diz a data que você quer.';

  if (settings.response_size === 'curta')
    core = settings.tone === 'formal' ? 'Para qual data seria a reserva?' : 'Pra qual data seria?';
  else if (settings.response_size === 'longa')
    core += ' Assim já confirmo a disponibilidade e te passo as opções de área certinhas.';

  let message = `${greeting}Aqui é ${name}. ${core}${emoji}`;
  if (settings.slang_intensity !== 'nunca' && settings.slang_text) {
    const firstSlang = settings.slang_text.split(/[,;\n]/)[0]?.trim();
    if (firstSlang && settings.slang_intensity !== 'leve') {
      message += ` ${firstSlang.charAt(0).toUpperCase() + firstSlang.slice(1)}?`;
    }
  }
  return message;
}
