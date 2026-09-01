"use client";

import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { RhIdeiaPlaybook } from "../../../components/rhIdeia/RhIdeiaPlaybook";
import { useSaasAccess } from "../../../hooks/useSaasAccess";

export default function RhIdeiaAdminGuiaPage() {
  const { canAccessRhIdeia, canManageRhIdeia, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessRhIdeia || canManageRhIdeia || isSuperAdmin || isAdmin;

  return (
    <AdminSaasGuard allowed={allowed}>
      <RhIdeiaPlaybook mode="admin" />
    </AdminSaasGuard>
  );
}
