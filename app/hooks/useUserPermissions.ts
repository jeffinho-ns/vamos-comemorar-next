import { useCallback, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import {
  HIGHLINE_ESTABLISHMENT_ID,
  isWhatsappHighlineScopedEmail,
} from "../config/whatsapp-highline-access";
import { getPromoterBarByEmail } from "../config/promoter-bars";
import {
  establishmentGrantsCardapioBar,
  establishmentIdToCardapioBarId,
} from "../config/cardapioBarResolver";
import {
  isGlobalAdminUser,
  isSuperAdminEmail as isSuperAdminEmailRule,
} from "../utils/establishmentAccessRules";

/** Uma permissão de estabelecimento retornada por GET /api/establishment-permissions/my-permissions */
export interface MyEstablishmentPermission {
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
  can_create_edit_reservations?: boolean;
  can_view_cardapio?: boolean;
  can_create_cardapio?: boolean;
  can_edit_cardapio?: boolean;
  can_delete_cardapio?: boolean;
  is_active: boolean;
}

function slugify(name: string): string {
  return (name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export interface UserPermissions {
  role: string;
  userId: number | null;
  userEmail: string | null;
  isAdmin: boolean;
  /** Admin de sistema ou e-mail em SUPER_ADMIN_EMAILS */
  isSuperAdmin: boolean;
  isPromoter: boolean;
  isClient: boolean;
  promoterBar: {
    userId: number;
    userEmail: string;
    userName?: string;
    barId: number;
    barName: string;
    barSlug: string;
  } | null;
  canAccessAdmin: boolean;
  canAccessWhatsapp: boolean;
  /** Inbox WhatsApp do HighLine (#EST_7) com escopo na API; demais módulos seguem permissões do banco. */
  isWhatsappHighlineScopedUser: boolean;
  /** @deprecated Alias de isWhatsappHighlineScopedUser */
  isWhatsappHighlineOnlyUser: boolean;
  highlineEstablishmentId: number;
  /** Treinamento da IA por estabelecimento (regras da casa). */
  canAccessIaTraining: boolean;
  canAccessCardapio: boolean;
  /** Ver relatório de logs de ações (escopo por estabelecimento se não for super admin) */
  canViewActionLogs: boolean;
  /** Permissões por estabelecimento (fonte: banco de dados) */
  myEstablishmentPermissions: MyEstablishmentPermission[];
  /** Excluir usuários na gestão de acessos (bloqueado para Gerente geral) */
  canDeleteUsers: boolean;
  /** Alterar cargo global (role) na criação/edição de usuários (bloqueado para Gerente geral) */
  canChangeGlobalUserRole: boolean;
}

export function isSuperAdminEmail(
  email: string | null | undefined
): boolean {
  return isSuperAdminEmailRule(email);
}

/** Gerente geral: visão de todos os estabelecimentos, sem poderes de super admin (ex.: excluir usuário, mudar cargos). */
const GERENTE_GERAL_EMAILS = new Set(["luisfelipe@ideiaum.com.br"]);

export function isGerenteGeralEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  return GERENTE_GERAL_EMAILS.has(email.toLowerCase().trim());
}

const ADMIN_ALLOWED_ROUTES = [
  "/admin/restaurant-reservations",
  "/admin/eventos/dashboard",
  "/admin/eventos/promoters",
  "/admin/eventos/listas",
  "/admin/painel-eventos",
  "/admin/checkins",
  "/admin/workdays",
  "/admin/cardapio",
  "/admin/qrcode",
  "/admin/events",
  "/admin/reservas",
  "/admin/guia",
  "/admin/logs",
];

export function useUserPermissions() {
  const { isLoading, myPermissions, role, user, userEmail: ctxUserEmail } =
    useAppContext();

  const userId = user?.id ?? null;
  const safeRole = (role || "").trim().toLowerCase();
  const safeUserEmail = (ctxUserEmail || "").trim();
  const isAdmin = safeRole === "admin";
  const activeEstablishmentPermissions = myPermissions.filter((p) => p.is_active);
  const isSuperAdmin =
    !isLoading &&
    isGlobalAdminUser(safeUserEmail, safeRole, activeEstablishmentPermissions, {
      permissionsResolved: true,
    });
  const isPromoter = safeRole === "promoter" || safeRole === "promoter-list";
  const isClient = safeRole === "cliente";
  const hasAnyEstablishmentAccess = myPermissions.length > 0;
  const hasCardapioAccess = myPermissions.some((p) => p.can_view_cardapio !== false);
  const isWhatsappHighlineScopedUser = isWhatsappHighlineScopedEmail(safeUserEmail);
  const canAccessAdmin =
    isSuperAdmin ||
    ["gerente", "atendente", "recepcao", "recepção"].includes(safeRole) ||
    hasAnyEstablishmentAccess;
  const canAccessWhatsapp =
    isSuperAdmin ||
    isWhatsappHighlineScopedUser ||
    activeEstablishmentPermissions.some((p) => p.can_manage_reservations);
  const canAccessIaTraining =
    isSuperAdmin ||
    ['admin', 'gerente', 'administrador', 'recepção', 'recepcao'].includes(safeRole) ||
    activeEstablishmentPermissions.length > 0;
  const canAccessCardapio = isSuperAdmin || hasCardapioAccess;
  /** Logs: super admin ou utilizador com pelo menos um estabelecimento ativo. */
  const canViewActionLogs =
    isSuperAdmin || activeEstablishmentPermissions.length > 0;

  const isGerenteGeral = isGerenteGeralEmail(safeUserEmail);
  const canDeleteUsers =
    !isGerenteGeral &&
    (isSuperAdminEmail(safeUserEmail) || isAdmin);
  const canChangeGlobalUserRole = !isGerenteGeral;

  const permissions: UserPermissions = useMemo(() => {
    const mappedPromoter = getPromoterBarByEmail(safeUserEmail);
    const first = myPermissions[0];
    const promoterBar = mappedPromoter
      ? {
          userId: mappedPromoter.userId || userId || 0,
          userEmail: mappedPromoter.userEmail,
          userName: mappedPromoter.userName,
          barId: mappedPromoter.barId,
          barName: mappedPromoter.barName,
          barSlug: mappedPromoter.barSlug,
        }
      : first
        ? {
            userId: userId ?? 0,
            userEmail: safeUserEmail,
            userName: first.establishment_name,
            barId: establishmentIdToCardapioBarId(Number(first.establishment_id)),
            barName:
              first.establishment_name || `Estabelecimento ${first.establishment_id}`,
            barSlug: slugify(first.establishment_name || ""),
          }
        : null;
    return {
      role: safeRole,
      userId,
      userEmail: safeUserEmail || null,
      isAdmin,
      isSuperAdmin,
      isPromoter,
      isClient,
      promoterBar,
      canAccessAdmin,
      canAccessWhatsapp,
      isWhatsappHighlineScopedUser,
      isWhatsappHighlineOnlyUser: isWhatsappHighlineScopedUser,
      highlineEstablishmentId: HIGHLINE_ESTABLISHMENT_ID,
      canAccessIaTraining,
      canAccessCardapio,
      canViewActionLogs,
      myEstablishmentPermissions: myPermissions as MyEstablishmentPermission[],
      canDeleteUsers,
      canChangeGlobalUserRole,
    };
  }, [
    safeRole,
    userId,
    safeUserEmail,
    isAdmin,
    isSuperAdmin,
    isPromoter,
    isClient,
    canAccessAdmin,
    canAccessWhatsapp,
    isWhatsappHighlineScopedUser,
    canAccessIaTraining,
    canAccessCardapio,
    canViewActionLogs,
    myPermissions,
    canDeleteUsers,
    canChangeGlobalUserRole,
  ]);

  const canAccessRoute = (route: string): boolean => {
    if (
      route === "/admin/whatsapp" ||
      route.startsWith("/admin/whatsapp/")
    ) {
      return permissions.canAccessWhatsapp || permissions.canAccessIaTraining;
    }
    if (permissions.isSuperAdmin) return true;
    if (!permissions.canAccessAdmin) return false;
    if (
      route === "/admin/logs" ||
      route.startsWith("/admin/logs/")
    ) {
      return permissions.canViewActionLogs;
    }
    return (
      ADMIN_ALLOWED_ROUTES.includes(route) ||
      ADMIN_ALLOWED_ROUTES.some((r) => route.startsWith(r + "/"))
    );
  };

  const canManageBar = useCallback(
    (barId: number): boolean => {
      if (permissions.isSuperAdmin) return true;
      // Só gerencia o bar do cardápio se o estabelecimento mapear para ele E
      // tiver as permissões de cardápio ativas. Desmarcar "ver" ou "editar"
      // cardápio remove a edição mesmo mantendo o acesso ao estabelecimento.
      return permissions.myEstablishmentPermissions.some(
        (p) =>
          p.is_active !== false &&
          p.can_view_cardapio !== false &&
          p.can_edit_cardapio !== false &&
          establishmentGrantsCardapioBar(Number(p.establishment_id), Number(barId)),
      );
    },
    [permissions.isSuperAdmin, permissions.myEstablishmentPermissions],
  );

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
