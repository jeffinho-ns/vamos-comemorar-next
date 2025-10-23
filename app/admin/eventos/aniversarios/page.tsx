"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AniversariosPage() {
  const router = useRouter();

  useEffect(() => {
    // Redireciona automaticamente para o módulo de aniversários existente
    router.push('/reserva-aniversario');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Redirecionando...</h2>
        <p className="text-gray-600">Você será redirecionado para o módulo de aniversários</p>
      </div>
    </div>
  );
}





