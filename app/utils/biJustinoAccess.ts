/**
 * Mesma lista da API (services/biJustino/access.js). Não abre o BI para a equipe inteira.
 * renatocury@ideiaum.com.br é o Renato Cury. renato@ideiaum.com.br (promoter) não entra.
 * carolline.moreira@ideiaum.com.br entra só em RH, Documentos, Manual e Contatos.
 * gabrielmenda@ideiaum.com.br entra só em Marketing, Eventos, Reservas, Documentos, Manual e Contatos.
 */

const BI_JUSTINO_EMAILS = new Set([
  "renatocury@ideiaum.com.br",
  "renato@seujustino.com.br",
  "coordenadora.reservas@ideiaum.com.br",
  "luisfelipe@ideiaum.com.br",
  "gabrielmenda@ideiaum.com.br",
  "carolline.moreira@ideiaum.com.br",
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
  "carolline.moreira@ideiaum.com.br": ["rh", "documentos", "manual", "contatos"],
  "gabrielmenda@ideiaum.com.br": ["marketing", "eventos", "reservas", "documentos", "manual", "contatos"],
};

function normalizeEmail(email?: string | null): string {
  return (email || "").trim().toLowerCase();
}

export function canAccessBiJustino(email?: string | null): boolean {
  return BI_JUSTINO_EMAILS.has(normalizeEmail(email));
}

export function paginasBiJustino(email?: string | null): string[] {
  const recorte = BI_JUSTINO_ESCOPOS[normalizeEmail(email)];
  return recorte ? [...recorte] : [...BI_JUSTINO_PAGINAS];
}

export function podePaginaBiJustino(email: string | null | undefined, pagina: string): boolean {
  return paginasBiJustino(email).includes((pagina || "").trim().toLowerCase());
}

export function paginasVisiveisBiJustino<T extends { id: string }>(
  email: string | null | undefined,
  paginas: T[],
): T[] {
  const e = normalizeEmail(email);
  if (!e) return [];
  const ids = new Set(paginasBiJustino(e));
  return paginas.filter((item) => ids.has(item.id));
}
