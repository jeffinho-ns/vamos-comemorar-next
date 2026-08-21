/**
 * Justino360 — metadados de documentos versionados.
 * Espelha a whitelist da API (routes/justino360/documents.js).
 */

export const DOCUMENT_CATEGORIES = [
  { value: "pop", label: "POP" },
  { value: "manual", label: "Manual" },
  { value: "procedimento", label: "Procedimento" },
  { value: "laudo", label: "Laudo / relatório externo" },
  { value: "certificado", label: "Certificado" },
  { value: "ata", label: "Ata" },
  { value: "outro", label: "Outro" },
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number]["value"];

/** Categorias antigas que ainda existem no banco e precisam de rótulo. */
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  ficha: "Ficha técnica",
  norma: "Norma",
};

export const DOCUMENT_ROLES = [
  { value: "garcom", label: "Garçom" },
  { value: "barman", label: "Barman" },
  { value: "caixa", label: "Caixa" },
  { value: "cozinha", label: "Cozinha" },
  { value: "copa", label: "Copa" },
  { value: "limpeza", label: "Limpeza" },
  { value: "seguranca", label: "Segurança" },
  { value: "recepcao", label: "Recepção" },
  { value: "maitre", label: "Maître" },
  { value: "runner", label: "Runner" },
  { value: "gerencia", label: "Gerência" },
] as const;

export type DocumentRole = (typeof DOCUMENT_ROLES)[number]["value"];

/**
 * Relatórios externos entram como `laudo` — sem tabela nova. O tipo do laudo
 * fica no título para manter a busca simples.
 */
export const EXTERNAL_REPORT_HINTS = [
  "Nutricionista",
  "Dedetização",
  "Auditoria",
  "Bombeiro",
  "Vigilância Sanitária",
] as const;

export type J360Document = {
  id: number;
  title: string;
  category: string;
  role_key?: string | null;
  description?: string | null;
  file_url?: string | null;
  sector_id?: number | null;
  sector_name?: string | null;
  uploaded_by_name?: string | null;
  version: number;
  is_current: boolean;
  replaces_id?: number | null;
  has_history?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type J360Sector = {
  id: number;
  key: string;
  name: string;
};

export function categoryLabel(value: string): string {
  const found = DOCUMENT_CATEGORIES.find((c) => c.value === value);
  if (found) return found.label;
  return LEGACY_CATEGORY_LABELS[value] || value;
}

export function roleLabel(value?: string | null): string {
  if (!value) return "Todas as funções";
  const found = DOCUMENT_ROLES.find((r) => r.value === value);
  return found ? found.label : value;
}
