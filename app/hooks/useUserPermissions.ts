import { useMemo } from "react";
import { useAppContext } from "../context/AppContext";

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

/** Super admins: mesmo acesso irrestrito a logs/dados que role admin (por e-mail). */
const SUPER_ADMIN_EMAILS = new Set([
  "jeffinho_ns@hotmail.com",
  "teste@teste",
]);

export function isSuperAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.has(email.toLowerCase().trim());
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
  const isSuperAdmin = isAdmin || isSuperAdminEmail(safeUserEmail);
  const isPromoter = safeRole === "promoter" || safeRole === "promoter-list";
  const isClient = safeRole === "cliente";
  const hasAnyEstablishmentAccess = myPermissions.length > 0;
  const activeEstablishmentPermissions = myPermissions.filter((p) => p.is_active);
  const hasCardapioAccess = myPermissions.some((p) => p.can_view_cardapio !== false);
  const canAccessAdmin =
    isSuperAdmin ||
    ["gerente", "atendente", "recepcao", "recepção"].includes(safeRole) ||
    hasAnyEstablishmentAccess;
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
    const first = myPermissions[0];
    const promoterBar = first
      ? {
          userId: userId ?? 0,
          userEmail: safeUserEmail,
          userName: first.establishment_name,
          barId: Number(first.establishment_id),
          barName: first.establishment_name || `Estabelecimento ${first.establishment_id}`,
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
      return isSuperAdminEmail(safeUserEmail);
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

  const canManageBar = (barId: number): boolean => {
    if (permissions.isSuperAdmin) return true;
    return permissions.myEstablishmentPermissions.some(
      (p) => Number(p.establishment_id) === Number(barId)
    );
  };

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
