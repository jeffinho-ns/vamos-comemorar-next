"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSaasGuard from '@/app/components/AdminSaasGuard';
import { useSaasAccess } from '@/app/hooks/useSaasAccess';

export default function EventosPage() {
  const router = useRouter();
  const { canAccessEventos } = useSaasAccess();

  useEffect(() => {
    router.push('/admin/eventos/dashboard');
  }, [router]);

  return (
    <AdminSaasGuard allowed={canAccessEventos}>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
        </div>
      </div>
    </AdminSaasGuard>
  );
}
