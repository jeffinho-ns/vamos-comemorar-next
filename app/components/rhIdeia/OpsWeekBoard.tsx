"use client";

import { useEffect, useState } from "react";
import { iriFetch } from "../../lib/rhIdeia/api";
import { IRI_BTN_SECONDARY, IRI_CARD, IRI_MUTED, IRI_SOFT } from "./ui";

type Slot = {
  at: string | null;
  by_name: string | null;
  nao_ok: number;
  incidents: number;
};

type DayCell = {
  date: string;
  abertura: Slot | null;
  fechamento: Slot | null;
};

type Board = {
  establishment_name: string | null;
  sector_name: string | null;
  start: string | null;
  end: string | null;
  days: { date: string; label: string }[];
  sectors: { key: string; name: string; days: DayCell[] }[];
};

function shiftWeek(start: string, days: number): string {
  const [year, month, day] = start.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function Mark({ label, slot }: { label: string; slot: Slot | null }) {
  if (!slot) {
    return <p className="text-[11px] text-slate-400">{label} não feito</p>;
  }
  const extra = [
    slot.nao_ok > 0 ? `${slot.nao_ok} não ok` : "",
    slot.incidents > 0 ? `${slot.incidents} ocorrência${slot.incidents === 1 ? "" : "s"}` : "",
  ].filter(Boolean);
  return (
    <p className="text-[11px] leading-snug text-slate-800">
      <span className="font-semibold text-teal-800">{label}</span> {slot.at || "—"}
      {slot.by_name ? ` · ${slot.by_name}` : ""}
      {extra.length > 0 ? <span className="block text-amber-800">{extra.join(" · ")}</span> : null}
    </p>
  );
}

export function OpsWeekBoard({ establishmentId }: { establishmentId?: number | null }) {
  const [start, setStart] = useState<string | undefined>(undefined);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const query: Record<string, string | number> = {};
    if (start) query.start = start;
    if (establishmentId != null && Number.isFinite(establishmentId)) {
      query.establishment_id = establishmentId;
    }
    iriFetch<Board>("/playbook/week-board", {}, query).then((res) => {
      if (cancelled) return;
      if (!res.success || !res.data) {
        setBoard(null);
        setError(res.message || null);
        return;
      }
      setError(null);
      setBoard(res.data);
      if (res.data.start) setStart(res.data.start);
    });
    return () => {
      cancelled = true;
    };
  }, [start, establishmentId]);

  if (error) return <p className={`text-sm ${IRI_SOFT}`}>{error}</p>;
  if (!board?.start) return null;

  const scope = board.sector_name
    ? `${board.establishment_name} · ${board.sector_name}`
    : board.establishment_name;

  return (
    <section className={IRI_CARD}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Semana da operação</h2>
          <p className={`mt-1 text-sm ${IRI_MUTED}`}>
            {scope}. Abertura e fechamento concluídos no Justino360, com o horário real.
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={IRI_BTN_SECONDARY} onClick={() => setStart(shiftWeek(board.start!, -7))}>
            Semana anterior
          </button>
          <button type="button" className={IRI_BTN_SECONDARY} onClick={() => setStart(shiftWeek(board.start!, 7))}>
            Próxima
          </button>
        </div>
      </div>
      {board.sectors.length === 0 ? (
        <p className={`text-sm ${IRI_MUTED}`}>Nenhum checklist de abertura ou fechamento nesta casa.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-stone-200 text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3 font-medium">Setor</th>
                {board.days.map((day) => (
                  <th key={day.date} className="px-2 py-2 font-medium">
                    {day.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {board.sectors.map((sector) => (
                <tr key={sector.key} className="border-b border-stone-100 align-top last:border-0">
                  <td className="py-3 pr-3 text-sm font-medium text-slate-900">{sector.name}</td>
                  {sector.days.map((cell) => (
                    <td key={cell.date} className="px-2 py-3">
                      <Mark label="Abriu" slot={cell.abertura} />
                      <Mark label="Fechou" slot={cell.fechamento} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
