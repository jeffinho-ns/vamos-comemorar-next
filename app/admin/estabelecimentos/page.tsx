'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { MdPsychology } from 'react-icons/md';
import { useEstablishments } from '@/app/hooks/useEstablishments';
import { useEstablishmentPermissions } from '@/app/hooks/useEstablishmentPermissions';

export default function EstabelecimentosAdminPage() {
  const { establishments, loading, fetchEstablishments } = useEstablishments();
  const establishmentPermissions = useEstablishmentPermissions();

  useEffect(() => {
    fetchEstablishments();
  }, [fetchEstablishments]);

  const visibleEstablishments = establishmentPermissions.getFilteredEstablishments(establishments);

  if (loading || establishmentPermissions.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <p className="text-lg text-gray-400">Carregando estabelecimentos...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-base">
      <div className="mx-auto max-w-7xl p-8">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl font-bold text-white">Estabelecimentos</h1>
          <p className="text-lg text-gray-400">
            Gerencie o treinamento da IA e a base de conhecimento por casa.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200/20 bg-white/95 shadow-lg backdrop-blur-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-800">Nome</th>
                <th className="px-6 py-4 font-bold text-gray-800">E-mail</th>
                <th className="px-6 py-4 font-bold text-gray-800">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleEstablishments.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
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
                    <tr key={establishment.id} className="transition-colors hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-semibold text-gray-800">{establishment.name}</td>
                      <td className="px-6 py-4 text-gray-600">{establishment.email || '—'}</td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/admin/estabelecimentos/${establishmentId}`}
                          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 text-sm font-medium text-gray-900 shadow hover:opacity-90"
                        >
                          <MdPsychology size={18} />
                          Treinamento da IA
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
