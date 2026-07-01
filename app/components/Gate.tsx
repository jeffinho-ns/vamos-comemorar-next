"use client";

/**
 * <Gate> — renderização condicional por módulo/permissão (UI).
 *
 * FAIL-OPEN: com entitlements em allowAll (modo SaaS off), sempre renderiza os
 * filhos — não altera nada da UI atual. Use `module` e/ou `permission`.
 *
 *   <Gate module="reservas"><BotaoReservar /></Gate>
 *   <Gate permission="checkin:update" fallback={null}><CheckinBtn /></Gate>
 */

import { type ReactNode } from "react";
import { useCan } from "../hooks/useCan";

interface GateProps {
  module?: string;
  permission?: string;
  fallback?: ReactNode;
  children: ReactNode;
}

export function Gate({ module, permission, fallback = null, children }: GateProps) {
  const { canModule, canPermission } = useCan();

  const moduleOk = module ? canModule(module) : true;
  const permissionOk = permission ? canPermission(permission) : true;

  return moduleOk && permissionOk ? <>{children}</> : <>{fallback}</>;
}

export default Gate;
