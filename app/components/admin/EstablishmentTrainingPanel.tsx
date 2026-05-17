'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { MdPsychology } from 'react-icons/md';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';

export default function EstablishmentTrainingPanel() {
  const { establishments, loading, fetchEstablishments } = useEstablishments();
  const establishmentPermissions = useEstablishmentPermissions();

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const visibleEstablishments = establishmentPermissions.getFilteredEstablishments(establishments);

  if (loading || establishmentPermissions.isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
        Carregando estabelecimentos...
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-4 border-b border-gray-100 md:px-5">
        <h2 className="text-base font-semibold text-gray-900">Treinamento da IA por estabelecimento</h2>
        <p className="text-sm text-gray-500 mt-1">
          Ensine a IA como agir em cada casa: regras, tom e situações específicas (decorações, VIPs,
          surpresas). Não são respostas prontas — é contexto para respostas naturais no WhatsApp.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Estabelecimento</th>
              <th className="text-left px-4 py-3 font-medium">E-mail</th>
              <th className="text-left px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visibleEstablishments.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  Nenhum estabelecimento disponível para sua conta.
                </td>
              </tr>
            ) : (
              visibleEstablishments.map((establishment) => {
                const establishmentId =
                  typeof establishment.id === 'string'
                    ? parseInt(establishment.id, 10)
                    : establishment.id;

                return (
                  <tr key={establishment.id} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-medium text-gray-900">{establishment.name}</td>
                    <td className="px-4 py-3 text-gray-600">{establishment.email || '—'}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/estabelecimentos/${establishmentId}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-3 py-2 text-xs font-medium text-gray-900 shadow hover:opacity-90"
                      >
                        <MdPsychology size={16} />
                        Regras da casa
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
