import { getApiUrl } from '@/app/config/api';
import {
  ESTABLISHMENT_TO_CARDAPIO_BAR_ID,
  type CardapioBarLike,
} from '@/app/config/cardapioBarResolver';
import type { EstablishmentRulesData } from '@/app/utils/establishmentRulesFlags';

export type EstablishmentRulesPayload = EstablishmentRulesData & {
  establishmentId: number;
};

let cardapioMappingsCache: Record<number, number> | null = null;
let rulesCache = new Map<number, EstablishmentRulesPayload>();

export async function fetchCardapioMappings(): Promise<Record<number, number>> {
  if (cardapioMappingsCache) return cardapioMappingsCache;
  try {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const res = await fetch(`${getApiUrl()}/api/establishments/cardapio-mappings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = await res.json();
    cardapioMappingsCache = {
      ...ESTABLISHMENT_TO_CARDAPIO_BAR_ID,
      ...(body.data || {}),
    };
  } catch {
    cardapioMappingsCache = { ...ESTABLISHMENT_TO_CARDAPIO_BAR_ID };
  }
  return cardapioMappingsCache ?? { ...ESTABLISHMENT_TO_CARDAPIO_BAR_ID };
}

export async function fetchEstablishmentRules(
  establishmentId: number,
): Promise<EstablishmentRulesPayload | null> {
  if (rulesCache.has(establishmentId)) {
    return rulesCache.get(establishmentId) || null;
  }
  try {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    const res = await fetch(
      `${getApiUrl()}/api/establishments/rules?establishment_id=${establishmentId}`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} },
    );
    const body = await res.json();
    if (body.data) {
      rulesCache.set(establishmentId, body.data);
      return body.data;
    }
  } catch {
    /* fallback abaixo */
  }
  return null;
}

export function resolveCardapioBarId(
  establishmentId: number,
  mappings?: Record<number, number>,
): number {
  const map = mappings || cardapioMappingsCache || ESTABLISHMENT_TO_CARDAPIO_BAR_ID;
  const est = Number(establishmentId);
  const mapped = map[est];
  if (Number.isFinite(mapped) && mapped > 0) return mapped;
  return est;
}

export function clearEstablishmentRulesCache(): void {
  rulesCache.clear();
  cardapioMappingsCache = null;
}

export async function prefetchEstablishmentRules(
  establishmentIds: number[],
): Promise<void> {
  const unique = [...new Set(establishmentIds.filter((id) => id > 0))];
  await Promise.all(unique.map((id) => fetchEstablishmentRules(id)));
}

export function isPracinhaProfile(profile: string | null | undefined): boolean {
  return profile === 'pracinha';
}

export function isRooftopProfile(profile: string | null | undefined): boolean {
  return profile === 'rooftop';
}

export { type CardapioBarLike };
export type { EstablishmentRulesData } from '@/app/utils/establishmentRulesFlags';
export {
  deriveEstablishmentRulesFlags,
  isRooftopEstablishment,
  isSeuJustinoEstablishment,
  fallbackPhoneForEstablishment,
} from '@/app/utils/establishmentRulesFlags';
