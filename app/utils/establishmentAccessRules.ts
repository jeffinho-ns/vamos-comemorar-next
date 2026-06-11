/**
 * Regras de visibilidade de estabelecimentos (UI + alinhamento com API).
 * - Regiane: apenas Highline e grupo Seu Justino (inclui Pracinha). Sitio Ilha é outro estabelecimento (só cardápio).
 * - Sitio Ilha: visível apenas para o e-mail autorizado (demais usuários não veem em listagens nem cardápio público).
 */

import { SITIO_ILHA_PLACE_ID } from "../config/establishmentIds";

export const REGIANE_RESTRICTED_EMAIL = "regianebrunno@gmail.com";

/** Único usuário que enxerga o estabelecimento Sitio Ilha em todo o app (listas, admin filtrado, cardápio). */
export const SITIO_ILHA_OWNER_EMAIL = "jeffinho_ns@hotmail.com";

/** Admin global (todos os estabelecimentos) — por e-mail ou role admin sem escopo no banco. */
const GLOBAL_SUPER_ADMIN_EMAILS = new Set([
  "jeffinho_ns@hotmail.com",
  "teste@teste",
]);

export type EstablishmentPermissionLike = {
  is_active?: boolean;
  establishment_id?: number;
};

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return GLOBAL_SUPER_ADMIN_EMAILS.has(normalizeUserEmail(email));
}

export type GlobalAdminOptions = {
  /** Quando false, admin sem permissões ainda não carregadas não é tratado como global. */
  permissionsResolved?: boolean;
};

/** Admin com permissões ativas por estabelecimento vê só o escopo; admin sem linhas no banco = global. */
export function isGlobalAdminUser(
  email: string | null | undefined,
  role: string | null | undefined,
  permissions: EstablishmentPermissionLike[] = [],
  options: GlobalAdminOptions = {},
): boolean {
  if (isSuperAdminEmail(email)) return true;
  const normalizedRole = (role || "").trim().toLowerCase();
  if (normalizedRole !== "admin") return false;
  if (options.permissionsResolved === false) return false;
  const active = permissions.filter((p) => p.is_active !== false);
  return active.length === 0;
}

export function getActiveEstablishmentIds(
  permissions: EstablishmentPermissionLike[] = [],
): number[] {
  return Array.from(
    new Set(
      permissions
        .filter((p) => p.is_active !== false)
        .map((p) => Number(p.establishment_id))
        .filter((id) => Number.isFinite(id) && id > 0),
    ),
  );
}

export function filterEstablishmentsByUserScope<
  T extends { name?: string; id?: string | number; slug?: string },
>(
  userEmail: string | null | undefined,
  role: string | null | undefined,
  permissions: EstablishmentPermissionLike[],
  establishments: T[],
  options: GlobalAdminOptions = {},
): T[] {
  const visibilityScoped = filterEstablishmentListForUser(userEmail, establishments);
  if (isGlobalAdminUser(userEmail, role, permissions, options)) {
    return visibilityScoped;
  }
  const allowedIds = new Set(getActiveEstablishmentIds(permissions));
  if (allowedIds.size === 0) return [];
  return visibilityScoped.filter((est) => allowedIds.has(Number(est.id)));
}

export function normalizeUserEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

/** Retorna true se o usuário pode ver dados do Sitio Ilha (listas, cardápio /cardapio/sitio-ilha, permissões). */
export function canUserAccessSitioIlha(userEmail: string | null | undefined): boolean {
  return normalizeUserEmail(userEmail) === normalizeUserEmail(SITIO_ILHA_OWNER_EMAIL);
}

function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isSitioIlhaEstablishmentLike(item: {
  name?: string | null;
  slug?: string | null;
  id?: string | number | null;
}): boolean {
  const slug = String(item.slug ?? "")
    .trim()
    .toLowerCase();
  if (slug === "sitio-ilha") return true;
  const numId = item.id != null ? Number(item.id) : NaN;
  if (!Number.isNaN(numId) && numId === SITIO_ILHA_PLACE_ID) return true;
  const rawName = item.name;
  if (!rawName || typeof rawName !== "string") return false;
  const n = stripDiacritics(rawName.toLowerCase());
  return n.includes("sitio") && n.includes("ilha");
}

export function isHighlineOrSeuJustinoGroupName(name: string | undefined): boolean {
  if (!name) return false;
  const n = stripDiacritics(name.toLowerCase());
  if (n.includes("sitio") && n.includes("ilha")) return false;
  if (n.includes("high")) return true;
  if (n.includes("seu justino")) return true;
  if (n.includes("pracinha")) return true;
  return false;
}

function isSitioIlhaPermissionRow<T extends { establishment_name?: string; establishment_id?: number }>(
  p: T,
): boolean {
  const estId = p.establishment_id;
  if (estId != null && Number(estId) === SITIO_ILHA_PLACE_ID) return true;
  return isSitioIlhaEstablishmentLike({ name: p.establishment_name });
}

export function filterEstablishmentPermissionsForUser<
  T extends { establishment_name?: string; establishment_id?: number },
>(userEmail: string | null | undefined, permissions: T[]): T[] {
  const e = normalizeUserEmail(userEmail);
  let out = [...permissions];

  if (e === REGIANE_RESTRICTED_EMAIL) {
    out = out.filter((p) => isHighlineOrSeuJustinoGroupName(p.establishment_name));
  }

  if (!canUserAccessSitioIlha(userEmail)) {
    out = out.filter((p) => !isSitioIlhaPermissionRow(p));
  }

  return out;
}

export function filterEstablishmentListForUser<
  T extends { name?: string; id?: string | number; slug?: string },
>(userEmail: string | null | undefined, establishments: T[]): T[] {
  const e = normalizeUserEmail(userEmail);
  let out = [...establishments];

  if (e === REGIANE_RESTRICTED_EMAIL) {
    out = out.filter((est) => isHighlineOrSeuJustinoGroupName(est.name || ""));
  }

  if (!canUserAccessSitioIlha(userEmail)) {
    out = out.filter((est) => !isSitioIlhaEstablishmentLike(est));
  }

  return out;
}
