/**
 * Única fonte da verdade: grid fixo da planilha de check-in.
 * Cada item = uma linha da planilha, na ordem exata (imagem enviada).
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

/** Grid fixo: todas as linhas da planilha na ordem exata (cabeçalho + linhas de dados + separadores). */
export const CHECKIN_SHEET_ROWS: CheckinSheetRow[] = [
  { type: "header", line: 1 },
  { type: "header", line: 2 },
  { type: "header", line: 3 },
  { type: "header", line: 4 },
  { type: "header", line: 5 },
  // DECK
  { type: "data", areaName: "DECK", mesaName: "Lounge 1", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  { type: "data", areaName: "DECK", mesaName: "Lounge 2", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  { type: "data", areaName: "DECK", mesaName: "Lounge 3", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  { type: "data", areaName: "DECK", mesaName: "Lounge 4", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  { type: "data", areaName: "DECK", mesaName: "Mesa 05", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  { type: "data", areaName: "DECK", mesaName: "Mesa 06", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  { type: "data", areaName: "DECK", mesaName: "Mesa 07", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  { type: "data", areaName: "DECK", mesaName: "Mesa 08", limit: 6, areaColorLight: "CCFFCC", areaColorDark: "2E7D32" },
  // BAR CENTRAL
  { type: "data", areaName: "BAR CENTRAL", mesaName: "Bistrô ESPERA 11", limit: 2, areaColorLight: "CCFFFF", areaColorDark: "1565C0" },
  { type: "data", areaName: "BAR CENTRAL", mesaName: "Bistrô ESPERA 12", limit: 2, areaColorLight: "CCFFFF", areaColorDark: "1565C0" },
  { type: "data", areaName: "BAR CENTRAL", mesaName: "Bistrô ESPERA 13", limit: 2, areaColorLight: "CCFFFF", areaColorDark: "1565C0" },
  { type: "data", areaName: "BAR CENTRAL", mesaName: "Bistrô ESPERA 14", limit: 2, areaColorLight: "CCFFFF", areaColorDark: "1565C0" },
  // BALADA
  { type: "data", areaName: "BALADA", mesaName: "Camarote 30", limit: 6, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 20", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 31", limit: 6, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 21", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 32", limit: 6, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 22", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 33", limit: 8, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 23", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 24", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 25", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 26", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Bistrô 27", limit: 4, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Sócios", limit: 8, areaColorLight: "CCCCFF", areaColorDark: "3949AB", colSpan: 3, rowBgColor: "99CCFF" },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 34", limit: 8, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "data", areaName: "BALADA", mesaName: "Camarote 35", limit: 8, areaColorLight: "CCCCFF", areaColorDark: "3949AB" },
  { type: "separator" },
  // ROOFTOP
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge 40", limit: 6, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge 41", limit: 6, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge 42", limit: 6, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge Central 44", limit: 6, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge Central 45", limit: 6, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge Central 46", limit: 6, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Lounge Central 47", limit: 6, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 60", limit: 8, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 61", limit: 8, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 62", limit: 8, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 63", limit: 8, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 64", limit: 8, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bangalô 65", limit: 8, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 50", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 51", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 52", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 53", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 54", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 55", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Mesa 56", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 70", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 71", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 72", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  { type: "data", areaName: "ROOFTOP", mesaName: "Bistrô 73", limit: 2, areaColorLight: "E1BEE7", areaColorDark: "6A1B9A" },
  // ROTATIVO
  { type: "data", areaName: "ROTATIVO", mesaName: "BISTRÔ DE ESPERA (9 entradas)", limit: 0, areaColorLight: "FFCC99", areaColorDark: "E65100" },
  { type: "data", areaName: "ROTATIVO", mesaName: "LISTA DE ESPERA (7 entradas)", limit: 0, areaColorLight: "FFCC99", areaColorDark: "E65100" },
];

/** Índice da primeira linha de dados no array (após os 5 headers). */
export const CHECKIN_SHEET_DATA_START_INDEX = 5;
