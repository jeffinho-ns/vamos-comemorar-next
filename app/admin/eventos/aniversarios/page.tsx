"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSaasGuard from '@/app/components/AdminSaasGuard';
import { useSaasAccess } from '@/app/hooks/useSaasAccess';

export default function AniversariosPage() {
  const router = useRouter();
  const { canAccessEventos } = useSaasAccess();

  useEffect(() => {
    router.push('/reserva-aniversario');
  }, [router]);

  return (
    <AdminSaasGuard allowed={canAccessEventos}>
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Redirecionando...</h2>
          <p className="text-gray-600">Você será redirecionado para o módulo de aniversários</p>
        </div>
      </div>
    </AdminSaasGuard>
  );
}
