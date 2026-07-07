export interface WeeklyOperatingSetting {
  weekday: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  second_start_time?: string | null;
  second_end_time?: string | null;
}

export interface DateOperatingOverride {
  override_date: string;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
  second_start_time?: string | null;
  second_end_time?: string | null;
}

export interface TimeWindow {
  start: string;
  end: string;
  label: string;
}

const labelFromWindow = (start: string, end: string) => `${start}–${end}`;

/** Normaliza YYYY-MM-DD (API pode retornar timestamp em texto). */
function normalizeDateKey(value: string | null | undefined): string {
  if (!value) return "";
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getConfiguredWindows(
  dateStr: string,
  weekly: WeeklyOperatingSetting[],
  overrides: DateOperatingOverride[],
): TimeWindow[] | null {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const weekday = date.getDay();

  const override = overrides.find(
    (o) => normalizeDateKey(o.override_date) === normalizeDateKey(dateStr),
  );
  if (override) {
    if (!override.is_open) return [];
    const windows: TimeWindow[] = [];
    if (override.start_time && override.end_time) {
      windows.push({
        start: override.start_time.slice(0, 5),
        end: override.end_time.slice(0, 5),
        label: labelFromWindow(
          override.start_time.slice(0, 5),
          override.end_time.slice(0, 5),
        ),
      });
    }
    if (override.second_start_time && override.second_end_time) {
      windows.push({
        start: override.second_start_time.slice(0, 5),
        end: override.second_end_time.slice(0, 5),
        label: labelFromWindow(
          override.second_start_time.slice(0, 5),
          override.second_end_time.slice(0, 5),
        ),
      });
    }
    return windows;
  }

  const day = weekly.find((w) => Number(w.weekday) === weekday);
  if (!day) return null;
  if (!day.is_open) return [];

  const windows: TimeWindow[] = [];
  if (day.start_time && day.end_time) {
    windows.push({
      start: day.start_time.slice(0, 5),
      end: day.end_time.slice(0, 5),
      label: labelFromWindow(day.start_time.slice(0, 5), day.end_time.slice(0, 5)),
    });
  }
  if (day.second_start_time && day.second_end_time) {
    windows.push({
      start: day.second_start_time.slice(0, 5),
      end: day.second_end_time.slice(0, 5),
      label: labelFromWindow(
        day.second_start_time.slice(0, 5),
        day.second_end_time.slice(0, 5),
      ),
    });
  }
  return windows;
}

/** Fallback legado Highline (sex/sáb + subáreas) quando não há config no admin. */
export function getHighlineLegacyTimeWindows(
  dateStr: string,
  subareaKey?: string,
): TimeWindow[] {
  if (!dateStr) return [];
  const date = new Date(`${dateStr}T00:00:00`);
  const weekday = date.getDay();
  const windows: TimeWindow[] = [];
  const isRooftop = subareaKey ? subareaKey.startsWith("roof") : false;
  const isDeckOrBar = subareaKey
    ? subareaKey.startsWith("deck") || subareaKey === "bar"
    : false;

  if (weekday === 5) {
    windows.push({
      start: "18:00",
      end: "21:00",
      label: "Sexta-feira: 18:00–21:00",
    });
  } else if (weekday === 6) {
    if (isRooftop) {
      windows.push({
        start: "14:00",
        end: "17:00",
        label: "Sábado Rooftop: 14:00–17:00",
      });
    } else if (isDeckOrBar) {
      windows.push({
        start: "14:00",
        end: "20:00",
        label: "Sábado Deck: 14:00–20:00",
      });
    } else {
      windows.push({
        start: "14:00",
        end: "17:00",
        label: "Sábado Rooftop: 14:00–17:00",
      });
      windows.push({
        start: "14:00",
        end: "20:00",
        label: "Sábado Deck: 14:00–20:00",
      });
    }
  }
  return windows;
}

/**
 * Horários Highline: prioriza config do admin (semanal + exceções por data);
 * cai no legado sex/sáb só se não houver configuração salva.
 */
export function getHighlineTimeWindows(
  dateStr: string,
  weekly: WeeklyOperatingSetting[],
  overrides: DateOperatingOverride[],
  subareaKey?: string,
): TimeWindow[] {
  if (!dateStr) return [];

  if (weekly.length > 0 || overrides.length > 0) {
    const configured = getConfiguredWindows(dateStr, weekly, overrides);
    if (configured !== null) return configured;
  }

  return getHighlineLegacyTimeWindows(dateStr, subareaKey);
}
