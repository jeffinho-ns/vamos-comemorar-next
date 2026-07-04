/**
 * Headers para fetch no browser: envia Authorization quando o usuário está logado.
 * Preserva POST público anônimo (sem token) — optionalAuth na API aceita ambos.
 */
export function optionalAuthHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  if (typeof window === "undefined") return { ...extra };
  const fromCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("authToken="))
    ?.split("=")[1];
  const token = fromCookie || localStorage.getItem("authToken") || "";
  if (!token) return { ...extra };
  return { Authorization: `Bearer ${token}`, ...extra };
}
