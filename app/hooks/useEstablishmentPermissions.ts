import { useState, useEffect } from 'react';

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
  is_active: boolean;
}

export function useEstablishmentPermissions() {
  const [userConfig, setUserConfig] = useState<UserEstablishmentConfig | null>(null);
  const [permissions, setPermissions] = useState<PermissionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const email = localStorage.getItem('userEmail') || '';
        const token = localStorage.getItem('authToken');
        
        setUserEmail(email);

        if (!email || !token) {
          setIsLoading(false);
          return;
        }

        // Buscar permissões do backend
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://vamos-comemorar-api.onrender.com';
        const response = await fetch(`${API_URL}/api/establishment-permissions/my-permissions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          // Se não tem permissões configuradas, permite acesso total (admin)
          if (response.status === 404 || response.status === 403) {
            setUserConfig(null);
            setPermissions([]);
            setIsLoading(false);
            return;
          }
          throw new Error('Erro ao buscar permissões');
        }

        const data = await response.json();
        
        if (data.success && data.data && data.data.length > 0) {
          const permissionsData = data.data as PermissionData[];
          setPermissions(permissionsData);
          
          // Converter para formato UserEstablishmentConfig
          const establishmentIds = permissionsData.map(p => p.establishment_id);
          const firstPermission = permissionsData[0];
          
          const config: UserEstablishmentConfig = {
            userEmail: email,
            establishmentIds: establishmentIds,
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
          
          setUserConfig(config);
        } else {
          // Se não tem permissões configuradas, permite acesso total (admin)
          setUserConfig(null);
          setPermissions([]);
        }
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        setError(error instanceof Error ? error.message : 'Erro desconhecido');
        // Em caso de erro, permite acesso total (fallback para admin)
        setUserConfig(null);
        setPermissions([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserPermissions();
  }, []);

  // Verifica se o usuário tem acesso a um estabelecimento específico
  const hasAccessToEstablishment = (establishmentId: number): boolean => {
    if (!userConfig) return true; // Admin tem acesso total
    return userConfig.establishmentIds.includes(establishmentId);
  };

  // Retorna apenas os estabelecimentos permitidos para o usuário
  const getFilteredEstablishments = <T extends { id: number | string }>(
    establishments: T[]
  ): T[] => {
    if (!userConfig) return establishments; // Admin vê todos
    return establishments.filter((est) => {
      const estId = typeof est.id === 'string' ? parseInt(est.id) : est.id;
      return userConfig.establishmentIds.includes(estId);
    });
  };

  // Buscar permissão específica para um estabelecimento
  const getPermissionForEstablishment = (establishmentId: number): PermissionData | null => {
    return permissions.find(p => p.establishment_id === establishmentId && p.is_active) || null;
  };

  // Verifica se o usuário pode editar OS (para um estabelecimento específico)
  const canEditOS = (establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode editar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_edit_os : false;
    }
    return userConfig.permissions.canEditOS ?? false;
  };

  // Verifica se o usuário pode editar Detalhe Operacional
  const canEditOperationalDetail = (establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode editar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_edit_operational_detail : false;
    }
    return userConfig.permissions.canEditOperationalDetail ?? false;
  };

  // Verifica se o usuário pode visualizar OS
  const canViewOS = (establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode visualizar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_view_os : false;
    }
    return userConfig.permissions.canViewOS ?? true;
  };

  // Verifica se o usuário pode baixar OS
  const canDownloadOS = (establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode baixar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_download_os : false;
    }
    return userConfig.permissions.canDownloadOS ?? true;
  };

  // Verifica se o usuário pode criar OS
  const canCreateOS = (establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode criar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_create_os : false;
    }
    return userConfig.permissions.canCreateOS ?? false;
  };

  // Verifica se o usuário pode criar Detalhe Operacional
  const canCreateOperationalDetail = (establishmentId?: number): boolean => {
    if (!userConfig) return true; // Admin pode criar
    if (establishmentId) {
      const perm = getPermissionForEstablishment(establishmentId);
      return perm ? perm.can_create_operational_detail : false;
    }
    return userConfig.permissions.canCreateOperationalDetail ?? false;
  };

  // Retorna o primeiro estabelecimento permitido (útil para seleção automática)
  const getDefaultEstablishmentId = (): number | null => {
    if (!userConfig || userConfig.establishmentIds.length === 0) return null;
    return userConfig.establishmentIds[0];
  };

  // Verifica se o usuário está restrito a um único estabelecimento
  const isRestrictedToSingleEstablishment = (): boolean => {
    if (!userConfig) return false;
    return userConfig.establishmentIds.length === 1;
  };

  return {
    userConfig,
    permissions,
    userEmail,
    isLoading,
    error,
    hasAccessToEstablishment,
    getFilteredEstablishments,
    getPermissionForEstablishment,
    canEditOS,
    canEditOperationalDetail,
    canViewOS,
    canDownloadOS,
    canCreateOS,
    canCreateOperationalDetail,
    getDefaultEstablishmentId,
    isRestrictedToSingleEstablishment,
  };
}

