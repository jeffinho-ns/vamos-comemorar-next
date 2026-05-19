/**
 * ID GA4 usado no gtag (layout global).
 *
 * Ordem: NEXT_PUBLIC_GA_ID (painel que vocês consultam) → Firebase → legado.
 * Não priorizar Firebase antes do GA_ID: env de produção costuma ter IDs diferentes
 * e o tráfego some da propriedade G-EFE3J4Z20X.
 */
const LEGACY_GA_ID = 'G-EFE3J4Z20X';

function isValidGaMeasurementId(value: string | undefined): value is string {
  const id = String(value || '').trim();
  if (!/^G-[A-Z0-9]+$/i.test(id)) return false;
  if (/X{4,}/i.test(id)) return false;
  return true;
}

export function resolveGaMeasurementId(): string {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const firebaseId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  if (isValidGaMeasurementId(gaId)) return gaId;
  if (isValidGaMeasurementId(firebaseId)) return firebaseId;
  return LEGACY_GA_ID;
}

export function getGaMeasurementId(): string {
  return resolveGaMeasurementId();
}

export function areGaIdsMisconfigured(): boolean {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const firebaseId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  if (!isValidGaMeasurementId(gaId) || !isValidGaMeasurementId(firebaseId)) {
    return false;
  }
  return gaId !== firebaseId;
}
