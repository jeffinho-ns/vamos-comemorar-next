/**
 * Usuários com inbox WhatsApp restrito ao HighLine (establishment_id 7 / #EST_7).
 * Mantêm o restante do admin conforme permissões no banco — não é acesso exclusivo ao WhatsApp.
 */
export const WHATSAPP_HIGHLINE_SCOPED_EMAILS = new Set([
  "reservas@highlinebar.com.br",
]);

/** @deprecated Use WHATSAPP_HIGHLINE_SCOPED_EMAILS */
export const WHATSAPP_HIGHLINE_ONLY_EMAILS = WHATSAPP_HIGHLINE_SCOPED_EMAILS;

export const HIGHLINE_ESTABLISHMENT_ID = Number(
  process.env.NEXT_PUBLIC_HIGHLINE_ESTABLISHMENT_ID || "7",
);

export function isWhatsappHighlineScopedEmail(
  email: string | null | undefined,
): boolean {
  if (!email) return false;
  return WHATSAPP_HIGHLINE_SCOPED_EMAILS.has(email.toLowerCase().trim());
}

/** Alias legado — mesmo comportamento que isWhatsappHighlineScopedEmail */
export function isWhatsappHighlineOnlyEmail(
  email: string | null | undefined,
): boolean {
  return isWhatsappHighlineScopedEmail(email);
}
