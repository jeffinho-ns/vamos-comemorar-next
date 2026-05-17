'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Lista unificada em /admin/whatsapp?tab=treinamento */
export default function EstabelecimentosAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/whatsapp?tab=treinamento');
  }, [router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
      Redirecionando para Atendimento…
    </div>
  );
}
