'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MdBadge,
  MdTune,
  MdReplay,
  MdLink,
  MdChatBubbleOutline,
  MdInfoOutline,
  MdEmojiEmotions,
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
import AllowedNumbersTab from './aiConfig/AllowedNumbersTab';

type SubTabId =
  | 'identidade'
  | 'comportamento'
  | 'followup'
  | 'links'
  | 'quebra-gelos'
  | 'informacoes'
  | 'figurinhas'
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
  { id: 'numeros', label: 'Números habilitados', group: 'ACESSO & CRM', icon: <MdVerifiedUser size={18} /> },
];

const GROUP_ORDER: SubTab['group'][] = ['ASSISTENTE', 'CONTEÚDO', 'ACESSO & CRM'];

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
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Configurações de IA</h2>
          <p className="text-xs text-gray-500">
            Defina como a assistente se apresenta e atende antes de ativar a IA no WhatsApp.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Estabelecimento:</span>
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
    case 'numeros':
      return <AllowedNumbersTab key={key} establishmentId={establishmentId} />;
    default:
      return null;
  }
}
