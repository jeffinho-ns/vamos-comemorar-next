import { useCallback, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import {
  filterEstablishmentListForUser,
  isGlobalAdminUser,
  establishmentMatchesUserScope,
} from "../utils/establishmentAccessRules";

export interface EstablishmentPermission {
  establishmentId: number;
  establishmentName: string;
  canEdit: boolean;
  canDelete: boolean;
  canView: boolean;
  canCreate: boolean;
}

export interface UserEstablishmentConfig {
  userEmail: string;
  establishmentIds: number[];
  permissions: {
    canEditOS?: boolean;
    canEditOperationalDetail?: boolean;
    canViewOS?: boolean;
    canDownloadOS?: boolean;
    canViewOperationalDetail?: boolean;
    canCreateOS?: boolean;
    canCreateOperationalDetail?: boolean;
  };
}

export interface PermissionData {
  id: number;
  user_id: number;
  user_email: string;
  establishment_id: number;
  establishment_name?: string;
  can_edit_os: boolean;
  can_edit_operational_detail: boolean;
  can_view_os: boolean;
  can_download_os: boolean;
  can_view_operational_detail: boolean;
  can_create_os: boolean;
  can_create_operational_detail: boolean;
  can_manage_reservations: boolean;
  can_manage_checkins: boolean;
  can_view_reports: boolean;
  /** Pode criar, editar e excluir reservas e lista de espera. Se false, apenas visualizar, check-in, check-out e alocar mesa. */
  can_create_edit_reservations?: boolean;
  is_active: boolean;
}

export function useEstablishmentPermissions() {
  const {
    myPermissions,
    isLoading,
    userEmail,
    role,
    error: contextError,
  } = useAppContext();
  const permissions = myPermissions as PermissionData[];
  const normalizedRole = (role || "").toLowerCase();
  const userConfig = useMemo<UserEstablishmentConfig | null>(() => {
    if (!permissions.length) return null;
    const establishmentIds = Array.from(new Set(permissions.map((p) => p.establishment_id)));
    const firstPermission = permissions[0];
    return {
      userEmail: userEmail || "",
      establishmentIds,
      permissions: {
        canEditOS: firstPermission.can_edit_os,
        canEditOperationalDetail: firstPermission.can_edit_operational_detail,
        canViewOS: firstPermission.can_view_os,
        canDownloadOS: firstPermission.can_download_os,
        canViewOperationalDetail: firstPermission.can_view_operational_detail,
        canCreateOS: firstPermission.can_create_os,
        canCreateOperationalDetail: firstPermission.can_create_operational_detail,
      },
    };
  }, [permissions, userEmail]);

  // Verifica se o usuário tem acesso a um estabelecimento específico
  const permissionsResolved = !isLoading;

  const hasAccessToEstablishment = useCallback((establishmentId: number): boolean => {
    if (
      isGlobalAdminUser(userEmail || null, normalizedRole, permissions, {
        permissionsResolved,
      })
    ) {
      return true;
    }
    if (!userConfig) return false;
    return userConfig.establishmentIds.includes(establishmentId);
  }, [userEmail, normalizedRole, permissions, permissionsResolved, userConfig]);

  // Retorna apenas os estabelecimentos permitidos para o usuário
  /** Aceita `name` (App/places) ou `nome` (ex.: página de check-ins). */
  const getFilteredEstablishments = useCallback(<
    T extends { id: number | string; name?: string; nome?: string },
  >(
    establishments: T[],
  ): T[] => {
    if (!permissionsResolved) return [];

    const visibilityScoped = filterEstablishmentListForUser(
      userEmail || undefined,
      establishments.map((est) => {
        const label =
          typeof est.name === "string" && est.name.trim() !== ""
            ? est.name
            : typeof est.nome === "string" && est.nome.trim() !== ""
              ? est.nome
              : "";
        return { ...est, name: label };
      }) as Array<{ name: string; id?: number | string }>,
    ) as T[];

    // Se tem userConfig, usar ele (prioridade)
    if (userConfig && userConfig.establishmentIds.length > 0) {
      const allowedIds = userConfig.establishmentIds.map(id => Number(id));
      
      const filtered = visibilityScoped.filter((est) => {
        const estId = typeof est.id === 'string' ? parseInt(est.id, 10) : Number(est.id);
        return establishmentMatchesUserScope(estId, allowedIds);
      });

      return filtered;
    }
    
    // Se não tem userConfig mas tem permissões ativas, usar elas
    if (permissions.length > 0 && permissions.some(p => p.is_active)) {
      const allowedIds = Array.from(new Set(
        permissions
          .filter(p => p.is_active)
          .map(p => p.establishment_id)
      ));
      
      const filtered = visibilityScoped.filter((est) => {
        const estId = typeof est.id === 'string' ? parseInt(est.id, 10) : Number(est.id);
        return establishmentMatchesUserScope(estId, allowedIds);
      });
      return filtered;
    }
    
    // Admin global (sem escopo no banco) vê todos; demais sem permissão, nenhum
    if (
      isGlobalAdminUser(userEmail || null, normalizedRole, permissions, {
        permissionsResolved,
      })
    ) {
      return visibilityScoped;
    }

    return [];
  }, [permissionsResolved, userEmail, userConfig, permissions, normalizedRole]);

  // Buscar permissão específica para um estabelecimento
  const getPermissionForEstablishment = useCallback((establishmentId: number): PermissionData | null => {
    return permissions.find(p => p.establishment_id === establishmentId && p.is_active) || null;
  }, [permissions]);

  // Verifica se o usuário pode editar OS (para um estabelecimento específico)
  const canEditOS = useCallback((establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode editar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_edit_os : false;
    }
    return userConfig.permissions.canEditOS ?? false;
  }, [userConfig, getPermissionForEstablishment]);

  // Verifica se o usuário pode editar Detalhe Operacional
  const canEditOperationalDetail = useCallback((establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode editar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_edit_operational_detail : false;
    }
    return userConfig.permissions.canEditOperationalDetail ?? false;
  }, [userConfig, getPermissionForEstablishment]);

  // Verifica se o usuário pode visualizar OS
  const canViewOS = useCallback((establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode visualizar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_view_os : false;
    }
    return userConfig.permissions.canViewOS ?? true;
  }, [userConfig, getPermissionForEstablishment]);

  // Verifica se o usuário pode baixar OS
  const canDownloadOS = useCallback((establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode baixar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_download_os : false;
    }
    return userConfig.permissions.canDownloadOS ?? true;
  }, [userConfig, getPermissionForEstablishment]);

  // Verifica se o usuário pode criar OS
  const canCreateOS = useCallback((establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode criar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_create_os : false;
    }
    return userConfig.permissions.canCreateOS ?? false;
  }, [userConfig, getPermissionForEstablishment]);

  // Verifica se o usuário pode criar Detalhe Operacional
  const canCreateOperationalDetail = useCallback((establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode criar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_create_operational_detail : false;
    }
    return userConfig.permissions.canCreateOperationalDetail ?? false;
  }, [userConfig, getPermissionForEstablishment]);

  // Verifica se o usuário pode criar, editar e excluir reservas e lista de espera (no Sistema de Reservas).
  // Se false, pode apenas visualizar, fazer check-in, check-out e alocar mesa.
  const canCreateEditReservations = useCallback((establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode tudo
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? (perm.can_create_edit_reservations !== false) : false;
    }
    return permissions.some((p) => p.is_active && p.can_create_edit_reservations !== false);
  }, [userConfig, permissions, getPermissionForEstablishment]);

  // Retorna o primeiro estabelecimento permitido (útil para seleção automática)
  const getDefaultEstablishmentId = useCallback((): number | null => {
    // Verificar primeiro userConfig
    if (userConfig && userConfig.establishmentIds.length > 0) {
      return userConfig.establishmentIds[0];
    }
    
    // Se não tem userConfig, verificar permissões ativas
    if (permissions.length > 0 && permissions.some(p => p.is_active)) {
      const allowedIds = Array.from(new Set(
        permissions
          .filter(p => p.is_active)
          .map(p => p.establishment_id)
      ));
      return allowedIds.length > 0 ? allowedIds[0] : null;
    }
    
    return null;
  }, [userConfig, permissions]);

  // Verifica se o usuário está restrito a um único estabelecimento
  const isRestrictedToSingleEstablishment = useCallback((): boolean => {
    // Verificar primeiro userConfig
    if (userConfig && userConfig.establishmentIds.length === 1) {
      return true;
    }
    
    // Se não tem userConfig, verificar permissões ativas
    if (permissions.length > 0 && permissions.some(p => p.is_active)) {
      const allowedIds = Array.from(new Set(
        permissions
          .filter(p => p.is_active)
          .map(p => p.establishment_id)
      ));
      return allowedIds.length === 1;
    }
    
    return false;
  }, [userConfig, permissions]);

  return useMemo(
    () => ({
      userConfig,
      permissions,
      userEmail: userEmail || null,
      isLoading,
      error: contextError,
      hasAccessToEstablishment,
      getFilteredEstablishments,
      getPermissionForEstablishment,
      canEditOS,
      canEditOperationalDetail,
      canViewOS,
      canDownloadOS,
      canCreateOS,
      canCreateOperationalDetail,
      canCreateEditReservations,
      getDefaultEstablishmentId,
      isRestrictedToSingleEstablishment,
    }),
    [
      userConfig,
      permissions,
      userEmail,
      isLoading,
      contextError,
      hasAccessToEstablishment,
      getFilteredEstablishments,
      getPermissionForEstablishment,
      canEditOS,
      canEditOperationalDetail,
      canViewOS,
      canDownloadOS,
      canCreateOS,
      canCreateOperationalDetail,
      canCreateEditReservations,
      getDefaultEstablishmentId,
      isRestrictedToSingleEstablishment,
    ],
  );
}

