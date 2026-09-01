/**
 * Catálogo operacional Reserva (Pinheiros) — áreas de reserva.
 * establishment_id operacional = 9 (places.id).
 * Nomes batem com restaurant_areas após migration 2026-08-31.
 */

export type ReservaSubarea = {
  key: string;
  label: string;
  areaName: string;
  description: string;
  capacityPerShift: number;
};

export const RESERVA_SUBAREAS: ReservaSubarea[] = [
  {
    key: 'deck',
    label: 'Deck',
    areaName: 'Reserva - Deck',
    description: '2 mesas 6p + 1 mesa 8p + 1 mesa 4p',
    capacityPerShift: 24,
  },
  {
    key: 'salao',
    label: 'Salão',
    areaName: 'Reserva - Salão',
    description:
      '90 cadeiras + sofás retos (14p) + sofás L (8p) + banquetas bar (6); exclui mesa diretoria',
    capacityPerShift: 118,
  },
];

export function getReservaSubareasForSelect(): Array<{ key: string; label: string; areaName: string }> {
  return RESERVA_SUBAREAS.map(({ key, label, areaName }) => ({ key, label, areaName }));
}

export function findReservaSubareaByKey(key: string): ReservaSubarea | undefined {
  return RESERVA_SUBAREAS.find((s) => s.key === key);
}

export function findReservaSubareaByAreaName(areaName: string): ReservaSubarea | undefined {
  const normalized = String(areaName || '').trim().toLowerCase();
  return RESERVA_SUBAREAS.find((s) => s.areaName.toLowerCase() === normalized);
}
