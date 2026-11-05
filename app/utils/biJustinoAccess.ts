/**
 * Mesma lista da API (services/biJustino/access.js). Não abre o BI para a equipe inteira.
 * renatocury@ideiaum.com.br é o Renato Cury. renato@ideiaum.com.br (promoter) não entra.
 * carolline.moreira@ideiaum.com.br entra em tudo, menos na Diretoria.
 * gabrielmenda@ideiaum.com.br entra só em Marketing, Eventos, Reservas, Documentos, Manual e Contatos.
 * gerente.sjm@seujustino.com.br entra só em Gerente Operador, Documentos, Manual e Contatos.
 *
 * Entitlements.biMenuAccess (UEP bi_menu_access) manda quando preenchido.
 * A allowlist de e-mail só entra como fallback.
 */

import {
  hasActiveMenuAccess,
  menuAccessIncludes,
} from "../config/adminMenuAccess";

const BI_JUSTINO_EMAILS = new Set([
  "renatocury@ideiaum.com.br",
  "renato@seujustino.com.br",
  "coordenadora.reservas@ideiaum.com.br",
  "luisfelipe@ideiaum.com.br",
  "gabrielmenda@ideiaum.com.br",
  "carolline.moreira@ideiaum.com.br",
  "gerente.sjm@seujustino.com.br",
]);

export const BI_JUSTINO_PAGINAS = [
  "master",
  "operacao",
  "marketing",
  "financeiro",
  "rh",
  "cmv",
  "eventos",
  "reservas",
  "auditoriaop",
  "auditoria",
  "documentos",
  "manual",
  "contatos",
] as const;

const BI_JUSTINO_ESCOPOS: Record<string, readonly string[]> = {
  "carolline.moreira@ideiaum.com.br": BI_JUSTINO_PAGINAS.filter((id) => id !== "master"),
  "gabrielmenda@ideiaum.com.br": ["marketing", "eventos", "reservas", "documentos", "manual", "contatos"],
  "gerente.sjm@seujustino.com.br": ["operacao", "documentos", "manual", "contatos"],
};

const BI_JUSTINO_PAGINA_SET = new Set<string>(BI_JUSTINO_PAGINAS);

function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

export function parseBiMenuAccess(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const key = String(item || "").trim().toLowerCase();
    if (!key || !BI_JUSTINO_PAGINA_SET.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function collectUepBiMenuAccess(
  rows?: Array<{ bi_menu_access?: unknown; biMenuAccess?: unknown }> | null,
): string[] {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    for (const page of parseBiMenuAccess(row?.biMenuAccess ?? row?.bi_menu_access)) {
      if (seen.has(page)) continue;
      seen.add(page);
      out.push(page);
    }
  }
  return out;
}

export function effectiveBiMenuAccess(
  fromEntitlements?: unknown,
  uepRows?: Array<{ bi_menu_access?: unknown; biMenuAccess?: unknown }> | null,
): string[] {
  const fromApi = parseBiMenuAccess(fromEntitlements);
  if (fromApi.length > 0) return fromApi;
  return collectUepBiMenuAccess(uepRows);
}

/** Allowlist de e-mail — fallback legado. */
export function canAccessBiJustino(email?: string | null): boolean {
  return BI_JUSTINO_EMAILS.has(normalizeEmail(email));
}

export function resolveBiJustinoPages(args: {
  email?: string | null;
  biMenuAccess?: string[] | null;
  menuAccess?: string[] | null;
}): string[] {
  const fromEntitlements = parseBiMenuAccess(args.biMenuAccess);
  if (fromEntitlements.length > 0) return fromEntitlements;
  const email = normalizeEmail(args.email);
  if (!email) return [];
  const recorte = BI_JUSTINO_ESCOPOS[email];
  if (recorte) return [...recorte];
  if (BI_JUSTINO_EMAILS.has(email)) return [...BI_JUSTINO_PAGINAS];
  return [];
}

export function canEnterBiJustino(args: {
  email?: string | null;
  isSuperAdmin?: boolean;
  menuAccess?: string[] | null;
  biMenuAccess?: string[] | null;
}): boolean {
  if (args.isSuperAdmin) return true;
  const pages = parseBiMenuAccess(args.biMenuAccess);
  if (hasActiveMenuAccess(args.menuAccess)) {
    return menuAccessIncludes(args.menuAccess, "bi-justino") && pages.length > 0;
  }
  return canAccessBiJustino(args.email);
}

export function paginasBiJustino(email?: string | null): string[] {
  return resolveBiJustinoPages({ email, biMenuAccess: [] });
}

export function podePaginaBiJustino(
  email: string | null | undefined,
  pagina: string,
  biMenuAccess?: string[] | null,
  menuAccess?: string[] | null,
): boolean {
  return resolveBiJustinoPages({ email, biMenuAccess, menuAccess }).includes(
    (pagina || "").trim().toLowerCase(),
  );
}

export function paginasVisiveisBiJustino<T extends { id: string }>(
  email: string | null | undefined,
  paginas: T[],
  biMenuAccess?: string[] | null,
  menuAccess?: string[] | null,
): T[] {
  const ids = new Set(resolveBiJustinoPages({ email, biMenuAccess, menuAccess }));
  if (ids.size === 0) return [];
  return paginas.filter((item) => ids.has(item.id));
}
