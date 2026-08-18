/**
 * 2º giro (Bistrô) — Seu Justino e Pracinha.
 * Espelha services/bistroSecondGiro.js da API.
 */

const SECOND_GIRO_PROFILES = new Set(["seu_justino", "pracinha"]);

function toMinutes(timeStr: string | undefined): number | null {
  const t = String(timeStr || "").slice(0, 5);
  const [hh, mm] = t.split(":").map(Number);
  if (Number.isNaN(hh)) return null;
  let minutes = hh * 60 + (Number.isNaN(mm) ? 0 : mm);
  if (minutes < 6 * 60) minutes += 24 * 60;
  return minutes;
}

function weekdayFromDate(dateStr: string | undefined): number | null {
  const raw = String(dateStr || "").trim();
  const day = raw.includes("T") ? raw.split("T")[0] : raw;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const d = new Date(`${day}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.getDay();
}

export function isBistroProfile(profile?: string | null): boolean {
  return SECOND_GIRO_PROFILES.has(String(profile || ""));
}

export function isSecondGiroBistro(args: {
  date?: string;
  time?: string;
  profile?: string | null;
}): boolean {
  const profile = String(args.profile || "");
  if (!isBistroProfile(profile)) return false;
  const weekday = weekdayFromDate(args.date);
  const minutes = toMinutes(args.time);
  if (weekday == null || minutes == null) return false;

  if (profile === "pracinha" && weekday === 6) {
    return minutes >= 21 * 60;
  }
  if (weekday >= 2 && weekday <= 5) return minutes >= 21 * 60;
  if (weekday === 6 || weekday === 0) return minutes >= 15 * 60;
  return false;
}

export function notesIndicateEsperaAntecipada(notes?: string | null): boolean {
  return String(notes || "").toUpperCase().includes("ESPERA ANTECIPADA");
}

export function extractLinkedReservationId(notes?: string | null): number | null {
  const match = String(notes || "").match(
    /Reserva de Espera Antecipada \(ID:\s*(\d+)\)/i,
  );
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function stripEsperaAntecipadaNotes(notes?: string | null): string | null {
  const cleaned = String(notes || "")
    .replace(/\s*\|\s*ESPERA ANTECIPADA(?:\s*\(Bistrô\))?/gi, "")
    .replace(/ESPERA ANTECIPADA(?:\s*\(Bistrô\))?/gi, "")
    .replace(/\s*\|\s*$/, "")
    .replace(/^\s*\|\s*/, "")
    .trim();
  return cleaned || null;
}

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayLocalDateKey(): string {
  return toLocalDateKey(new Date());
}

export type ReservationKind = "restaurant" | "large";

export function reservationApiBase(kind?: ReservationKind | null): string {
  return kind === "large" ? "/api/large-reservations" : "/api/restaurant-reservations";
}
