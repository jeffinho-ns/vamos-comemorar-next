"use client";

import type { ReactNode } from "react";
import { useRequireSaasModule } from "../hooks/useRequireSaasModule";

interface AdminSaasGuardProps {
  allowed: boolean;
  children: ReactNode;
}

/** Bloqueio de rota admin por módulo SaaS (redirect via useRequireSaasModule). */
export function AdminSaasGuard({ allowed, children }: AdminSaasGuardProps) {
  const { guardLoading } = useRequireSaasModule(allowed);

  if (guardLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Carregando permissões…</p>
      </div>
    );
  }

  return <>{children}</>;
}

export default AdminSaasGuard;
