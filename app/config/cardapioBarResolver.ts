/**
 * IDs em user_establishment_permissions referem-se em geral à tabela `places`.
 * O admin de cardápio (/api/cardapio) usa a tabela `bars` — os IDs nem sempre coincidem.
 * Mapeamento dinâmico via /api/establishments/cardapio-mappings (Fase 7).
 */

import { resolveCardapioBarId } from '@/app/utils/establishmentRulesClient';

export const ESTABLISHMENT_TO_CARDAPIO_BAR_ID: Record<number, number> = {
  // Reserva Rooftop: place 9 → bar 5 (também aceita 5 legado na permissão)
  9: 5,
  5: 5,
  // High Line: place 7 → bar 3
  7: 3,
  // Oh Freguês: place 4 → bar 2 (place 4 ≠ bar 4, que é a Pracinha no cardápio)
  4: 2,
  // Pracinha do Seu Justino: place 8 → bar 4
  8: 4,
  // Seu Justino: place 1 → bar 1
  1: 1,
  // Legado: alguns ambientes ainda referenciam bar/place 2 como Oh Freguês
  2: 2,
  // Sitio Ilha: place 10 → bar 15 (org separada; só cardápio)
  10: 15,
  15: 15,
};

export type CardapioBarLike = {
  id: number | string;
  name?: string | null;
  slug?: string | null;
};

function normalizeNameKey(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const ESTABLISHMENT_NAME_TO_BAR_NAME_HINTS: Record<number, string[]> = {
  4: ['oh fregues', 'oh freguês'],
  8: ['pracinha'],
};

function matchBarIdByEstablishmentName(
  establishmentId: number,
  barNameKeys: Array<{ id: number; key: string }>,
): number | null {
  const hints = ESTABLISHMENT_NAME_TO_BAR_NAME_HINTS[establishmentId];
  if (!hints?.length) return null;
  for (const bar of barNameKeys) {
    if (hints.some((hint) => bar.key.includes(hint))) {
      return bar.id;
    }
  }
  return null;
}

/** Converte establishment_id (places) para barId do cardápio quando possível. */
export function establishmentIdToCardapioBarId(establishmentId: number): number {
  const est = Number(establishmentId);
  if (!Number.isFinite(est) || est <= 0) return est;
  const mapped = resolveCardapioBarId(est);
  if (Number.isFinite(mapped) && mapped > 0) return mapped;
  return est;
}

/**
 * Converte establishment_id(s) das permissões para barId(s) do cardápio.
 */
export function toCardapioBarIds(
  establishmentIds: number[],
  bars: CardapioBarLike[] = []
): number[] {
  const resolved = new Set<number>();
  const barById = new Map<number, CardapioBarLike>();
  const barNameKeys: Array<{ id: number; key: string }> = [];

  for (const bar of bars) {
    const id = Number(bar.id);
    if (!Number.isFinite(id) || id <= 0) continue;
    barById.set(id, bar);
    const key = normalizeNameKey(String(bar.name || ''));
    if (key) barNameKeys.push({ id, key });
  }

  for (const raw of establishmentIds) {
    const estId = Number(raw);
    if (!Number.isFinite(estId) || estId <= 0) continue;

    // Mapa estático local tem prioridade (place 10 → bar 15, place 4 → bar 2…).
    const staticMapped = ESTABLISHMENT_TO_CARDAPIO_BAR_ID[estId];
    const resolvedMapped = resolveCardapioBarId(estId);
    const mapped =
      Number.isFinite(staticMapped) && staticMapped > 0 ? staticMapped : resolvedMapped;

    if (Number.isFinite(mapped) && mapped > 0 && mapped !== estId) {
      resolved.add(mapped);
      continue;
    }

    if (Number.isFinite(mapped) && mapped > 0 && barById.has(mapped)) {
      resolved.add(mapped);
      continue;
    }

    const nameMatched = matchBarIdByEstablishmentName(estId, barNameKeys);
    if (nameMatched != null) {
      resolved.add(nameMatched);
      continue;
    }

    // Último recurso: se a API já devolveu um único bar no escopo da org, use-o.
    if (barById.size === 1) {
      resolved.add([...barById.keys()][0]);
    }
  }

  return Array.from(resolved);
}

/** Verifica se o usuário pode gerenciar um bar do cardápio dado o establishment_id da permissão. */
export function establishmentGrantsCardapioBar(
  establishmentId: number,
  cardapioBarId: number
): boolean {
  const est = Number(establishmentId);
  const bar = Number(cardapioBarId);
  if (!Number.isFinite(est) || !Number.isFinite(bar)) return false;
  const mapped = resolveCardapioBarId(est);
  if (Number.isFinite(mapped) && mapped > 0) return mapped === bar;
  return est === bar;
}
