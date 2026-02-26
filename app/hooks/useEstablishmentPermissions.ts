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
          // Se não tem permissões configuradas, verificar fallback para promoter restrito a um estabelecimento
          if (response.status === 404 || response.status === 403) {
            const role = localStorage.getItem('role') || '';
            // analista.mkt03@ideiaum.com.br: acesso apenas ao estabelecimento Pracinha do Seu Justino (place id 8)
            if (role === 'promoter' && email === 'analista.mkt03@ideiaum.com.br') {
              const config: UserEstablishmentConfig = {
                userEmail: email,
                establishmentIds: [8], // Pracinha do Seu Justino
                permissions: {
                  canEditOS: false,
                  canEditOperationalDetail: false,
                  canViewOS: true,
                  canDownloadOS: true,
                  canViewOperationalDetail: true,
                  canCreateOS: false,
                  canCreateOperationalDetail: false,
                },
              };
              setUserConfig(config);
              setPermissions([]);
              console.log('✅ [PERMISSIONS] Fallback analista.mkt03: restrita ao estabelecimento Pracinha do Seu Justino (id 8)');
            } else {
              setUserConfig(null);
              setPermissions([]);
            }
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
          // Agrupar IDs únicos de estabelecimentos
          const establishmentIds = Array.from(new Set(permissionsData.map(p => p.establishment_id)));
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
          console.log('✅ [PERMISSIONS] Config carregada:', config);
        } else {
          // Se não tem permissões configuradas (API retornou success mas sem dados)
          const role = localStorage.getItem('role') || '';
          if (role === 'admin') {
            setUserConfig(null);
            setPermissions([]);
          } else if (role === 'promoter' && email === 'analista.mkt03@ideiaum.com.br') {
            const config: UserEstablishmentConfig = {
              userEmail: email,
              establishmentIds: [8], // Pracinha do Seu Justino
              permissions: {
                canEditOS: false,
                canEditOperationalDetail: false,
                canViewOS: true,
                canDownloadOS: true,
                canViewOperationalDetail: true,
                canCreateOS: false,
                canCreateOperationalDetail: false,
              },
            };
            setUserConfig(config);
            setPermissions([]);
            console.log('✅ [PERMISSIONS] Fallback analista.mkt03: restrita ao estabelecimento Pracinha do Seu Justino (id 8)');
          } else {
            setUserConfig(null);
            setPermissions([]);
            console.log('⚠️ [PERMISSIONS] Usuário sem permissões específicas configuradas');
          }
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
    // Se tem userConfig, usar ele (prioridade)
    if (userConfig && userConfig.establishmentIds.length > 0) {
      // Normalizar IDs para números para comparação correta
      const allowedIds = userConfig.establishmentIds.map(id => Number(id));
      
      const filtered = establishments.filter((est) => {
        const estId = typeof est.id === 'string' ? parseInt(est.id, 10) : Number(est.id);
        const allowed = allowedIds.includes(estId);
        
        if (!allowed) {
          console.log(`🚫 [FILTER] Estabelecimento ${estId} (${(est as any).name || (est as any).nome}) não permitido. IDs permitidos: [${allowedIds.join(', ')}]`);
        } else {
          console.log(`✅ [FILTER] Estabelecimento ${estId} (${(est as any).name || (est as any).nome}) permitido`);
        }
        
        return allowed;
      });
      
      console.log(`📊 [FILTER] Resultado: ${filtered.length} de ${establishments.length} estabelecimentos permitidos`, {
        allowedIds: allowedIds,
        totalEstabelecimentos: establishments.length,
        estabelecimentosPermitidos: filtered.map(e => ({ 
          id: typeof e.id === 'string' ? parseInt(e.id, 10) : Number(e.id), 
          name: (e as any).name || (e as any).nome 
        }))
      });
      
      return filtered;
    }
    
    // Se não tem userConfig mas tem permissões ativas, usar elas
    if (permissions.length > 0 && permissions.some(p => p.is_active)) {
      // Filtrar pelos estabelecimentos das permissões ativas
      const allowedIds = Array.from(new Set(
        permissions
          .filter(p => p.is_active)
          .map(p => p.establishment_id)
      ));
      
      const filtered = establishments.filter((est) => {
        const estId = typeof est.id === 'string' ? parseInt(est.id) : est.id;
        return allowedIds.includes(estId);
      });
      console.log(`✅ [FILTER] Filtrando por permissões: ${filtered.length} de ${establishments.length} permitidos`, {
        allowedIds,
        filtered: filtered.map(e => ({ id: e.id, name: (e as any).name || (e as any).nome }))
      });
      return filtered;
    }
    
    // Se não tem userConfig nem permissões, verificar role
    const role = localStorage.getItem('role') || '';
    console.log(`⚠️ [FILTER] Sem permissões configuradas, role: ${role}, retornando todos os estabelecimentos`);
    
    // Para qualquer role sem permissões configuradas, mostrar todos
    // (o middleware já controla o acesso às rotas)
    return establishments;
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
  };

  // Verifica se o usuário está restrito a um único estabelecimento
  const isRestrictedToSingleEstablishment = (): boolean => {
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

