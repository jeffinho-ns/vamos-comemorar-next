/**
 * Regras de visibilidade de estabelecimentos (UI + alinhamento com API).
 * - Regiane: apenas Highline e grupo Seu Justino (inclui Pracinha).
 * - Isolamento Sitio Ilha / Grupo Ideia Um: vem da API (organization_id) +
 *   UEP/entitlements — NÃO ocultar por e-mail hardcoded (staff da org precisa ver a própria casa).
 */

import { SITIO_ILHA_PLACE_ID } from "../config/establishmentIds";
import { readSuperAdminFromCookie } from "./superAdminAccess";

export const REGIANE_RESTRICTED_EMAIL = "regianebrunno@gmail.com";

/** @deprecated Preferir escopo por organization_id/entitlements. Mantido só para compat. */
export const SITIO_ILHA_OWNER_EMAIL = "jeffinho_ns@hotmail.com";

/** Admin global (todos os estabelecimentos) — somente superadmin SaaS (`isSuperAdmin=1`).
 * Admin de uma organização NÃO é global: vê só as casas da própria empresa. */

export type EstablishmentPermissionLike = {
  is_active?: boolean;
  establishment_id?: number;
};

/** Super admin SaaS — cookie `isSuperAdmin=1` setado no login a partir do JWT. */
export function isSuperAdminEmail(_email?: string | null): boolean {
  return readSuperAdminFromCookie();
}

export type GlobalAdminOptions = {
  /** Quando false, admin sem permissões ainda não carregadas não é tratado como global. */
  permissionsResolved?: boolean;
};

/** Superadmin SaaS. Admin de tenant (`role=admin` sem UEP) NÃO vê outras empresas. */
export function isGlobalAdminUser(
  email: string | null | undefined,
  _role?: string | null,
  _permissions: EstablishmentPermissionLike[] = [],
  _options: GlobalAdminOptions = {},
): boolean {
  return isSuperAdminEmail(email);
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

/**
 * Verifica se um estabelecimento (`places`) pertence ao escopo de permissões do usuário.
 *
 * IMPORTANTE: compara apenas por `places.id`. Não aplicar o mapa place→bar aqui:
 * o id de bar do cardápio colide com ids de places (ex.: Pracinha = place 8 → bar 4,
 * mas o place 4 é o Oh Freguês). Misturar os dois espaços fazia o Oh Freguês aparecer
 * para quem só tem acesso à Pracinha. Para escopo de cardápio use
 * `establishmentGrantsCardapioBar`/`toCardapioBarIds`.
 */
export function establishmentMatchesUserScope(
  itemId: number | string | undefined,
  allowedPlaceIds: number[],
): boolean {
  const id = Number(itemId);
  if (!Number.isFinite(id) || id <= 0 || allowedPlaceIds.length === 0) return false;

  return allowedPlaceIds.includes(id);
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
  const allowedIds = getActiveEstablishmentIds(permissions);
  if (allowedIds.length === 0) {
    // Sem UEP: a API já devolve só as casas da organização do usuário.
    return visibilityScoped;
  }
  return visibilityScoped.filter((est) =>
    establishmentMatchesUserScope(est.id, allowedIds),
  );
}

export function normalizeUserEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

/**
 * Acesso ao Sitio Ilha: Super Admin ou quem já tem a casa no escopo da API/UEP.
 * Não amarra mais a um e-mail único (staff da org Sitio Ilha precisa ver a própria casa).
 */
export function canUserAccessSitioIlha(
  userEmail?: string | null,
  permissions: EstablishmentPermissionLike[] = [],
): boolean {
  if (isSuperAdminEmail(userEmail)) return true;
  return getActiveEstablishmentIds(permissions).includes(SITIO_ILHA_PLACE_ID);
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

export function filterEstablishmentPermissionsForUser<
  T extends { establishment_name?: string; establishment_id?: number },
>(userEmail: string | null | undefined, permissions: T[]): T[] {
  const e = normalizeUserEmail(userEmail);
  let out = [...permissions];

  if (e === REGIANE_RESTRICTED_EMAIL) {
    out = out.filter((p) => isHighlineOrSeuJustinoGroupName(p.establishment_name));
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

  // Isolamento entre orgs: responsabilidade da API (organization_id) + UEP.
  // Não ocultar Sitio Ilha por e-mail — staff da org precisa ver a própria casa.
  return out;
}
