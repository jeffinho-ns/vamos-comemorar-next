import { useState, useEffect } from 'react';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_URL_LOCAL ||
  "https://vamos-comemorar-api.onrender.com";

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
  const [permissions, setPermissions] = useState<UserPermissions>({
    role: "",
    userId: null,
    userEmail: null,
    isAdmin: false,
    isPromoter: false,
    isClient: false,
    promoterBar: null,
    canAccessAdmin: false,
    canAccessCardapio: false,
    myEstablishmentPermissions: [],
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const cookies = document.cookie.split(";");
    const roleCookie = cookies.find((c) => c.trim().startsWith("role="));
    let userEmail = (localStorage.getItem("userEmail") || "").trim();
    if (!userEmail) {
      const emailCookie = cookies.find((c) => c.trim().startsWith("userEmail="));
      if (emailCookie) {
        try {
          userEmail = decodeURIComponent(
            (emailCookie.split("=").slice(1).join("=") || "").trim()
          );
        } catch {
          userEmail = (emailCookie.split("=").slice(1).join("=") || "").trim();
        }
      }
    }
    userEmail = (userEmail || "").trim();

    const userIdStr = localStorage.getItem("userId");
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;
    const role = roleCookie ? roleCookie.split("=")[1]?.trim() || "" : "";

    const isAdmin = role === "admin";
    const isPromoter = role === "promoter" || role === "promoter-list";
    const isClient = role === "cliente";

    const applyPermissions = (myPerms: MyEstablishmentPermission[]) => {
      const hasAnyEstablishmentAccess = myPerms.length > 0;
      const hasCardapioAccess = myPerms.some((p) => p.can_view_cardapio !== false);
      const first = myPerms[0];
      const promoterBar = first
        ? {
            userId: userId ?? 0,
            userEmail: userEmail || "",
            userName: first.establishment_name,
            barId: Number(first.establishment_id),
            barName: first.establishment_name || `Estabelecimento ${first.establishment_id}`,
            barSlug: slugify(first.establishment_name || ""),
          }
        : null;
      const canAccessAdmin =
        isAdmin ||
        ["gerente", "atendente", "recepcao"].includes(role) ||
        hasAnyEstablishmentAccess;
      const canAccessCardapio = isAdmin || hasCardapioAccess;

      setPermissions({
        role,
        userId,
        userEmail: userEmail || null,
        isAdmin,
        isPromoter,
        isClient,
        promoterBar,
        canAccessAdmin,
        canAccessCardapio,
        myEstablishmentPermissions: myPerms,
      });
    };

    const token = localStorage.getItem("authToken");
    if (!token) {
      applyPermissions([]);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    fetch(`${API_URL}/api/establishment-permissions/my-permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : { success: false, data: [] }))
      .then((data: { success?: boolean; data?: MyEstablishmentPermission[] }) => {
        if (cancelled) return;
        const myPerms =
          data.success && Array.isArray(data.data) ? data.data : [];
        applyPermissions(myPerms);
      })
      .catch(() => {
        if (cancelled) return;
        applyPermissions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
