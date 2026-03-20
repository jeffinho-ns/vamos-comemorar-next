import { Reservation } from "@/app/types/reservation";

export function getSeuJustinoAreaName(
  tableNumber?: string | number,
  areaName?: string,
  areaId?: number,
): string {
  if (!tableNumber && !areaName && !areaId) return areaName || "";

  const tableNum = String(tableNumber || "").trim();

  const seuJustinoSubareas = [
    { area_id: 1, label: "Lounge Aquario Spaten", tableNumbers: ["210"] },
    { area_id: 1, label: "Lounge Aquario TV", tableNumbers: ["208"] },
    { area_id: 1, label: "Lounge Palco", tableNumbers: ["204", "206"] },
    { area_id: 1, label: "Lounge Bar", tableNumbers: ["200", "202"] },
    { area_id: 2, label: "Quintal Lateral Esquerdo", tableNumbers: ["20", "22", "24", "26", "28", "29"] },
    { area_id: 2, label: "Quintal Central Esquerdo", tableNumbers: ["30", "32", "34", "36", "38", "39"] },
    { area_id: 2, label: "Quintal Central Direito", tableNumbers: ["40", "42", "44", "46", "48"] },
    { area_id: 2, label: "Quintal Lateral Direito", tableNumbers: ["50", "52", "54", "56", "58", "60", "62", "64"] },
  ];

  if (tableNum) {
    const tableNumbers = tableNum.includes(",")
      ? tableNum.split(",").map((t) => t.trim())
      : [tableNum];
    for (const tn of tableNumbers) {
      const subarea = seuJustinoSubareas.find((sub) => sub.tableNumbers.includes(tn));
      if (subarea) return subarea.label;
    }
  }

  if (areaName) {
    const normalized = areaName.toLowerCase();
    if (seuJustinoSubareas.some((sub) => sub.label.toLowerCase() === normalized)) {
      return areaName;
    }

    if (normalized.includes("coberta") || normalized.includes("descoberta")) {
      if (areaId === 1) return "Lounge";
      if (areaId === 2) return "Quintal";
    }
  }

  return areaName || "";
}

export function getReservationAreaLabel(reservation: Reservation): string {
  const establishmentName = String((reservation as any).establishment_name || "").toLowerCase();
  const isSeuJustino =
    establishmentName.includes("seu justino") && !establishmentName.includes("pracinha");

  const areaName = String((reservation as any).area_name || "").trim();
  const tableNumber = (reservation as any).table_number as string | number | undefined;
  const areaId = (reservation as any).area_id as number | undefined;

  if (isSeuJustino && tableNumber) {
    const mapped = getSeuJustinoAreaName(tableNumber, areaName, areaId).trim();
    return mapped || areaName || "Sem área";
  }

  return areaName || "Sem área";
}
