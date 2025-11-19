"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EventosPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente para o dashboard
    router.push('/admin/eventos/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
      </div>
    </div>
  );
}








