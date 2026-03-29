export type ExportFilters = {
  userId: string;
  userRole: string;
  actionType: string;
  actionCategory: string;
  resourceType: string;
  establishmentId: string;
  startDate: string;
  endDate: string;
  search: string;
};

type LogRow = {
  created_at: string;
  user_email: string;
  user_name: string;
  user_role: string;
  action_type: string;
  action_description: string;
  establishment_name: string | null;
};

function buildQueryParams(
  filters: ExportFilters,
  limit: number,
  offset: number
): URLSearchParams {
  const queryParams = new URLSearchParams();
  if (filters.userId) queryParams.append("userId", filters.userId);
  if (filters.userRole) queryParams.append("userRole", filters.userRole);
  if (filters.actionType) queryParams.append("actionType", filters.actionType);
  if (filters.actionCategory) queryParams.append("actionCategory", filters.actionCategory);
  if (filters.resourceType) queryParams.append("resourceType", filters.resourceType);
  if (filters.establishmentId) queryParams.append("establishmentId", filters.establishmentId);
  if (filters.startDate) queryParams.append("startDate", filters.startDate);
  if (filters.endDate) queryParams.append("endDate", filters.endDate);
  if (filters.search) queryParams.append("search", filters.search);
  queryParams.append("limit", String(limit));
  queryParams.append("offset", String(offset));
  return queryParams;
}

function formatDateBr(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

/**
 * Gera PDF com os logs filtrados (mesmos critérios da API).
 */
export async function exportActionLogsPdf(options: {
  apiUrl: string;
  token: string;
  filters: ExportFilters;
  totalRows: number;
}): Promise<void> {
  const { apiUrl, token, filters, totalRows } = options;
  const cap = Math.min(Math.max(totalRows, 1), 5000);
  const qs = buildQueryParams(filters, cap, 0);
  const url = `${apiUrl}/api/action-logs?${qs.toString()}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `Erro ${res.status} ao obter logs para exportação`);
  }

  const data = await res.json();
  const logs: LogRow[] = data.logs || [];

  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  let y = margin;

  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageW, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.text("Relatório de auditoria — Logs de ações", margin, 13);
  doc.setFontSize(8);
  doc.setTextColor(210, 210, 210);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} · Registos exportados: ${logs.length}`,
    margin,
    19
  );

  doc.setTextColor(30, 30, 30);
  y = 30;

  const rowH = 6;
  const col = {
    t: margin,
    email: margin + 38,
    nome: margin + 78,
    role: margin + 108,
    tipo: margin + 128,
    desc: margin + 152,
    est: margin + 232,
  };

  doc.setFillColor(234, 88, 12);
  doc.rect(margin, y - 4, pageW - 2 * margin, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.text("Data/Hora", col.t, y);
  doc.text("E-mail (autor)", col.email, y);
  doc.text("Nome", col.nome, y);
  doc.text("Função", col.role, y);
  doc.text("Tipo", col.tipo, y);
  doc.text("Descrição", col.desc, y);
  doc.text("Estab.", col.est, y);
  y += rowH + 2;
  doc.setTextColor(40, 40, 40);

  let i = 0;
  for (const log of logs) {
    if (y > pageH - margin - rowH) {
      doc.addPage();
      y = margin;
    }
    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 4, pageW - 2 * margin, rowH + 1, "F");
    }
    doc.setFontSize(6.5);
    doc.text(truncate(formatDateBr(log.created_at), 22), col.t, y);
    doc.text(truncate(log.user_email || "—", 28), col.email, y);
    doc.text(truncate(log.user_name || "—", 18), col.nome, y);
    doc.text(truncate(log.user_role || "—", 14), col.role, y);
    doc.text(truncate(log.action_type || "—", 18), col.tipo, y);
    doc.text(truncate(log.action_description || "—", 42), col.desc, y);
    doc.text(truncate(log.establishment_name || "—", 22), col.est, y);
    y += rowH;
    i += 1;
  }

  const safeName = `logs-auditoria-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeName);
}
