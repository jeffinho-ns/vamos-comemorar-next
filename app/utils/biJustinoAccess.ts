/**
 * Quem abre o BI do Seu Justino com a conta do Agilizai.
 * A mesma lista está em services/biJustinoAccess.js na API.
 */
const BI_JUSTINO_EMAILS = new Set([
  "jeffinho_ns@hotmail.com",
  "luisfelipe@ideiaum.com.br",
  "coordenadora.reservas@ideiaum.com.br",
  "renatocury@ideiaum.com.br",
  "renato@seujustino.com.br",
]);

export function canOpenBiJustino(email?: string | null): boolean {
  return BI_JUSTINO_EMAILS.has((email || "").trim().toLowerCase());
}

/** Só o painel do BI. Evita que ?next= mande a pessoa para outro site. */
export function biJustinoReturnPath(raw: string | null | undefined): string {
  if (!raw) return "";
  let path = raw.trim();
  try {
    path = decodeURIComponent(path);
  } catch {
    return "";
  }
  if (!path.startsWith("/bi-justino") || path.startsWith("//") || path.includes("\\")) {
    return "";
  }
  if (path === "/bi-justino" || path.startsWith("/bi-justino/")) return "/bi-justino";
  return "";
}
