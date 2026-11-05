/**
 * Menu do admin controlado por /admin/users (menu_access na UEP).
 * Superadmin-only nunca entra por esta lista: reservas, equipe, superadmin.
 */

export type AdminMenuGroup =
  | "operacoes"
  | "eventos"
  | "cardapio"
  | "atendimento"
  | "people"
  | "config";

export type AdminMenuKey =
  | "checkins"
  | "qrcode"
  | "restaurant-reservations"
  | "workdays"
  | "eventos"
  | "painel-eventos"
  | "detalhes-operacionais"
  | "cardapio"
  | "atendimento"
  | "justino360"
  | "bi-justino"
  | "rh-ideia"
  | "users"
  | "enterprise"
  | "gifts"
  | "guia"
  | "logs";

export interface AdminMenuItem {
  key: AdminMenuKey;
  label: string;
  href: string;
  group: AdminMenuGroup;
  requiresJustino?: boolean;
}

export interface EstablishmentLike {
  id: number;
  name?: string | null;
  slug?: string | null;
}

export const ADMIN_MENU_GROUP_LABEL: Record<AdminMenuGroup, string> = {
  operacoes: "Operações",
  eventos: "Eventos",
  cardapio: "Cardápio",
  atendimento: "Atendimento",
  people: "People & Ops",
  config: "Configurações",
};

export const ADMIN_MENU_ITEMS: AdminMenuItem[] = [
  { key: "checkins", label: "Check-ins", href: "/admin/checkins", group: "operacoes" },
  { key: "qrcode", label: "Scanner QR Code", href: "/admin/qrcode", group: "operacoes" },
  {
    key: "restaurant-reservations",
    label: "Sistema de Reservas",
    href: "/admin/restaurant-reservations",
    group: "operacoes",
  },
  { key: "workdays", label: "Funcionamento", href: "/admin/workdays", group: "operacoes" },
  { key: "eventos", label: "Eventos", href: "/admin/eventos", group: "eventos" },
  {
    key: "painel-eventos",
    label: "Painel de Eventos",
    href: "/admin/painel-eventos",
    group: "eventos",
  },
  {
    key: "detalhes-operacionais",
    label: "Detalhes Operacionais do Evento",
    href: "/admin/detalhes-operacionais",
    group: "eventos",
  },
  { key: "cardapio", label: "Cardápio", href: "/admin/cardapio", group: "cardapio" },
  { key: "atendimento", label: "Atendimento", href: "/admin/whatsapp", group: "atendimento" },
  {
    key: "justino360",
    label: "Justino360",
    href: "/admin/justino360",
    group: "people",
    requiresJustino: true,
  },
  {
    key: "bi-justino",
    label: "BI Seu Justino",
    href: "/admin/bi-justino",
    group: "people",
    requiresJustino: true,
  },
  { key: "rh-ideia", label: "Ideia RH", href: "/admin/rh-ideia", group: "people" },
  { key: "users", label: "Usuários", href: "/admin/users", group: "people" },
  { key: "enterprise", label: "Empresa", href: "/admin/enterprise", group: "config" },
  { key: "gifts", label: "Brindes", href: "/admin/gifts", group: "config" },
  { key: "guia", label: "Guia Interno", href: "/admin/guia", group: "config" },
  { key: "logs", label: "Logs de Ações", href: "/admin/logs", group: "config" },
];

export const ALLOWED_MENU_KEYS: readonly AdminMenuKey[] = ADMIN_MENU_ITEMS.map(
  (item) => item.key,
);

const ALLOWED_SET = new Set<string>(ALLOWED_MENU_KEYS);

export const ADMIN_MENU_KEY_HREFS: Record<string, readonly string[]> = {
  checkins: ["/admin/checkins", "/admin/checkins/rooftop-fluxo"],
  qrcode: ["/admin/qrcode"],
  "restaurant-reservations": ["/admin/restaurant-reservations"],
  workdays: ["/admin/workdays"],
  eventos: [
    "/admin/eventos",
    "/admin/eventos/dashboard",
    "/admin/eventos/listas",
    "/admin/eventos/promoters",
  ],
  "painel-eventos": ["/admin/painel-eventos"],
  "detalhes-operacionais": ["/admin/detalhes-operacionais"],
  cardapio: ["/admin/cardapio", "/admin/commodities", "/admin/galeria"],
  atendimento: ["/admin/whatsapp"],
  justino360: ["/admin/justino360"],
  "bi-justino": ["/admin/bi-justino"],
  "rh-ideia": ["/admin/rh-ideia"],
  users: ["/admin/users"],
  enterprise: ["/admin/enterprise"],
  gifts: ["/admin/gifts"],
  guia: ["/admin/guia"],
  logs: ["/admin/logs"],
};

export const SUPERADMIN_ONLY_ADMIN_PREFIXES = [
  "/admin/reservas",
  "/admin/equipe",
  "/superadmin",
] as const;

/** Flags UEP ligadas a cada chave do menu (para POST legado). */
export const MENU_KEY_LEGACY_FLAGS: Partial<Record<AdminMenuKey, readonly string[]>> = {
  checkins: ["can_manage_checkins"],
  "restaurant-reservations": [
    "can_manage_reservations",
    "can_create_edit_reservations",
  ],
  cardapio: [
    "can_view_cardapio",
    "can_create_cardapio",
    "can_edit_cardapio",
    "can_delete_cardapio",
  ],
  atendimento: ["can_manage_whatsapp"],
  justino360: ["can_access_justino360"],
  "rh-ideia": ["can_access_rh_ideia"],
  "detalhes-operacionais": ["can_view_operational_detail"],
};

const ROLE_MENU_PRESETS: Record<string, AdminMenuKey[]> = {
  admin: [
    "checkins",
    "qrcode",
    "restaurant-reservations",
    "workdays",
    "eventos",
    "painel-eventos",
    "detalhes-operacionais",
    "cardapio",
    "atendimento",
    "justino360",
    "bi-justino",
    "rh-ideia",
    "users",
    "enterprise",
    "gifts",
    "guia",
    "logs",
  ],
  gerente: [
    "checkins",
    "qrcode",
    "restaurant-reservations",
    "workdays",
    "eventos",
    "painel-eventos",
    "detalhes-operacionais",
    "cardapio",
    "atendimento",
    "justino360",
    "bi-justino",
    "rh-ideia",
    "users",
    "guia",
  ],
  atendente: [
    "checkins",
    "qrcode",
    "restaurant-reservations",
    "detalhes-operacionais",
    "guia",
  ],
  recepcao: [
    "checkins",
    "qrcode",
    "restaurant-reservations",
    "detalhes-operacionais",
    "guia",
  ],
  usuario: ["guia"],
  cliente: [],
  promoter: ["cardapio", "eventos", "restaurant-reservations", "qrcode", "checkins"],
};

export function isSeuJustinoEstablishment(est?: EstablishmentLike | null): boolean {
  if (!est) return false;
  if (Number(est.id) === 1) return true;
  const blob = `${est.slug || ""} ${est.name || ""}`.toLowerCase();
  if (!blob.includes("justino")) return false;
  if (blob.includes("pracinha")) return false;
  return true;
}

export function sanitizeMenuAccess(raw: unknown): AdminMenuKey[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: AdminMenuKey[] = [];
  for (const item of raw) {
    const key = String(item || "").trim();
    if (!key || !ALLOWED_SET.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key as AdminMenuKey);
  }
  return out;
}

export function sanitizeMenuAccessForEstablishment(
  raw: unknown,
  est?: EstablishmentLike | null,
): AdminMenuKey[] {
  const keys = sanitizeMenuAccess(raw);
  if (isSeuJustinoEstablishment(est)) return keys;
  return keys.filter((key) => key !== "justino360" && key !== "bi-justino");
}

export function presetsForRole(role?: string | null): AdminMenuKey[] {
  const normalized = String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const mapped =
    normalized === "recepcao" || normalized === "atendente"
      ? normalized
      : normalized;
  return [...(ROLE_MENU_PRESETS[mapped] || ROLE_MENU_PRESETS.usuario)];
}

export function filterMenuItemsForEstablishments(
  items: AdminMenuItem[],
  establishments: EstablishmentLike[],
): AdminMenuItem[] {
  const hasJustino = establishments.some((est) => isSeuJustinoEstablishment(est));
  return items.filter((item) => !item.requiresJustino || hasJustino);
}

export function groupedMenuItems(items: AdminMenuItem[]) {
  const order: AdminMenuGroup[] = [
    "operacoes",
    "eventos",
    "cardapio",
    "atendimento",
    "people",
    "config",
  ];
  return order
    .map((group) => ({
      group,
      label: ADMIN_MENU_GROUP_LABEL[group],
      items: items.filter((item) => item.group === group),
    }))
    .filter((block) => block.items.length > 0);
}

export function inferMenuAccessFromLegacyFlags(
  flags: Record<string, unknown>,
): AdminMenuKey[] {
  const out: AdminMenuKey[] = [];
  const push = (key: AdminMenuKey, on: unknown) => {
    if (on) out.push(key);
  };
  push("checkins", flags.can_manage_checkins);
  push(
    "restaurant-reservations",
    flags.can_manage_reservations || flags.can_create_edit_reservations,
  );
  push("cardapio", flags.can_view_cardapio);
  push("atendimento", flags.can_manage_whatsapp);
  push("justino360", flags.can_access_justino360);
  push(
    "rh-ideia",
    flags.can_access_rh_ideia || flags.can_manage_rh_ideia || flags.can_validate_rh_ideia,
  );
  push("detalhes-operacionais", flags.can_view_operational_detail);
  return sanitizeMenuAccess(out);
}

export function parseMenuAccessKeys(raw: unknown): string[] {
  return sanitizeMenuAccess(raw);
}

export function hasActiveMenuAccess(
  keys?: string[] | null,
): keys is string[] {
  return Array.isArray(keys) && keys.length > 0;
}

export function menuAccessIncludes(
  keys: string[] | undefined | null,
  key: string,
): boolean {
  return Array.isArray(keys) && keys.includes(key);
}

export function isSuperAdminOnlyAdminPath(pathname: string): boolean {
  const path = pathname.split("?")[0];
  return SUPERADMIN_ONLY_ADMIN_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function collectMenuAccessHrefs(keys: string[]): Set<string> {
  const hrefs = new Set<string>(["/admin"]);
  for (const key of keys) {
    const mapped = ADMIN_MENU_KEY_HREFS[key];
    if (!mapped) continue;
    for (const href of mapped) hrefs.add(href);
  }
  return hrefs;
}

function pathMatchesAllowedHref(path: string, href: string): boolean {
  if (path === href || path === `${href}/`) return true;
  if (href === "/admin") return path === "/admin" || path === "/admin/";
  return path.startsWith(`${href}/`);
}

export function pathAllowedByMenuAccess(
  pathname: string,
  keys: string[],
): boolean {
  const path = pathname.split("?")[0];
  if (isSuperAdminOnlyAdminPath(path)) return false;
  if (path === "/admin" || path === "/admin/") return true;
  if (
    path === "/admin/contausuariopage" ||
    path.startsWith("/admin/contausuariopage/")
  ) {
    return true;
  }
  const allowed = collectMenuAccessHrefs(keys);
  for (const href of allowed) {
    if (pathMatchesAllowedHref(path, href)) return true;
  }
  return false;
}

export function filterNavByMenuAccess<T extends { href: string }>(
  links: T[],
  keys: string[],
): T[] {
  const allowed = collectMenuAccessHrefs(keys);
  return links.filter((link) => {
    if (isSuperAdminOnlyAdminPath(link.href)) return false;
    for (const href of allowed) {
      if (pathMatchesAllowedHref(link.href, href)) return true;
    }
    return false;
  });
}

export function uepRowsHaveMenuKey(
  rows: Array<{ menu_access?: unknown }>,
  key: string,
): boolean {
  return rows.some((row) => sanitizeMenuAccess(row.menu_access).includes(key as AdminMenuKey));
}
