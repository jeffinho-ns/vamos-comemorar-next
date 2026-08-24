"use client";

import { AdminSaasGuard } from "../../../components/AdminSaasGuard";
import { Justino360Playbook } from "../../../components/justino360/Justino360Playbook";
import { useSaasAccess } from "../../../hooks/useSaasAccess";

export default function AdminGuiaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;

  return (
    <AdminSaasGuard allowed={allowed}>
      <Justino360Playbook mode="admin" />
    </AdminSaasGuard>
  );
}
