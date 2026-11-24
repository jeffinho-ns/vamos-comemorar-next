import { brl, fmtData, hojeSp } from "../operacao/formato";
import {
  AUOP_PRIORIDADE_LABEL,
  AUOP_STATUS_LABEL,
  AUOP_TIPO_LABEL,
  auopAtrasado,
  auopSetorLabel,
  type ItemAuditoriaOp,
} from "./auditoriaOpTipos";

type JsPdfDoc = {
  internal: { pageSize: { getWidth: () => number; getHeight: () => number } };
  setFillColor: (...args: number[]) => void;
  setDrawColor: (...args: number[]) => void;
  setTextColor: (...args: number[]) => void;
  setFont: (family: string, style?: string) => void;
  setFontSize: (size: number) => void;
  setLineWidth: (w: number) => void;
  rect: (x: number, y: number, w: number, h: number, style?: string) => void;
  roundedRect: (x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string) => void;
  line: (x1: number, y1: number, x2: number, y2: number) => void;
  text: (
    text: string | string[],
    x: number,
    y: number,
    options?: { align?: "left" | "center" | "right"; maxWidth?: number }
  ) => void;
  splitTextToSize: (text: string, maxWidth: number) => string[];
  addPage: () => void;
  save: (filename: string) => void;
  setPage: (n: number) => void;
  getNumberOfPages: () => number;
};

type Col = { label: string; x: number; w: number };

function statusLabel(item: ItemAuditoriaOp, hoje: string) {
  return auopAtrasado(item, hoje) ? "Atrasado" : AUOP_STATUS_LABEL[item.status] ?? item.status;
}

function statusTone(item: ItemAuditoriaOp, hoje: string): [number, number, number] {
  if (auopAtrasado(item, hoje)) return [220, 70, 80];
  if (item.status === "concluido" || item.status === "aprovado") return [52, 180, 120];
  if (item.status === "negado") return [220, 70, 80];
  if (item.status === "aguardandoAprovacao") return [170, 120, 255];
  if (item.status === "andamento") return [240, 180, 60];
  return [90, 150, 220];
}

function prioridadeTone(prioridade: string): [number, number, number] {
  if (prioridade === "alta") return [220, 70, 80];
  if (prioridade === "baixa") return [90, 150, 220];
  return [240, 180, 60];
}

function resumo(itens: ItemAuditoriaOp[], hoje: string) {
  return {
    total: itens.length,
    atrasado: itens.filter((item) => auopAtrasado(item, hoje)).length,
    aberto: itens.filter((item) => item.status === "aberto").length,
    andamento: itens.filter((item) => item.status === "andamento").length,
    aguardando: itens.filter((item) => item.status === "aguardandoAprovacao").length,
    valor: itens.reduce((soma, item) => soma + (Number(item.valorEstimado) || 0), 0),
  };
}

function drawHeader(doc: JsPdfDoc, pageW: number, meta: string) {
  doc.setFillColor(18, 20, 26);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFillColor(234, 179, 8);
  doc.rect(0, 28, pageW, 1.2, "F");

  doc.setTextColor(250, 250, 250);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("Auditoria Operacional — Seu Justino", 12, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 186, 198);
  doc.text(meta, 12, 21);
}

function drawFooter(doc: JsPdfDoc, pageW: number, pageH: number, page: number, totalPages: number) {
  doc.setDrawColor(55, 60, 72);
  doc.setLineWidth(0.2);
  doc.line(12, pageH - 10, pageW - 12, pageH - 10);
  doc.setFontSize(7);
  doc.setTextColor(140, 146, 160);
  doc.text("BI Justino · Auditoria Operacional", 12, pageH - 5);
  doc.text(`Página ${page} de ${totalPages}`, pageW - 12, pageH - 5, { align: "right" });
}

function drawKpis(doc: JsPdfDoc, y: number, pageW: number, itens: ItemAuditoriaOp[], hoje: string) {
  const cards = resumo(itens, hoje);
  const gap = 4;
  const cardW = (pageW - 24 - gap * 5) / 6;
  const items = [
    { label: "Selecionados", value: String(cards.total), color: [234, 179, 8] as const },
    { label: "Atrasados", value: String(cards.atrasado), color: [220, 70, 80] as const },
    { label: "Abertos", value: String(cards.aberto), color: [90, 150, 220] as const },
    { label: "Em andamento", value: String(cards.andamento), color: [240, 180, 60] as const },
    { label: "Aguardando", value: String(cards.aguardando), color: [170, 120, 255] as const },
    { label: "Valor estimado", value: brl(cards.valor), color: [52, 180, 120] as const },
  ];

  items.forEach((card, index) => {
    const x = 12 + index * (cardW + gap);
    doc.setFillColor(28, 31, 40);
    doc.roundedRect(x, y, cardW, 16, 2, 2, "F");
    doc.setFillColor(...card.color);
    doc.rect(x, y, 1.4, 16, "F");
    doc.setFontSize(7);
    doc.setTextColor(160, 166, 180);
    doc.text(card.label, x + 4, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(245, 245, 245);
    doc.text(card.value, x + 4, y + 12);
    doc.setFont("helvetica", "normal");
  });

  return y + 20;
}

function tableColumns(pageW: number): Col[] {
  const margin = 12;
  const usable = pageW - margin * 2;
  const widths = [18, 22, 24, 22, 68, 28, 28, 18, 18, 22];
  const labels = [
    "Data",
    "Setor",
    "Status",
    "Tipo",
    "Descrição",
    "Responsável",
    "Empresa",
    "Prioridade",
    "Prazo",
    "Valor",
  ];
  const scale = usable / widths.reduce((a, b) => a + b, 0);
  let x = margin;
  return widths.map((width, index) => {
    const w = width * scale;
    const col = { label: labels[index], x, w };
    x += w;
    return col;
  });
}

function cellLines(doc: JsPdfDoc, value: string, maxWidth: number) {
  return doc.splitTextToSize(value || "—", Math.max(8, maxWidth - 2));
}

function rowValues(item: ItemAuditoriaOp, hoje: string) {
  return [
    fmtData(item.dataIdentificacao),
    auopSetorLabel(item.setor),
    statusLabel(item, hoje),
    AUOP_TIPO_LABEL[item.tipoServico] ?? item.tipoServico,
    item.descricaoProblema || "—",
    item.responsavelInterno || "—",
    item.empresaExecutora || "—",
    AUOP_PRIORIDADE_LABEL[item.prioridade] ?? item.prioridade,
    item.prazo ? fmtData(item.prazo) : "—",
    brl(item.valorEstimado),
  ];
}

/**
 * Gera PDF landscape com os itens de auditoria operacional selecionados.
 */
export async function exportAuditoriaOpPdf(itens: ItemAuditoriaOp[]): Promise<void> {
  if (!itens.length) {
    throw new Error("Marque pelo menos um item para exportar.");
  }

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" }) as unknown as JsPdfDoc;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const hoje = hojeSp();
  const geradoEm = new Date().toLocaleString("pt-BR");
  const cols = tableColumns(pageW);
  const meta = `Gerado em ${geradoEm} · ${itens.length} item(ns) selecionado(s) · referência ${fmtData(hoje)}`;

  const startTable = (withKpis: boolean) => {
    drawHeader(doc, pageW, meta);
    let y = 34;
    if (withKpis) y = drawKpis(doc, y, pageW, itens, hoje);

    doc.setFillColor(234, 179, 8);
    doc.roundedRect(12, y, pageW - 24, 8, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(20, 20, 20);
    cols.forEach((col) => doc.text(col.label, col.x + 1, y + 5.2));
    doc.setFont("helvetica", "normal");
    return y + 10;
  };

  let y = startTable(true);

  itens.forEach((item, index) => {
    const values = rowValues(item, hoje);
    const linesPerCell = values.map((value, colIndex) => cellLines(doc, value, cols[colIndex].w));
    const lineCount = Math.max(1, ...linesPerCell.map((lines) => lines.length));
    const rowH = Math.max(8, lineCount * 3.4 + 3);

    if (y + rowH > pageH - 14) {
      doc.addPage();
      y = startTable(false);
    }

    if (index % 2 === 0) {
      doc.setFillColor(32, 35, 45);
      doc.rect(12, y - 2.5, pageW - 24, rowH, "F");
    }

    doc.setDrawColor(48, 52, 64);
    doc.setLineWidth(0.15);
    doc.line(12, y - 2.5 + rowH, pageW - 12, y - 2.5 + rowH);

    values.forEach((value, colIndex) => {
      const col = cols[colIndex];
      const lines = linesPerCell[colIndex];
      if (colIndex === 2) {
        const [r, g, b] = statusTone(item, hoje);
        doc.setFillColor(r, g, b);
        doc.roundedRect(col.x + 0.5, y - 1.2, Math.min(col.w - 1, 22), 4.6, 1, 1, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6.5);
        doc.text(lines[0] || value, col.x + 1.5, y + 2);
        return;
      }
      if (colIndex === 7) {
        const [r, g, b] = prioridadeTone(item.prioridade);
        doc.setTextColor(r, g, b);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.text(lines[0] || value, col.x + 1, y + 2);
        doc.setFont("helvetica", "normal");
        return;
      }
      doc.setTextColor(230, 232, 238);
      doc.setFontSize(6.5);
      lines.forEach((line, lineIndex) => {
        doc.text(line, col.x + 1, y + 2 + lineIndex * 3.4);
      });
    });

    y += rowH;
  });

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    drawFooter(doc, pageW, pageH, page, totalPages);
  }

  doc.save(`auditoria-operacional-${new Date().toISOString().slice(0, 10)}.pdf`);
}
