/**
 * Geração da planilha Excel de controle de check-in (portaria/recepção).
 * Layout 100% fixo; estrutura (áreas e mesas) vem do template mestre;
 * apenas dados das reservas preenchem os campos.
 */

import ExcelJS from "exceljs";
import {
  CHECKIN_SHEET_ROWS,
  CHECKIN_SHEET_DATA_START_INDEX,
} from "./checkinSheetRows";
import type { CheckinSheetRow } from "./checkinSheetRows";

const OBSERVACAO_PORTARIA =
  "Observação: Liberar a entrada apenas para maiores de 18 anos, sendo obrigatório a apresentação de um documento com foto ou documento Digital.";

/** Uma mesa dentro de uma área (nome + limite; opcional merge para linha especial como "Sócios") */
export interface MesaConfig {
  name: string;
  limit: number;
  /** Se definido, mescla E até E+colSpan-1 para esta linha (ex: "Sócios" = 3) */
  colSpan?: number;
  /** Cor de fundo especial para a linha (ex: Sócios = ciano) */
  rowBgColor?: string;
}

/** Área do estabelecimento com lista de mesas */
export interface AreaConfig {
  name: string;
  mesas: MesaConfig[];
  /** Cor clara para coluna E (mesas) - hex sem # */
  colorLight: string;
  /** Cor escura para rótulo K (texto branco) - hex sem # */
  colorDark: string;
}

/** Entrada do mapa de linha: localiza a linha da planilha para (área, mesa) */
export interface CheckinRowMapEntry {
  areaName: string;
  tableNumber: string;
  rowIndex: number;
}

/** Reserva no formato usado para preencher a planilha */
export interface ReservationForSheet {
  client_name?: string;
  client_phone?: string;
  number_of_people?: number;
  reservation_date?: string;
  reservation_time?: string;
  event_name?: string;
  table_number?: string | number;
  area_name?: string;
  area_id?: number;
  status?: string;
  notes?: string;
  admin_notes?: string;
  checked_in?: boolean;
  checkin_time?: string;
}

/** Opções para o template */
export interface TemplateOptions {
  eventDate?: string;
  eventName?: string;
  disponivel?: number;
  ocupado?: number;
}

/** Cores padrão por ordem de área (modelo visual) */
const AREA_COLORS: Pick<AreaConfig, "colorLight" | "colorDark">[] = [
  { colorLight: "CCFFCC", colorDark: "2E7D32" }, // verde DECK
  { colorLight: "CCFFFF", colorDark: "1565C0" }, // azul BAR CENTRAL
  { colorLight: "CCCCFF", colorDark: "3949AB" }, // azul BALADA
  { colorLight: "E1BEE7", colorDark: "6A1B9A" }, // roxo ROOFTOP
  { colorLight: "FFCC99", colorDark: "E65100" }, // laranja ROTATIVO
];

function applyThinBorders(cell: ExcelJS.Cell) {
  const thin: ExcelJS.Border = { style: "thin", color: { argb: "FF000000" } };
  cell.border = {
    top: thin,
    left: thin,
    bottom: thin,
    right: thin,
  };
}

function applyHeaderStyle(cell: ExcelJS.Cell) {
  cell.font = { bold: true };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  applyThinBorders(cell);
}

/**
 * ETAPA 1 — Template fixo.
 * Usa o template mestre de layout (ordem de áreas e mesas fixa).
 * Cria cabeçalho, colunas fixas, merges, cores por área, bordas e todas as áreas/mesas.
 * Nenhuma reserva entra aqui.
 */
export function buildCheckinSpreadsheetTemplate(
  options: TemplateOptions = {}
): { workbook: ExcelJS.Workbook; rowMap: CheckinRowMapEntry[] } {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Check-in", {
    views: [{ state: "frozen", ySplit: 5, activeCell: "A6" }],
  });

  const rowMap: CheckinRowMapEntry[] = [];
  const eventDate = options.eventDate || "";
  const eventName = options.eventName || "";
  const disponivel = options.disponivel ?? 248;
  const ocupado = options.ocupado ?? 0;

  // ——— Linha 1: PORTARIA | FEMININO/MASCULINO | OBSERVAÇÃO | LUGARES | QUEBRA ———
  sheet.mergeCells("A1:D1");
  const a1 = sheet.getCell("A1");
  a1.value = "PORTARIA";
  a1.alignment = { horizontal: "center", vertical: "middle" };
  a1.font = { bold: true };
  applyThinBorders(a1);

  sheet.mergeCells("E1:F1");
  const e1 = sheet.getCell("E1");
  e1.value = "FEMININO/MASCULINO";
  e1.alignment = { horizontal: "center", vertical: "middle" };
  e1.font = { bold: true };
  applyThinBorders(e1);

  sheet.mergeCells("G1:N1");
  const g1 = sheet.getCell("G1");
  g1.value = OBSERVACAO_PORTARIA;
  g1.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
  g1.font = { bold: true };
  applyThinBorders(g1);

  sheet.mergeCells("O1:P1");
  const o1 = sheet.getCell("O1");
  o1.value = "LUGARES";
  o1.alignment = { horizontal: "center", vertical: "middle" };
  o1.font = { bold: true };
  applyThinBorders(o1);

  const q1 = sheet.getCell("Q1");
  q1.value = "QUEBRA";
  applyHeaderStyle(q1);

  // ——— Linha 2: abaixo de LUGARES — O2 Disponível | P2 Ocupado ———
  const o2 = sheet.getCell("O2");
  o2.value = "Disponível";
  applyHeaderStyle(o2);
  const p2 = sheet.getCell("P2");
  p2.value = "Ocupado";
  applyHeaderStyle(p2);

  // ——— Linha 3: valores 248, 0, 0 (laranja/amarelo) ———
  sheet.mergeCells("O3:P3");
  const o3 = sheet.getCell("O3");
  o3.value = disponivel;
  o3.alignment = { horizontal: "center", vertical: "middle" };
  o3.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFE0B2" },
  };
  applyThinBorders(o3);
  const p3 = sheet.getCell("P3");
  p3.value = ocupado;
  p3.alignment = { horizontal: "center", vertical: "middle" };
  p3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0B2" } };
  applyThinBorders(p3);
  const q3 = sheet.getCell("Q3");
  q3.value = 0;
  q3.alignment = { horizontal: "center", vertical: "middle" };
  q3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0B2" } };
  applyThinBorders(q3);

  // ——— Linha 4: cabeçalhos das colunas ———
  const colHeaders = [
    "DATA DE ENTRADA",
    "Evento",
    "Sujeito a Alteração",
    "Nome",
    "MESAS",
    "TEL",
    "OBSERVAÇÃO",
    "LIMITE",
    "PESSOAS",
    "PRESENÇA",
  ];
  for (let c = 0; c < colHeaders.length; c++) {
    const col = c + 1;
    const cell = sheet.getCell(4, col);
    cell.value = colHeaders[c];
    applyHeaderStyle(cell);
  }
  // Mesclar A4:A5, B4:B5, ... J4:J5
  for (let col = 1; col <= 10; col++) {
    sheet.mergeCells(4, col, 5, col);
  }

  // ——— Linha 5: borda sob cabeçalhos; O5, P5, Q5 com valores ———
  for (let col = 1; col <= 10; col++) {
    const cell = sheet.getCell(5, col);
    applyThinBorders(cell);
  }
  const o5 = sheet.getCell("O5");
  o5.value = disponivel;
  o5.alignment = { horizontal: "center", vertical: "middle" };
  o5.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0B2" } };
  applyThinBorders(o5);
  const p5 = sheet.getCell("P5");
  p5.value = ocupado;
  p5.alignment = { horizontal: "center", vertical: "middle" };
  p5.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0B2" } };
  applyThinBorders(p5);
  const q5 = sheet.getCell("Q5");
  q5.value = 0;
  q5.alignment = { horizontal: "center", vertical: "middle" };
  q5.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE0B2" } };
  applyThinBorders(q5);

  // ——— A partir da linha 6: CHECKIN_SHEET_ROWS (data + separator) ———
  let currentRow = 6;
  const areaBlocks: { startRow: number; endRow: number; areaName: string }[] = [];
  let lastAreaName: string | null = null;
  let blockStart = 6;

  for (let i = CHECKIN_SHEET_DATA_START_INDEX; i < CHECKIN_SHEET_ROWS.length; i++) {
    const item = CHECKIN_SHEET_ROWS[i] as CheckinSheetRow;
    if (item.type === "separator") {
      if (lastAreaName !== null) {
        areaBlocks.push({ startRow: blockStart, endRow: currentRow - 1, areaName: lastAreaName });
        lastAreaName = null;
      }
      currentRow++;
      continue;
    }
    if (item.type !== "data") continue;

    if (lastAreaName !== null && lastAreaName !== item.areaName) {
      areaBlocks.push({ startRow: blockStart, endRow: currentRow - 1, areaName: lastAreaName });
      blockStart = currentRow;
    } else if (lastAreaName === null) {
      blockStart = currentRow;
    }
    lastAreaName = item.areaName;

    const row = currentRow;
    const colSpan = item.colSpan ?? 1;
    const bgColor = item.rowBgColor ?? item.areaColorLight;

    const cellA = sheet.getCell(row, 1);
    applyThinBorders(cellA);
    const cellB = sheet.getCell(row, 2);
    applyThinBorders(cellB);
    const cellC = sheet.getCell(row, 3);
    applyThinBorders(cellC);
    const cellD = sheet.getCell(row, 4);
    applyThinBorders(cellD);

    if (colSpan > 1) sheet.mergeCells(row, 5, row, 4 + colSpan);
    const cellE = sheet.getCell(row, 5);
    cellE.value = item.mesaName;
    cellE.alignment = { horizontal: "left", vertical: "middle" };
    applyThinBorders(cellE);
    cellE.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgColor } };
    if (colSpan > 1) {
      for (let cc = 6; cc <= 4 + colSpan; cc++) {
        const c = sheet.getCell(row, cc);
        applyThinBorders(c);
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + bgColor } };
      }
    }

    const cellF = sheet.getCell(row, 6);
    applyThinBorders(cellF);
    const cellG = sheet.getCell(row, 7);
    applyThinBorders(cellG);
    const cellH = sheet.getCell(row, 8);
    cellH.value = item.limit;
    cellH.alignment = { horizontal: "center", vertical: "middle" };
    applyThinBorders(cellH);
    cellH.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF" + item.areaColorLight } };
    const cellI = sheet.getCell(row, 9);
    applyThinBorders(cellI);
    const cellJ = sheet.getCell(row, 10);
    applyThinBorders(cellJ);

    rowMap.push({
      areaName: item.areaName,
      tableNumber: item.mesaName,
      rowIndex: row,
    });
    currentRow++;
  }
  if (lastAreaName !== null) {
    areaBlocks.push({ startRow: blockStart, endRow: currentRow - 1, areaName: lastAreaName });
  }

  for (const block of areaBlocks) {
    sheet.mergeCells(block.startRow, 11, block.endRow, 11);
    const labelK = sheet.getCell(block.startRow, 11);
    labelK.value = block.areaName;
    labelK.alignment = { horizontal: "center", vertical: "middle", textRotation: 90 };
    labelK.font = { bold: true, color: { argb: "FFFFFFFF" } };
    const dark = CHECKIN_SHEET_ROWS.find(
      (r): r is Extract<CheckinSheetRow, { type: "data" }> =>
        r.type === "data" && r.areaName === block.areaName
    );
    labelK.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF" + (dark?.areaColorDark ?? "333333") },
    };
    applyThinBorders(labelK);
  }

  // Larguras das colunas (modelo visual)
  sheet.getColumn(1).width = 14;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 14;
  sheet.getColumn(4).width = 22;
  sheet.getColumn(5).width = 18;
  sheet.getColumn(6).width = 14;
  sheet.getColumn(7).width = 20;
  sheet.getColumn(8).width = 8;
  sheet.getColumn(9).width = 8;
  sheet.getColumn(10).width = 10;
  sheet.getColumn(11).width = 12;

  return { workbook, rowMap };
}

/**
 * ETAPA 3 — Preenchimento.
 * Preenche somente quando: reserva.area_name === row.areaName && reserva.table_number === row.mesaName (exato).
 * Nenhuma normalização, nenhuma inferência.
 */
export function fillReservationsIntoSheet(
  sheet: ExcelJS.Worksheet,
  reservations: ReservationForSheet[],
  rowMap: CheckinRowMapEntry[],
  options: {
    formatDate?: (dateStr: string) => string;
    formatTime?: (timeStr?: string) => string;
  } = {},
): void {
  const formatDate = options.formatDate ?? ((d: string) => d || "");
  const formatTime =
    options.formatTime ??
    ((t?: string) => (t && t.trim() ? String(t).slice(0, 5) : "") || "");

  const normalize = (s: string) =>
    (s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  const extractNumber = (s: string): string =>
    (s || "").replace(/\D/g, "") || "";
  const toInt = (s: string): number =>
    s ? parseInt(s, 10) : NaN;
  const noSpaces = (s: string) => (s || "").replace(/\s/g, "");
  for (const r of reservations) {
    const areaRes = normalize(r.area_name || "");
    const tableRes = normalize(
      r.table_number != null ? String(r.table_number) : "",
    );
    const tableNumRes = extractNumber(
      r.table_number != null ? String(r.table_number) : "",
    );
    const tableNumInt = toInt(tableNumRes);
    const entry = rowMap.find((e) => {
      const eArea = normalize(e.areaName);
      const eTable = normalize(e.tableNumber);
      const mesaNum = extractNumber(e.tableNumber);
      const mesaNumInt = toInt(mesaNum);
      const areaMatch =
        eArea === areaRes ||
        eArea.includes(areaRes) ||
        areaRes.includes(eArea);
      if (!areaMatch) return false;
      if (eTable === tableRes) return true;
      if (noSpaces(eTable) === noSpaces(tableRes)) return true;
      if (
        !isNaN(tableNumInt) &&
        !isNaN(mesaNumInt) &&
        tableNumInt === mesaNumInt
      )
        return true;
      if (tableRes && eTable.includes(tableRes)) return true;
      if (tableRes && tableRes.includes(eTable)) return true;
      return false;
    });
    if (!entry) continue;
    const rowIndex = entry.rowIndex;

    const row = sheet.getRow(rowIndex);

    const cellD = row.getCell(4);
    if (cellD && (cellD.value === undefined || cellD.value === null || cellD.value === "")) {
      cellD.value = (r.client_name || "").trim() || undefined;
    }

    const cellF = row.getCell(6);
    if (cellF && (cellF.value === undefined || cellF.value === null || cellF.value === "")) {
      cellF.value = (r.client_phone || "").trim() || undefined;
    }

    const cellI = row.getCell(9);
    if (cellI && (cellI.value === undefined || cellI.value === null || cellI.value === "")) {
      const num = typeof r.number_of_people === "number" ? r.number_of_people : parseInt(String(r.number_of_people || "0"), 10) || 0;
      cellI.value = num;
    }

    const cellJ = row.getCell(10);
    if (cellJ && (cellJ.value === undefined || cellJ.value === null || cellJ.value === "")) {
      const presenca = r.checked_in || (r.checkin_time ? "Sim" : "") ? "Sim" : "";
      cellJ.value = presenca;
    }

    const cellA = row.getCell(1);
    if (cellA && (cellA.value === undefined || cellA.value === null || cellA.value === "") && r.reservation_date) {
      cellA.value = formatDate(String(r.reservation_date).split("T")[0] || "");
    }

    const cellB = row.getCell(2);
    if (cellB && (cellB.value === undefined || cellB.value === null || cellB.value === "") && r.event_name) {
      cellB.value = (r.event_name || "").trim() || undefined;
    }

    const cellG = row.getCell(7);
    if (cellG && (cellG.value === undefined || cellG.value === null || cellG.value === "") && (r.notes || r.admin_notes)) {
      cellG.value = (r.notes || r.admin_notes || "").trim() || undefined;
    }
  }
}

/**
 * Constrói AreaConfig[] a partir das áreas da API e do mapa de mesas (estado da página).
 * Se areasFromApi estiver vazio, retorna array vazio (template sem áreas).
 */
export function buildAreasConfigFromApi(
  areasFromApi: Array< { id: number; name: string }>,
  mesasMap: Map<string, Array<{ area_id: number; area_name: string; table_number: string; capacity?: number }>>,
  defaultLimit = 6
): AreaConfig[] {
  const config: AreaConfig[] = [];
  for (let i = 0; i < areasFromApi.length; i++) {
    const area = areasFromApi[i];
    const key = `area_${area.id}`;
    const tables = mesasMap.get(key) || [];
    const colors = AREA_COLORS[i % AREA_COLORS.length];
    config.push({
      name: area.name,
      colorLight: colors.colorLight,
      colorDark: colors.colorDark,
      mesas: tables.map((t) => ({
        name: t.table_number || "",
        limit: typeof t.capacity === "number" && t.capacity > 0 ? t.capacity : defaultLimit,
      })),
    });
  }
  return config;
}
