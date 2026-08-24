"use client";

import { Justino360Playbook } from "../../components/justino360/Justino360Playbook";
import { useSaasAccess } from "../../hooks/useSaasAccess";

export default function StaffGuiaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <p className="text-gray-400">Sem acesso ao Justino360.</p>
      </div>
    );
  }

  return <Justino360Playbook mode="staff" />;
}
