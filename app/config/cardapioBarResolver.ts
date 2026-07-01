/**
 * IDs em user_establishment_permissions referem-se em geral à tabela `places`.
 * O admin de cardápio (/api/cardapio) usa a tabela `bars` — os IDs nem sempre coincidem.
 */

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
  const mapped = ESTABLISHMENT_TO_CARDAPIO_BAR_ID[est];
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

    const mapped = ESTABLISHMENT_TO_CARDAPIO_BAR_ID[estId];
    if (Number.isFinite(mapped) && mapped > 0) {
      resolved.add(mapped);
      continue;
    }

    // Só aceita id direto quando não há place mapeado (evita place 4 → bar Pracinha id 4).
    if (barById.has(estId) && ESTABLISHMENT_TO_CARDAPIO_BAR_ID[estId] == null) {
      resolved.add(estId);
      continue;
    }

    const nameMatched = matchBarIdByEstablishmentName(estId, barNameKeys);
    if (nameMatched != null) {
      resolved.add(nameMatched);
    }

    // Fallback: permissão com id de place sem mapa — tenta casar pelo nome conhecido
    const rooftopAliases = ['reserva rooftop', 'rooftop'];
    if (rooftopAliases.some((a) => estId === 9 || estId === 5)) {
      const rooftopBar = barNameKeys.find((b) => b.key.includes('reserva') && b.key.includes('rooftop'));
      if (rooftopBar) resolved.add(rooftopBar.id);
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
  const mapped = ESTABLISHMENT_TO_CARDAPIO_BAR_ID[est];
  if (Number.isFinite(mapped) && mapped > 0) return mapped === bar;
  return est === bar;
}
