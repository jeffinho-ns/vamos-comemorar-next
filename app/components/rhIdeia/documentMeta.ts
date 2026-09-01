/**
 * Ideia RH — metadados de documentos (políticas versionadas).
 * Categorias alinhadas ao PRD Fase 1.
 */

export const IRI_DOCUMENT_CATEGORIES = [
  { value: "regulamento", label: "Regulamento interno" },
  { value: "codigo_conduta", label: "Código de conduta" },
  { value: "lgpd", label: "LGPD / privacidade" },
  { value: "beneficios", label: "Benefícios" },
  { value: "procedimento", label: "Procedimento RH" },
  { value: "outro", label: "Outro" },
] as const;

export type IriDocumentCategory = (typeof IRI_DOCUMENT_CATEGORIES)[number]["value"];

export const IRI_DOCUMENT_ROLES = [
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
  { value: "rh", label: "RH / escritório" },
] as const;

export type IriDocumentRole = (typeof IRI_DOCUMENT_ROLES)[number]["value"];

export function iriCategoryLabel(value: string): string {
  const found = IRI_DOCUMENT_CATEGORIES.find((c) => c.value === value);
  return found ? found.label : value;
}

export function iriRoleLabel(value?: string | null): string {
  if (!value) return "Todas as funções";
  const found = IRI_DOCUMENT_ROLES.find((r) => r.value === value);
  return found ? found.label : value;
}
