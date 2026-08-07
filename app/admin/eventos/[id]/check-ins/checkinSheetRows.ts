/**
 * Única fonte da verdade: grid fixo da planilha de check-in do Highline.
 * Alinhado ao catálogo operacional (app/config/highlineReservationAreas.ts).
 * Excel e Modal consomem esta mesma lista.
 */

export type CheckinSheetRow =
  | { type: "header"; line: 1 | 2 | 3 | 4 | 5 }
  | {
      type: "data";
      areaName: string;
      mesaName: string;
      limit: number;
      areaColorLight: string;
      areaColorDark: string;
      colSpan?: number;
      rowBgColor?: string;
    }
  | { type: "separator" };

const DECK = { areaColorLight: "CCFFCC", areaColorDark: "2E7D32" } as const;
const BAR = { areaColorLight: "CCFFFF", areaColorDark: "1565C0" } as const;
const BALADA = { areaColorLight: "CCCCFF", areaColorDark: "3949AB" } as const;
const ROOF = { areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" } as const;
const ROT = { areaColorLight: "FFCC99", areaColorDark: "E65100" } as const;

/** Grid fixo: cabeçalho + linhas de dados + separadores. */
export const CHECKIN_SHEET_ROWS: CheckinSheetRow[] = [
  { type: "header", line: 1 },
  { type: "header", line: 2 },
  { type: "header", line: 3 },
  { type: "header", line: 4 },
  { type: "header", line: 5 },

  // DECK — Mesas
  { type: "data", areaName: "DECK", mesaName: "Mesa 01", limit: 8, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa 02", limit: 8, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa 03", limit: 8, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa 04", limit: 8, ...DECK },
  // DECK — Mesas Redondas
  { type: "data", areaName: "DECK", mesaName: "Mesa Redonda 09", limit: 6, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa Redonda 10", limit: 6, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa Redonda 11", limit: 6, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa Redonda 12", limit: 6, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa Redonda 13", limit: 2, ...DECK },
  { type: "data", areaName: "DECK", mesaName: "Mesa Redonda 14", limit: 2, ...DECK },

  // BAR CENTRAL — Bistrôs de Espera (consultar Roni)
  { type: "data", areaName: "BAR CENTRAL", mesaName: "Bistrô Espera 15", limit: 2, ...BAR },
  { type: "data", areaName: "BAR CENTRAL", mesaName: "Bistrô Espera 16", limit: 2, ...BAR },
  { type: "data", areaName: "BAR CENTRAL", mesaName: "Bistrô Espera 17", limit: 2, ...BAR },

  // BALADA — Camarotes + Bistrôs
  { type: "data", areaName: "BALADA", mesaName: "Camarote 30", limit: 6, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 20", limit: 4, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 31", limit: 6, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 21", limit: 4, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 32", limit: 6, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 22", limit: 4, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 33", limit: 8, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 23", limit: 4, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 24", limit: 4, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 25", limit: 4, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 26", limit: 4, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 27", limit: 4, ...BALADA },
  {
    type: "data",
    areaName: "BALADA",
    mesaName: "Sócios (avisar Roni)",
    limit: 8,
    ...BALADA,
    colSpan: 3,
    rowBgColor: "99CCFF",
  },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 34", limit: 8, ...BALADA },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 35", limit: 8, ...BALADA },

  { type: "separator" },

  // ROOFTOP — Lounges
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge 40", limit: 6, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge 41", limit: 6, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge 42", limit: 6, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge 43", limit: 6, ...ROOF },
  // ROOFTOP — Bangalôs
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 60", limit: 8, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 61", limit: 8, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 62", limit: 8, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 63", limit: 8, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 64", limit: 8, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 65", limit: 8, ...ROOF },
  // ROOFTOP — Mesas
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 50", limit: 2, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 51", limit: 2, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 52", limit: 2, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 53", limit: 2, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 54", limit: 4, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 55", limit: 4, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 56", limit: 4, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 74", limit: 4, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 75", limit: 4, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 76", limit: 4, ...ROOF },
  // ROOFTOP — Bistrôs
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 70", limit: 2, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 71", limit: 2, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 72", limit: 2, ...ROOF },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 73", limit: 2, ...ROOF },

  // ROTATIVO — Bistrôs de Espera (máx. 4)
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 01", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 02", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 03", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 04", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 05", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 06", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 07", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Bistrô de Espera 08", limit: 4, ...ROT },
  // ROTATIVO — Lista de Espera
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 01", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 02", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 03", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 04", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 05", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 06", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 07", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 08", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 09", limit: 4, ...ROT },
  { type: "data", areaName: "ROTATIVO", mesaName: "Lista de Espera 10", limit: 4, ...ROT },
];

/** Índice da primeira linha de dados no array (após os 5 headers). */
export const CHECKIN_SHEET_DATA_START_INDEX = 5;
