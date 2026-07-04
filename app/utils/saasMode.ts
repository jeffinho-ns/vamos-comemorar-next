/** Modo SaaS ativo no front (build-time env). */
export function isSaasModeEnabled(): boolean {
  return String(process.env.NEXT_PUBLIC_SAAS_MODE || "").toLowerCase() === "on";
}
