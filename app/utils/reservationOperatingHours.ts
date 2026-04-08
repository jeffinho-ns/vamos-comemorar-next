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

export function getConfiguredWindows(
  dateStr: string,
  weekly: WeeklyOperatingSetting[],
  overrides: DateOperatingOverride[],
): TimeWindow[] | null {
  if (!dateStr) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  const weekday = date.getDay();

  const override = overrides.find((o) => o.override_date === dateStr);
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
