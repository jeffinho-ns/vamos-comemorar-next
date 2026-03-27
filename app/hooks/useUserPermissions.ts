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
  /** Permissões por estabelecimento (fonte: banco de dados) */
  myEstablishmentPermissions: MyEstablishmentPermission[];
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
];

export function useUserPermissions() {
  const { isLoading, myPermissions, role, user, userEmail: ctxUserEmail } =
    useAppContext();

  const userId = user?.id ?? null;
  const safeRole = (role || "").trim().toLowerCase();
  const safeUserEmail = (ctxUserEmail || "").trim();
  const isAdmin = safeRole === "admin";
  const isPromoter = safeRole === "promoter" || safeRole === "promoter-list";
  const isClient = safeRole === "cliente";
  const hasAnyEstablishmentAccess = myPermissions.length > 0;
  const hasCardapioAccess = myPermissions.some((p) => p.can_view_cardapio !== false);
  const canAccessAdmin =
    isAdmin ||
    ["gerente", "atendente", "recepcao", "recepção"].includes(safeRole) ||
    hasAnyEstablishmentAccess;
  const canAccessCardapio = isAdmin || hasCardapioAccess;

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
      isPromoter,
      isClient,
      promoterBar,
      canAccessAdmin,
      canAccessCardapio,
      myEstablishmentPermissions: myPermissions as MyEstablishmentPermission[],
    };
  }, [
    safeRole,
    userId,
    safeUserEmail,
    isAdmin,
    isPromoter,
    isClient,
    canAccessAdmin,
    canAccessCardapio,
    myPermissions,
  ]);

  const canAccessRoute = (route: string): boolean => {
    if (permissions.isAdmin) return true;
    if (!permissions.canAccessAdmin) return false;
    return (
      ADMIN_ALLOWED_ROUTES.includes(route) ||
      ADMIN_ALLOWED_ROUTES.some((r) => route.startsWith(r + "/"))
    );
  };

  const canManageBar = (barId: number): boolean => {
    if (permissions.isAdmin) return true;
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
