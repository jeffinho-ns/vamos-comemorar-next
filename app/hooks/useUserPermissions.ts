import { useState, useEffect } from 'react';
import { getPromoterBar, getPromoterBarByEmail, PROMOTER_BAR_MAPPINGS } from '../config/promoter-bars';

export interface UserPermissions {
  role: string;
  userId: number | null;
  userEmail: string | null;
  isAdmin: boolean;
  isPromoter: boolean;
  isClient: boolean;
  promoterBar: any | null;
  canAccessAdmin: boolean;
  canAccessCardapio: boolean;
}

export function useUserPermissions() {
  const [permissions, setPermissions] = useState<UserPermissions>({
    role: '',
    userId: null,
    userEmail: null,
    isAdmin: false,
    isPromoter: false,
    isClient: false,
    promoterBar: null,
    canAccessAdmin: false,
    canAccessCardapio: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getPermissions = () => {
      try {
        // Buscar informações dos cookies
        const cookies = document.cookie.split(';');
        const roleCookie = cookies.find(cookie => cookie.trim().startsWith('role='));
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('authToken='));

        // Buscar informações do localStorage
        const userId = localStorage.getItem('userId');
        const userEmail = localStorage.getItem('userEmail') || '';

        const role = roleCookie ? roleCookie.split('=')[1] : '';
        
        // Determinar permissões baseadas no role
        const isAdmin = role === 'admin';
        const isPromoter = role === 'promoter' || role === 'promoter-list';
        const isPromoterList = role === 'promoter-list';
        const isClient = role === 'cliente';
        
        // Buscar informações do bar associado ao promoter
        let promoterBar = null;
        
        if (isPromoter && userEmail) {
          promoterBar = getPromoterBarByEmail(userEmail);
          
          // SOLUÇÃO TEMPORÁRIA: Se não encontrou, usar mapeamento hardcoded
          if (!promoterBar) {
            if (userEmail === 'analista@pracinha.com') {
              promoterBar = {
                userId: 62,
                userEmail: 'analista@pracinha.com',
                userName: 'Analista Pracinha',
                barId: 8,
                barName: 'Pracinha do Seu Justino',
                barSlug: 'pracinha-do-seu-justino'
              };
            } else if (userEmail === 'analista.mkt03@ideiaum.com.br') {
              promoterBar = {
                userId: 0,
                userEmail: 'analista.mkt03@ideiaum.com.br',
                userName: 'Helena',
                barId: 8,
                barName: 'Pracinha do Seu Justino',
                barSlug: 'pracinha-do-seu-justino'
              };
            } else if (userEmail === 'analista@seujustino.com') {
              promoterBar = {
                userId: 59,
                userEmail: 'analista@seujustino.com',
                userName: 'Analista Seu Justino',
                barId: 1,
                barName: 'Seu Justino',
                barSlug: 'seu-justino'
              };
            } else if (userEmail === 'analista@ohfregues.com') {
              promoterBar = {
                userId: 60,
                userEmail: 'analista@ohfregues.com',
                userName: 'Analista Oh Fregues',
                barId: 4,
                barName: 'Oh Fregues',
                barSlug: 'oh-fregues'
              };
            } else if (userEmail === 'analista@highline.com') {
              promoterBar = {
                userId: 61,
                userEmail: 'analista@highline.com',
                userName: 'Analista HighLine',
                barId: 3, // Corrigido: 3 é o barId correto do Highline no banco
                barName: 'HighLine',
                barSlug: 'highline'
              };
            } else if (userEmail === 'fran@highlinebar.com.br') {
              promoterBar = {
                userId: 0, // Será atualizado quando obtivermos o ID do banco
                userEmail: 'fran@highlinebar.com.br',
                userName: 'Fran HighLine',
                barId: 3, // Corrigido: 3 é o barId correto do Highline no banco
                barName: 'HighLine',
                barSlug: 'highline'
              };
              console.log('✅ [PERMISSIONS] PromoterBar configurado para fran@highlinebar.com.br:', promoterBar);
            } else if (userEmail === 'analista@reserva.com') {
              promoterBar = {
                userId: 63,
                userEmail: 'analista@reserva.com',
                userName: 'Analista Reserva Rooftop',
                barId: 5,
                barName: 'Reserva Rooftop',
                barSlug: 'reserva-rooftop'
              };
            }
          }
        }
        
        if (isPromoter && !promoterBar && userId) {
          promoterBar = getPromoterBar(parseInt(userId));
        }

        // Definir permissões de acesso
        const canAccessAdmin = isAdmin || role === 'promoter';
        const canAccessCardapio = isAdmin || role === 'promoter';

        setPermissions({
          role,
          userId: userId ? parseInt(userId) : null,
          userEmail,
          isAdmin,
          isPromoter,
          isClient,
          promoterBar,
          canAccessAdmin,
          canAccessCardapio,
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao obter permissões do usuário:', error);
        setIsLoading(false);
      }
    };

    getPermissions();
  }, []);

  // Função para verificar se o usuário pode acessar uma rota específica
  const canAccessRoute = (route: string): boolean => {
    if (permissions.isAdmin) return true;
    
    if (permissions.role === 'promoter') {
      // Promoters podem acessar algumas funcionalidades específicas
      const allowedRoutes = [
        '/admin/cardapio',
        '/admin/events', 
        '/admin/reservas',
        '/admin/qrcode'
      ];
      return allowedRoutes.includes(route);
    }
    
    return false;
  };

  // Função para verificar se o usuário pode gerenciar um bar específico
  const canManageBar = (barId: number): boolean => {
    if (permissions.isAdmin) return true;
    
    if (permissions.isPromoter && permissions.promoterBar) {
      const promoterBarId = Number(permissions.promoterBar.barId);
      const requestedBarId = Number(barId);
      return promoterBarId === requestedBarId;
    }
    
    return false;
  };

  // Função para obter o bar que o promoter pode gerenciar
  const getPromoterBarData = () => {
    return permissions.promoterBar;
  };

  return {
    ...permissions,
    isLoading,
    canAccessRoute,
    canManageBar,
    getPromoterBarData,
  };
}
