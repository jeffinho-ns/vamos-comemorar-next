/** Acesso exclusivo ao inbox WhatsApp do HighLine (establishment_id 7 / #EST_7). */
export const WHATSAPP_HIGHLINE_ONLY_EMAILS = new Set([
  "reservas@highlinebar.com.br",
]);

export const HIGHLINE_ESTABLISHMENT_ID = Number(
  process.env.NEXT_PUBLIC_HIGHLINE_ESTABLISHMENT_ID || "7",
);

export function isWhatsappHighlineOnlyEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return WHATSAPP_HIGHLINE_ONLY_EMAILS.has(email.toLowerCase().trim());
}
