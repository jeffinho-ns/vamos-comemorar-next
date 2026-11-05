/**
 * Abas do BI Seu Justino (bi_menu_access na UEP).
 * Só vale para o estabelecimento Seu Justino, com o menu "bi-justino" marcado.
 */

export type BiJustinoMenuKey =
  | "master"
  | "operacao"
  | "marketing"
  | "financeiro"
  | "rh"
  | "cmv"
  | "eventos"
  | "reservas"
  | "auditoriaop"
  | "auditoria"
  | "documentos"
  | "manual"
  | "contatos";

export interface BiJustinoMenuItem {
  key: BiJustinoMenuKey;
  label: string;
}

export const BI_JUSTINO_MENU_ITEMS: BiJustinoMenuItem[] = [
  { key: "master", label: "Diretoria" },
  { key: "operacao", label: "Gerente Operador" },
  { key: "marketing", label: "Marketing" },
  { key: "financeiro", label: "Financeiro" },
  { key: "rh", label: "RH" },
  { key: "cmv", label: "CMV" },
  { key: "eventos", label: "Eventos" },
  { key: "reservas", label: "Reservas" },
  { key: "auditoriaop", label: "Auditoria Operacional" },
  { key: "auditoria", label: "Histórico Sistema" },
  { key: "documentos", label: "Documentações" },
  { key: "manual", label: "Manual Operacional" },
  { key: "contatos", label: "Contatos de Emergência" },
];

export const ALLOWED_BI_JUSTINO_MENU_KEYS: readonly BiJustinoMenuKey[] =
  BI_JUSTINO_MENU_ITEMS.map((item) => item.key);

const ALLOWED_SET = new Set<string>(ALLOWED_BI_JUSTINO_MENU_KEYS);

const ALL_PAGES = [...ALLOWED_BI_JUSTINO_MENU_KEYS];
const GERENTE_PAGES = ALL_PAGES.filter((key) => key !== "master");

const ROLE_BI_PRESETS: Record<string, BiJustinoMenuKey[]> = {
  admin: ALL_PAGES,
  gerente: GERENTE_PAGES,
};

export function sanitizeBiMenuAccess(raw: unknown): BiJustinoMenuKey[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: BiJustinoMenuKey[] = [];
  for (const item of raw) {
    const key = String(item || "").trim().toLowerCase();
    if (!key || !ALLOWED_SET.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(key as BiJustinoMenuKey);
  }
  return out;
}

export function presetsForBiRole(role?: string | null): BiJustinoMenuKey[] {
  const normalized = String(role || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  return [...(ROLE_BI_PRESETS[normalized] || [])];
}
