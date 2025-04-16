// Adicione a diretiva "use client" no topo do arquivo para garantir que o componente seja renderizado no cliente.
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AcessoNegado() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar ou realizar outras ações, caso o usuário não tenha permissão
    router.push('/login');
  }, [router]);

  return (
    <div>
      <h1>Acesso Negado</h1>
      <p>Você não tem permissão para acessar essa página.</p>
    </div>
  );
}
