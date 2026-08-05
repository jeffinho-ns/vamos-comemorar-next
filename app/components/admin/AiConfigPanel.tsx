'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MdBadge,
  MdTune,
  MdReplay,
  MdLink,
  MdChatBubbleOutline,
  MdInfoOutline,
  MdEmojiEmotions,
  MdImage,
  MdVerifiedUser,
} from 'react-icons/md';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';
import IdentityTab from './aiConfig/IdentityTab';
import BehaviorTab from './aiConfig/BehaviorTab';
import FollowUpTab from './aiConfig/FollowUpTab';
import ExternalLinksTab from './aiConfig/ExternalLinksTab';
import IceBreakersTab from './aiConfig/IceBreakersTab';
import InfoTab from './aiConfig/InfoTab';
import StickersTab from './aiConfig/StickersTab';
import FlyersTab from './aiConfig/FlyersTab';
import AllowedNumbersTab from './aiConfig/AllowedNumbersTab';
import { useAiSettings } from './aiConfig/useAiSettings';
import { Toggle } from './aiConfig/shared';

type SubTabId =
  | 'identidade'
  | 'comportamento'
  | 'followup'
  | 'links'
  | 'quebra-gelos'
  | 'informacoes'
  | 'figurinhas'
  | 'flyers'
  | 'numeros';

type SubTab = {
  id: SubTabId;
  label: string;
  group: 'ASSISTENTE' | 'CONTEÚDO' | 'ACESSO & CRM';
  icon: React.ReactNode;
};

const SUB_TABS: SubTab[] = [
  { id: 'identidade', label: 'Identidade', group: 'ASSISTENTE', icon: <MdBadge size={18} /> },
  { id: 'comportamento', label: 'Comportamento', group: 'ASSISTENTE', icon: <MdTune size={18} /> },
  { id: 'followup', label: 'Follow-up', group: 'ASSISTENTE', icon: <MdReplay size={18} /> },
  { id: 'links', label: 'Links externos', group: 'CONTEÚDO', icon: <MdLink size={18} /> },
  { id: 'quebra-gelos', label: 'Quebra-gelos', group: 'CONTEÚDO', icon: <MdChatBubbleOutline size={18} /> },
  { id: 'informacoes', label: 'Informações', group: 'CONTEÚDO', icon: <MdInfoOutline size={18} /> },
  { id: 'figurinhas', label: 'Figurinhas', group: 'CONTEÚDO', icon: <MdEmojiEmotions size={18} /> },
  { id: 'flyers', label: 'Flyers', group: 'CONTEÚDO', icon: <MdImage size={18} /> },
  { id: 'numeros', label: 'Números habilitados', group: 'ACESSO & CRM', icon: <MdVerifiedUser size={18} /> },
];

const GROUP_ORDER: SubTab['group'][] = ['ASSISTENTE', 'CONTEÚDO', 'ACESSO & CRM'];

function AiMasterSwitch({ establishmentId }: { establishmentId: number | null }) {
  const { settings, setSettings, loading, saving, error, success } =
    useAiSettings(establishmentId);
  const [toggling, setToggling] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [localSuccess, setLocalSuccess] = useState<string | null>(null);

  const enabled = settings.ai_globally_enabled !== false;

  const toggleAi = useCallback(
    async (next: boolean) => {
      if (establishmentId === null || toggling || saving) return;
      setToggling(true);
      setLocalError(null);
      setLocalSuccess(null);
      const previous = settings.ai_globally_enabled;
      setSettings((prev) => ({ ...prev, ai_globally_enabled: next }));
      try {
        const token =
          typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
        const api =
          process.env.NEXT_PUBLIC_API_URL || 'https://api.agilizaiapp.com.br';
        const res = await fetch(
          `${api}/api/admin/establishments/${establishmentId}/ai-settings`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ ...settings, ai_globally_enabled: next }),
          },
        );
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || 'Falha ao atualizar o status da IA.');
        }
        setLocalSuccess(
          next
            ? 'IA ligada: o WhatsApp volta a responder automaticamente.'
            : 'IA desligada: nenhum cliente receberá resposta automática.',
        );
      } catch (err) {
        setSettings((prev) => ({ ...prev, ai_globally_enabled: previous }));
        setLocalError(err instanceof Error ? err.message : 'Erro ao atualizar a IA.');
      } finally {
        setToggling(false);
      }
    },
    [establishmentId, saving, settings, setSettings, toggling],
  );

  if (establishmentId === null) return null;

  return (
    <div className="w-full sm:w-auto sm:min-w-[280px]">
      <div
        className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 shadow-sm ${
          enabled
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-red-200 bg-red-50'
        }`}
      >
        <div className="min-w-0">
          <p
            className={`text-sm font-semibold ${
              enabled ? 'text-emerald-900' : 'text-red-900'
            }`}
          >
            {enabled ? 'IA ligada' : 'IA desligada'}
          </p>
          <p className={`text-xs ${enabled ? 'text-emerald-700' : 'text-red-700'}`}>
            {enabled
              ? 'Responde automaticamente no WhatsApp'
              : 'Não responde ninguém automaticamente'}
          </p>
        </div>
        <Toggle
          checked={enabled}
          onChange={toggleAi}
          disabled={loading || toggling || saving}
        />
      </div>
      {(localError || error) && (
        <p className="mt-1.5 text-xs text-red-600">{localError || error}</p>
      )}
      {(localSuccess || success) && !localError && !error && (
        <p className="mt-1.5 text-xs text-emerald-700">{localSuccess || success}</p>
      )}
    </div>
  );
}

export default function AiConfigPanel() {
  const { establishments, loading: loadingEstablishments, fetchEstablishments } = useEstablishments();
  const establishmentPermissions = useEstablishmentPermissions();

  const [subTab, setSubTab] = useState<SubTabId>('identidade');
  const [establishmentId, setEstablishmentId] = useState<number | null>(null);

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const visibleEstablishments = useMemo(
    () => establishmentPermissions.getFilteredEstablishments(establishments),
    [establishmentPermissions, establishments],
  );

  useEffect(() => {
    if (establishmentId !== null) return;
    if (visibleEstablishments.length === 0) return;
    const first = visibleEstablishments[0];
    const id = typeof first.id === 'string' ? parseInt(first.id, 10) : first.id;
    if (Number.isFinite(id)) setEstablishmentId(id as number);
  }, [establishmentId, visibleEstablishments]);

  const establishmentName = useMemo(() => {
    const match = visibleEstablishments.find((item) => Number(item.id) === establishmentId);
    return match?.name || (establishmentId ? `Estabelecimento #${establishmentId}` : '');
  }, [visibleEstablishments, establishmentId]);

  const avatarLetter = (establishmentName || 'IA').charAt(0).toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-white px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-gray-900">Configurações de IA</h2>
          <p className="text-xs text-gray-500">
            Ligue ou desligue o atendimento automático e defina como a assistente fala no WhatsApp.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 whitespace-nowrap">Estabelecimento:</span>
            <select
              value={establishmentId ?? ''}
              onChange={(e) => setEstablishmentId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            >
              {loadingEstablishments && <option value="">Carregando...</option>}
              {!loadingEstablishments && visibleEstablishments.length === 0 && (
                <option value="">Nenhum estabelecimento</option>
              )}
              {visibleEstablishments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <AiMasterSwitch establishmentId={establishmentId} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr]">
        <aside className="border-b border-gray-100 bg-gray-50/70 p-4 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-600 text-sm font-semibold text-white">
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">{establishmentName || 'Assistente'}</p>
              <p className="text-xs text-gray-500">Configuração da IA</p>
            </div>
          </div>

          {GROUP_ORDER.map((group) => (
            <div key={group} className="mb-4">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                {group}
              </p>
              <nav className="space-y-1">
                {SUB_TABS.filter((tab) => tab.group === group).map((tab) => {
                  const active = subTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSubTab(tab.id)}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className={active ? 'text-amber-600' : 'text-gray-400'}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </aside>

        <section className="min-h-[480px] p-5">
          {establishmentId === null ? (
            <p className="text-sm text-gray-500">Selecione um estabelecimento para configurar a IA.</p>
          ) : (
            <ActiveTab subTab={subTab} establishmentId={establishmentId} establishmentName={establishmentName} />
          )}
        </section>
      </div>
    </div>
  );
}

function ActiveTab({
  subTab,
  establishmentId,
  establishmentName,
}: {
  subTab: SubTabId;
  establishmentId: number;
  establishmentName: string;
}) {
  const key = `${subTab}-${establishmentId}`;
  switch (subTab) {
    case 'identidade':
      return <IdentityTab key={key} establishmentId={establishmentId} establishmentName={establishmentName} />;
    case 'comportamento':
      return <BehaviorTab key={key} establishmentId={establishmentId} />;
    case 'followup':
      return <FollowUpTab key={key} establishmentId={establishmentId} />;
    case 'links':
      return <ExternalLinksTab key={key} establishmentId={establishmentId} />;
    case 'quebra-gelos':
      return <IceBreakersTab key={key} establishmentId={establishmentId} />;
    case 'informacoes':
      return <InfoTab key={key} establishmentId={establishmentId} />;
    case 'figurinhas':
      return <StickersTab key={key} establishmentId={establishmentId} />;
    case 'flyers':
      return <FlyersTab key={key} establishmentId={establishmentId} />;
    case 'numeros':
      return <AllowedNumbersTab key={key} establishmentId={establishmentId} />;
    default:
      return null;
  }
}
