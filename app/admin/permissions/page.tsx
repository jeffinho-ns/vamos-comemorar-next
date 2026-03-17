"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PermissionsAdminPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="text-center text-gray-200">
        <p className="text-lg font-semibold mb-2">
          Redirecionando para a nova tela de gestão de usuários e permissões…
        </p>
        <p className="text-sm text-gray-400">
          Caso não seja redirecionado automaticamente,{" "}
          <button
            className="underline"
            type="button"
            onClick={() => router.push('/admin/users')}
          >
            clique aqui
          </button>.
        </p>
      </div>
    </div>
  );
}
