"use client";

import { Justino360Shell } from "../../components/justino360/Justino360Shell";
import { SaturdayMetaPanel } from "../../components/justino360/SaturdayMetaPanel";
import { useSaasAccess } from "../../hooks/useSaasAccess";

export default function StaffSaturdayMetaPage() {
  const { canAccessJustino360, isSuperAdmin, isAdmin, role, myEstablishmentPermissions } = useSaasAccess();
  const allowed = canAccessJustino360 || isSuperAdmin || isAdmin;
  const houseRole = ["gerente", "subgerente"].includes((role || "").toLowerCase());
  const canManage =
    isAdmin ||
    isSuperAdmin ||
    houseRole ||
    myEstablishmentPermissions.some(
      (permission) => Number(permission.establishment_id) === 1 && permission.can_manage_justino360,
    );
  if (!allowed) return null;
  return (
    <Justino360Shell mode="staff" title="Meta de sábado">
      <SaturdayMetaPanel canManage={canManage} />
    </Justino360Shell>
  );
}
