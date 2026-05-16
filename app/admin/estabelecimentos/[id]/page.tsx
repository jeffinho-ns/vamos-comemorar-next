'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { MdArrowBack, MdBusiness } from 'react-icons/md';
import { Tabs } from '@/app/components/ui/tabs';
import EstablishmentFaqSection from '@/app/components/admin/EstablishmentFaqSection';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';

export default function EstabelecimentoDetailPage() {
  const params = useParams();
  const establishmentId = Number(params.id);
  const { establishments, loading, fetchEstablishments } = useEstablishments();
  const establishmentPermissions = useEstablishmentPermissions();

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const establishment = useMemo(() => {
    return establishments.find((item) => Number(item.id) === establishmentId) || null;
  }, [establishments, establishmentId]);

  const canAccess = useMemo(() => {
    if (!Number.isFinite(establishmentId) || establishmentId <= 0) return false;
    if (establishmentPermissions.isRestrictedToSingleEstablishment()) {
      return establishmentPermissions
        .getFilteredEstablishments(establishments)
        .some((item) => Number(item.id) === establishmentId);
    }
    return true;
  }, [establishmentId, establishmentPermissions, establishments]);

  if (loading || establishmentPermissions.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-gray-400">Carregando estabelecimento...</p>
      </div>
    );
  }

  if (!Number.isFinite(establishmentId) || establishmentId <= 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-red-300">ID de estabelecimento inválido.</p>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-amber-200">Você não tem permissão para este estabelecimento.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-6">
          <Link
            href="/admin/estabelecimentos"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white"
          >
            <MdArrowBack size={18} />
            Voltar para estabelecimentos
          </Link>
          <h1 className="mb-2 text-4xl font-bold text-white">
            {establishment?.name || `Estabelecimento #${establishmentId}`}
          </h1>
          <p className="text-lg text-gray-400">Configurações e treinamento da IA para o WhatsApp.</p>
        </div>

        <div className="rounded-2xl border border-gray-200/20 bg-white/95 p-6 shadow-lg backdrop-blur-sm">
          <Tabs
            tabsStyle="border-b border-gray-200 mb-6"
            contentClassName="pt-2"
            tabs={[
              {
                title: 'Dados do estabelecimento',
                content: (
                  <div className="space-y-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2 text-gray-900">
                      <MdBusiness size={20} />
                      <span className="font-semibold">Informações básicas</span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Nome</p>
                        <p className="font-medium">{establishment?.name || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">E-mail</p>
                        <p className="font-medium">{establishment?.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Telefone</p>
                        <p className="font-medium">{establishment?.phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                        <p className="font-medium">{establishment?.status || '—'}</p>
                      </div>
                    </div>
                    <p className="text-gray-500">
                      Para alterar cadastro comercial, use a tela de negócios em{' '}
                      <Link href="/admin/commodities" className="text-blue-600 hover:underline">
                        Gerenciar Negócios
                      </Link>
                      .
                    </p>
                  </div>
                ),
              },
              {
                title: 'Treinamento da IA (Regras da Casa)',
                content: <EstablishmentFaqSection establishmentId={establishmentId} />,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
