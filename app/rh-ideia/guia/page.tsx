"use client";

import { RhIdeiaPlaybook } from "../../components/rhIdeia/RhIdeiaPlaybook";
import { IRI_DENIED } from "../../components/rhIdeia/ui";
import { useSaasAccess } from "../../hooks/useSaasAccess";

export default function RhIdeiaStaffGuiaPage() {
  const { canAccessRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || isSuperAdmin || isAdmin;

  if (!allowed) {
    return (
      <div className={IRI_DENIED}>
        <p>Sem acesso ao Ideia RH.</p>
      </div>
    );
  }

  return <RhIdeiaPlaybook mode="staff" />;
}
