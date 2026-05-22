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
  // Pracinha do Seu Justino: place 8 → bar 4
  8: 4,
  // Seu Justino / Oh Fregues (place e bar costumam coincidir)
  1: 1,
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

    if (barById.has(estId)) {
      resolved.add(estId);
      continue;
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
  if (est === bar) return true;
  return ESTABLISHMENT_TO_CARDAPIO_BAR_ID[est] === bar;
}
