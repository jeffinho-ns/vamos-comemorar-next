/**
 * Catálogo público Reserva Rooftop — preferências do cliente.
 * No formulário /reservar o cliente só escolhe estas 3 opções;
 * as subáreas operacionais (LG, Gramado, PQ…) ficam no painel admin.
 */

export type ReservaRooftopPublicSubarea = {
  key: 'interna' | 'externa' | 'salao';
  label: string;
  /** Trechos do nome operacional usados para resolver area_id. */
  preferNameIncludes: string[];
};

export const RESERVA_ROOFTOP_PUBLIC_SUBAREAS: ReservaRooftopPublicSubarea[] = [
  {
    key: 'interna',
    label: 'Área Interna',
    preferNameIncludes: ['área interna', 'area interna', 'lg 1', 'lg 2', 'lg 3', 'pq 1', 'pq 2', 'pq 3', 'pq 4'],
  },
  {
    key: 'externa',
    label: 'Área Externa',
    preferNameIncludes: ['área externa', 'area externa', 'gramado', 'corredor', 'parrilha'],
  },
  {
    key: 'salao',
    label: 'Salão',
    preferNameIncludes: ['rooftop - salão', 'rooftop - salao', 'área salão', 'area salao', 'salão', 'salao', 'redário', 'redario'],
  },
];

export function getReservaRooftopPublicSubareasForSelect(): Array<{
  key: string;
  label: string;
}> {
  return RESERVA_ROOFTOP_PUBLIC_SUBAREAS.map(({ key, label }) => ({ key, label }));
}

export function findReservaRooftopPublicSubareaByKey(
  key: string,
): ReservaRooftopPublicSubarea | undefined {
  return RESERVA_ROOFTOP_PUBLIC_SUBAREAS.find((s) => s.key === key);
}

/** Resolve area_id operacional a partir da preferência pública. */
export function resolveReservaRooftopPublicAreaId(
  subareaKey: string,
  areas: Array<{ id: number; name?: string | null }>,
): string {
  const sub = findReservaRooftopPublicSubareaByKey(subareaKey);
  if (!sub || areas.length === 0) return '';

  const normalize = (value: string) =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const normalizedAreas = areas.map((a) => ({
    id: a.id,
    name: normalize(String(a.name || '')),
  }));

  // 1) Match exato da área pública (ex.: "Reserva Rooftop - Área Interna")
  const exactPublic = normalizedAreas.find((a) =>
    a.name.includes(`reserva rooftop - ${normalize(sub.label)}`),
  );
  if (exactPublic) return String(exactPublic.id);

  for (const needle of sub.preferNameIncludes) {
    const n = normalize(needle);
    const match = normalizedAreas.find((a) => a.name.includes(n));
    if (match) return String(match.id);
  }

  const rooftop = normalizedAreas.find((a) => a.name.includes('reserva rooftop'));
  return rooftop ? String(rooftop.id) : String(areas[0].id);
}
