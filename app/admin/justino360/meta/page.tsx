"use client";

import { Justino360Shell } from "../../../components/justino360/Justino360Shell";
import { SaturdayMetaPanel } from "../../../components/justino360/SaturdayMetaPanel";
import { useSaasAccess } from "../../../hooks/useSaasAccess";

export default function AdminSaturdayMetaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  if (!allowed) return null;
  return (
    <Justino360Shell mode="admin" title="Meta de sábado">
      <SaturdayMetaPanel canManage />
    </Justino360Shell>
  );
}
