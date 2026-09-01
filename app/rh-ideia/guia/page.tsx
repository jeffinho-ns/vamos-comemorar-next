"use client";

import { RhIdeiaPlaybook } from "../../components/rhIdeia/RhIdeiaPlaybook";
import { useSaasAccess } from "../../hooks/useSaasAccess";

export default function RhIdeiaStaffGuiaPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-teal-950 text-white">
        <p className="text-slate-400">Sem acesso ao Ideia RH.</p>
      </div>
    );
  }

  return <RhIdeiaPlaybook mode="staff" />;
}
