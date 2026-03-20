import { Reservation } from "@/app/types/reservation";
import {
  getReservationStatusText,
  isReservationStatusOneOf,
  normalizeReservationStatus,
} from "@/app/utils/reservationStatus";
import { getReservationAreaLabel } from "@/app/utils/reservationDayModalShared";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDatePt(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Cores alinhadas a `getReservationStatusColor` + Tailwind (badges do modal). */
function getStatusBadgeStyle(
  status: string,
  notes: string | undefined,
  isReservaRooftop: boolean,
): string {
  if (notes?.includes("ESPERA ANTECIPADA")) {
    return "background:#ffedd5;color:#9a3412;border:1px solid #fed7aa;";
  }
  const normalized = normalizeReservationStatus(status);
  const seated = isReservaRooftop
    ? "background:#e0e7ff;color:#3730a3;border:1px solid #c7d2fe;"
    : "background:#dbeafe;color:#1e40af;border:1px solid #bfdbfe;";
  switch (normalized) {
    case "new":
      return "background:#e0f2fe;color:#075985;border:1px solid #bae6fd;";
    case "confirmed":
      return "background:#dcfce7;color:#166534;border:1px solid #bbf7d0;";
    case "cancelled":
      return "background:#fee2e2;color:#991b1b;border:1px solid #fecaca;";
    case "seated":
      return seated;
    case "pending":
      return "background:#fef3c7;color:#92400e;border:1px solid #fde68a;";
    case "completed":
      return "background:#f3f4f6;color:#1f2937;border:1px solid #e5e7eb;";
    case "no-show":
      return "background:#f1f5f9;color:#1e293b;border:1px solid #e2e8f0;";
    default:
      return "background:#f3f4f6;color:#1f2937;border:1px solid #e5e7eb;";
  }
}

type AreaBreakdownItem = { name: string; people: number };

function buildDayData(reservations: Reservation[]) {
  const map = new Map<string, number>();
  reservations.forEach((r) => {
    const area = getReservationAreaLabel(r);
    const people = Number((r as any).number_of_people ?? 0) || 0;
    map.set(area, (map.get(area) || 0) + people);
  });
  const areasBreakdown: AreaBreakdownItem[] = Array.from(map.entries())
    .map(([name, people]) => ({ name, people }))
    .sort((a, b) => b.people - a.people);

  const areaPeopleTotal = areasBreakdown.reduce(
    (sum, x) => sum + (Number(x.people) || 0),
    0,
  );

  const reservationsCheckedIn = reservations.filter((r) =>
    isReservationStatusOneOf((r as any).status, ["seated", "completed"]),
  ).length;

  const totalPeopleExpected = reservations.reduce(
    (sum, r) => sum + (Number((r as any).number_of_people ?? 0) || 0),
    0,
  );

  const sorted = reservations.slice();
  sorted.sort((a: any, b: any) => {
    const ta = String(a.reservation_time || "");
    const tb = String(b.reservation_time || "");
    if (ta && tb) return ta.localeCompare(tb);
    if (ta) return -1;
    if (tb) return 1;
    return String(a.client_name || "").localeCompare(String(b.client_name || ""));
  });

  return {
    areaPeopleTotal,
    reservationsCheckedIn,
    totalPeopleExpected,
    sortedReservations: sorted,
  };
}

/**
 * Abre uma janela de impressão com o mesmo conteúdo visual do modal de reservas do dia
 * (o usuário pode salvar como PDF pelo diálogo do navegador).
 */
export function printReservationsDayPdf(
  date: Date,
  reservations: Reservation[],
  isReservaRooftop: boolean,
  establishmentName?: string,
): void {
  const {
    areaPeopleTotal,
    reservationsCheckedIn,
    totalPeopleExpected,
    sortedReservations,
  } = buildDayData(reservations);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Por favor, permita pop-ups para gerar o PDF das reservas.");
    return;
  }

  const titleLine = `Reservas • ${formatDatePt(date)}`;
  const subCount = `${reservations.length} reserva${reservations.length !== 1 ? "s" : ""} no dia`;

  const reservationRows =
    sortedReservations.length === 0
      ? `<p style="text-align:center;color:#6b7280;padding:32px;">Nenhuma reserva neste dia.</p>`
      : sortedReservations
          .map((reservation) => {
            const notes = (reservation as any).notes as string | undefined;
            const tableNumber = (reservation as any).table_number as string | number | undefined;
            const statusText = (() => {
              if (notes?.includes("ESPERA ANTECIPADA")) return "ESPERA ANTECIPADA";
              return getReservationStatusText((reservation as any).status, {
                isReservaRooftop,
              });
            })();
            const areaName = getReservationAreaLabel(reservation);
            const time = String((reservation as any).reservation_time || "").trim();
            const people = Number((reservation as any).number_of_people ?? 0) || 0;
            const observation = notes
              ? notes.replace(/ESPERA ANTECIPADA/gi, "").trim()
              : "";
            const tableStr =
              tableNumber !== undefined &&
              tableNumber !== null &&
              String(tableNumber).trim() !== ""
                ? String(tableNumber)
                : "-";
            const esperaBadge =
              notes && notes.includes("ESPERA ANTECIPADA")
                ? `<span style="flex-shrink:0;border-radius:9999px;background:#ffedd5;color:#9a3412;padding:2px 8px;font-size:10px;font-weight:700;">⏳ ESPERA</span>`
                : "";

            const birthdayPrefix =
              notes && notes.includes("🎂")
                ? `<span style="font-size:18px;line-height:1;margin-right:4px;" aria-hidden="true">🎂</span>`
                : "";

            const badgeStyle = getStatusBadgeStyle(
              (reservation as any).status,
              notes,
              isReservaRooftop,
            );

            return `
    <div style="page-break-inside:avoid;border:1px solid #e5e7eb;border-radius:12px;background:#fff;padding:12px 16px;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,0.05);">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div style="min-width:0;flex:1;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            ${birthdayPrefix}<span style="font-size:16px;font-weight:800;color:#111827;word-break:break-word;line-height:1.25;">${escapeHtml(String((reservation as any).client_name || "Sem nome"))}</span>
            ${esperaBadge}
          </div>
          <div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:center;column-gap:12px;row-gap:4px;font-size:14px;font-weight:600;color:#4b5563;">
            <span style="font-variant-numeric:tabular-nums;">${escapeHtml(time || "--:--")}</span>
            <span style="font-variant-numeric:tabular-nums;">${people}p</span>
          </div>
          <div style="margin-top:4px;width:100%;font-size:14px;font-weight:600;color:#374151;word-break:break-word;line-height:1.35;">${escapeHtml(areaName)}</div>
          <div style="margin-top:4px;display:flex;flex-wrap:wrap;align-items:flex-start;gap:6px 8px;font-size:11px;font-weight:600;color:#4b5563;">
            <span style="white-space:nowrap;flex-shrink:0;">Mesa: ${escapeHtml(tableStr)}</span>
            <span style="min-width:0;flex:1;word-break:break-word;white-space:pre-wrap;">Obs: ${observation ? escapeHtml(observation) : "-"}</span>
          </div>
        </div>
        <span style="flex-shrink:0;align-self:flex-start;border-radius:9999px;padding:4px 8px;font-size:11px;font-weight:700;line-height:1.25;${badgeStyle}">${escapeHtml(statusText)}</span>
      </div>
    </div>`;
          })
          .join("");

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(titleLine)}</title>
  <style>
    @media print {
      @page { margin: 14mm; size: A4; }
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #111827; background: #fff; }
  </style>
</head>
<body>
  <header style="border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:16px;">
    ${
      establishmentName
        ? `<p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6b7280;">${escapeHtml(establishmentName.trim())}</p>`
        : ""
    }
    <h1 style="margin:0;font-size:18px;font-weight:800;color:#111827;line-height:1.3;">${escapeHtml(titleLine)}</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#4b5563;">${escapeHtml(subCount)}</p>

    <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px;">
      <div style="border:1px solid #bae6fd;border-radius:12px;background:#f0f9ff;padding:8px 10px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:10px;font-weight:700;color:#0369a1;margin-bottom:4px;">
          <span>Área</span>
        </div>
        <div style="font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;color:#111827;line-height:1.1;">${areaPeopleTotal}</div>
        <div style="font-size:10px;color:#0369a1;opacity:0.85;margin-top:2px;">Pessoas por área</div>
      </div>
      <div style="border:1px solid #a7f3d0;border-radius:12px;background:#ecfdf5;padding:8px 10px;">
        <div style="font-size:10px;font-weight:700;color:#047857;margin-bottom:4px;">Reservas</div>
        <div style="font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;color:#111827;line-height:1.1;">${reservationsCheckedIn}/${reservations.length}</div>
        <div style="font-size:10px;color:#047857;opacity:0.85;margin-top:2px;">Check-ins / total</div>
      </div>
      <div style="border:1px solid #fde68a;border-radius:12px;background:#fffbeb;padding:8px 10px;">
        <div style="font-size:10px;font-weight:700;color:#b45309;margin-bottom:4px;">Pessoas</div>
        <div style="font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;color:#111827;line-height:1.1;">${totalPeopleExpected}</div>
        <div style="font-size:10px;color:#b45309;opacity:0.85;margin-top:2px;">Total previsto</div>
      </div>
    </div>
  </header>

  <section>
    ${reservationRows}
  </section>
</body>
</html>`;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  let printed = false;
  const runPrint = () => {
    if (printed) return;
    printed = true;
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      /* noop */
    }
  };

  const schedule = () => setTimeout(runPrint, 150);

  if (printWindow.document.readyState === "complete") {
    schedule();
  } else {
    printWindow.onload = schedule;
  }
  setTimeout(() => {
    if (!printed) runPrint();
  }, 650);
}
