/**
 * Catálogo operacional Highline (áreas/mesas) — fonte única no front.
 * Espelha `services/agent/highlineReservationAreas.js` na API.
 * establishment_id operacional = 7 (places.id / HIGHLINE_ESTABLISHMENT_ID).
 *
 * area_id 2 = Deck / Bar Central / Balada (legado "Área Descoberta")
 * area_id 5 = Rooftop (legado "Terraço")
 * area_id 7001 = Rotativo (migration 2026-08-06)
 */

export type HighlineTable = {
  number: string;
  capacity: number;
};

export type HighlineSubarea = {
  key: string;
  area_id: number;
  zone: "DECK" | "BAR_CENTRAL" | "BALADA" | "ROOFTOP" | "ROTATIVO";
  label: string;
  tables: HighlineTable[];
  /** Atalho para selects/filtros (derivado de tables). */
  tableNumbers: string[];
  defaultCapacity: number;
  partyHint: string;
  /** standard = oferta padrão da IA; vip = só se pedir; rotativo = espera/overflow. */
  offerTier: "standard" | "rooftop" | "vip" | "rotativo";
  opsNote?: string;
  maxParty?: number;
};

function withTableNumbers(
  base: Omit<HighlineSubarea, "tableNumbers" | "defaultCapacity"> & {
    defaultCapacity?: number;
  },
): HighlineSubarea {
  const tableNumbers = base.tables.map((t) => t.number);
  const defaultCapacity =
    base.defaultCapacity ??
    Math.max(...base.tables.map((t) => t.capacity), 2);
  return { ...base, tableNumbers, defaultCapacity };
}

export const HIGHLINE_ROTATIVO_AREA_ID = Number(
  process.env.NEXT_PUBLIC_HIGHLINE_ROTATIVO_AREA_ID || 7001,
);

export const HIGHLINE_SUBAREAS: HighlineSubarea[] = [
  withTableNumbers({
    key: "deck-mesas",
    area_id: 2,
    zone: "DECK",
    label: "Deck - Mesas",
    offerTier: "standard",
    partyHint: "até 8 pessoas",
    tables: [
      { number: "01", capacity: 8 },
      { number: "02", capacity: 8 },
      { number: "03", capacity: 8 },
      { number: "04", capacity: 8 },
    ],
  }),
  withTableNumbers({
    key: "deck-redondas",
    area_id: 2,
    zone: "DECK",
    label: "Deck - Mesas Redondas",
    offerTier: "standard",
    partyHint: "2 a 6 pessoas",
    tables: [
      { number: "09", capacity: 6 },
      { number: "10", capacity: 6 },
      { number: "11", capacity: 6 },
      { number: "12", capacity: 6 },
      { number: "13", capacity: 2 },
      { number: "14", capacity: 2 },
    ],
  }),
  withTableNumbers({
    key: "bar-central",
    area_id: 2,
    zone: "BAR_CENTRAL",
    label: "Bar Central - Bistrôs de Espera",
    offerTier: "standard",
    partyHint: "até 2 pessoas",
    opsNote: "Consultar Roni antes de confirmar",
    tables: [
      { number: "15", capacity: 2 },
      { number: "16", capacity: 2 },
      { number: "17", capacity: 2 },
    ],
  }),
  withTableNumbers({
    key: "balada-camarotes",
    area_id: 2,
    zone: "BALADA",
    label: "Balada - Camarotes",
    offerTier: "vip",
    partyHint: "6 a 8 pessoas",
    opsNote: "Camarote 34 é de sócios — reservar avisando o Roni",
    tables: [
      { number: "30", capacity: 6 },
      { number: "31", capacity: 6 },
      { number: "32", capacity: 6 },
      { number: "33", capacity: 8 },
      { number: "34", capacity: 8 },
      { number: "35", capacity: 8 },
    ],
  }),
  withTableNumbers({
    key: "balada-bistros",
    area_id: 2,
    zone: "BALADA",
    label: "Balada - Bistrôs",
    offerTier: "vip",
    partyHint: "até 4 pessoas",
    tables: [
      { number: "20", capacity: 4 },
      { number: "21", capacity: 4 },
      { number: "22", capacity: 4 },
      { number: "23", capacity: 4 },
      { number: "24", capacity: 4 },
      { number: "25", capacity: 4 },
      { number: "26", capacity: 4 },
      { number: "27", capacity: 4 },
    ],
  }),
  withTableNumbers({
    key: "roof-lounges",
    area_id: 5,
    zone: "ROOFTOP",
    label: "Rooftop - Lounges",
    offerTier: "vip",
    partyHint: "até 6 pessoas",
    tables: [
      { number: "40", capacity: 6 },
      { number: "41", capacity: 6 },
      { number: "42", capacity: 6 },
      { number: "43", capacity: 6 },
    ],
  }),
  withTableNumbers({
    key: "roof-bangalos",
    area_id: 5,
    zone: "ROOFTOP",
    label: "Rooftop - Bangalôs",
    offerTier: "vip",
    partyHint: "até 8 pessoas",
    tables: [
      { number: "60", capacity: 8 },
      { number: "61", capacity: 8 },
      { number: "62", capacity: 8 },
      { number: "63", capacity: 8 },
      { number: "64", capacity: 8 },
      { number: "65", capacity: 8 },
    ],
  }),
  withTableNumbers({
    key: "roof-mesas",
    area_id: 5,
    zone: "ROOFTOP",
    label: "Rooftop - Mesas",
    offerTier: "rooftop",
    partyHint: "2 a 4 pessoas",
    tables: [
      { number: "50", capacity: 2 },
      { number: "51", capacity: 2 },
      { number: "52", capacity: 2 },
      { number: "53", capacity: 2 },
      { number: "54", capacity: 4 },
      { number: "55", capacity: 4 },
      { number: "56", capacity: 4 },
      { number: "74", capacity: 4 },
      { number: "75", capacity: 4 },
      { number: "76", capacity: 4 },
    ],
  }),
  withTableNumbers({
    key: "roof-bistros",
    area_id: 5,
    zone: "ROOFTOP",
    label: "Rooftop - Bistrôs",
    offerTier: "rooftop",
    partyHint: "até 2 pessoas",
    tables: [
      { number: "70", capacity: 2 },
      { number: "71", capacity: 2 },
      { number: "72", capacity: 2 },
      { number: "73", capacity: 2 },
    ],
  }),
  withTableNumbers({
    key: "rotativo-espera",
    area_id: HIGHLINE_ROTATIVO_AREA_ID,
    zone: "ROTATIVO",
    label: "Rotativo - Bistrôs de Espera",
    offerTier: "rotativo",
    partyHint: "até 4 pessoas",
    maxParty: 4,
    opsNote: "Acomoda no máximo 4 pessoas por bistrô de espera",
    tables: [
      { number: "01", capacity: 4 },
      { number: "02", capacity: 4 },
      { number: "03", capacity: 4 },
      { number: "04", capacity: 4 },
      { number: "05", capacity: 4 },
      { number: "06", capacity: 4 },
      { number: "07", capacity: 4 },
      { number: "08", capacity: 4 },
    ],
  }),
  withTableNumbers({
    key: "rotativo-lista",
    area_id: HIGHLINE_ROTATIVO_AREA_ID,
    zone: "ROTATIVO",
    label: "Rotativo - Lista de Espera",
    offerTier: "rotativo",
    partyHint: "fila de espera",
    maxParty: 4,
    tables: [
      { number: "L01", capacity: 4 },
      { number: "L02", capacity: 4 },
      { number: "L03", capacity: 4 },
      { number: "L04", capacity: 4 },
      { number: "L05", capacity: 4 },
      { number: "L06", capacity: 4 },
      { number: "L07", capacity: 4 },
      { number: "L08", capacity: 4 },
      { number: "L09", capacity: 4 },
      { number: "L10", capacity: 4 },
    ],
  }),
];

/** Compatível com o formato antigo dos modais (key/area_id/label/tableNumbers). */
export function getHighlineSubareasForSelect(): Array<{
  key: string;
  area_id: number;
  label: string;
  tableNumbers: string[];
  opsNote?: string;
}> {
  return HIGHLINE_SUBAREAS.map((s) => ({
    key: s.key,
    area_id: s.area_id,
    label: s.label,
    tableNumbers: s.tableNumbers,
    opsNote: s.opsNote,
  }));
}

export function getHighlineSubareaByTableNumber(
  tableNumber: string | null | undefined,
  areaId?: number | null,
): HighlineSubarea | null {
  const num = String(tableNumber || "")
    .split(",")[0]
    ?.trim();
  if (!num) return null;

  const matches = HIGHLINE_SUBAREAS.filter((s) => s.tableNumbers.includes(num));
  if (!matches.length) return null;

  if (areaId != null && Number.isFinite(Number(areaId))) {
    const byArea = matches.find((s) => s.area_id === Number(areaId));
    if (byArea) return byArea;
  }

  // Números 01–08 existem no Deck e no Rotativo: sem area_id, preferir oferta padrão.
  const nonRotativo = matches.find((s) => s.zone !== "ROTATIVO");
  return nonRotativo || matches[0];
}

export function getHighlineSubareaLabelForTable(
  tableNumber: string | null | undefined,
  areaId?: number | null,
): string | null {
  return getHighlineSubareaByTableNumber(tableNumber, areaId)?.label || null;
}
